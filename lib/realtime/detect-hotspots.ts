'use server'

import { createClient } from '@/lib/supabase/server'

export interface Hotspot {
  id: string
  latitude: number
  longitude: number
  count: number
  reports: {
    id: string
    title: string
    category: string
    address: string
  }[]
  radiusMeters: number
}

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000 // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

export async function detectHotspots(): Promise<Hotspot[]> {
  const supabase = await createClient()

  // Fetch active (unresolved, undismissed) reports with severity = 'High'
  const { data: reports, error } = await supabase
    .from('reports')
    .select('id', { head: false })
    .select('id, title, category, address, latitude, longitude, severity, status')
    .eq('severity', 'High')
    .not('status', 'in', '("resolved","dismissed")')

  if (error) {
    throw new Error(error.message)
  }

  if (!reports || reports.length === 0) {
    return []
  }

  const hotspots: Hotspot[] = []
  const visited = new Set<string>()

  // Simple Density-based Clustering (DBSCAN-like centroid clustering)
  for (const report of reports) {
    if (visited.has(report.id)) {
      continue
    }

    const neighbors = reports.filter((other) => {
      const dist = getDistanceMeters(
        report.latitude,
        report.longitude,
        other.latitude,
        other.longitude
      )
      return dist <= 150
    })

    if (neighbors.length >= 3) {
      // Calculate centroid of the group
      let sumLat = 0
      let sumLng = 0
      for (const n of neighbors) {
        sumLat += n.latitude
        sumLng += n.longitude
        visited.add(n.id) // mark as part of a cluster
      }

      const avgLat = sumLat / neighbors.length
      const avgLng = sumLng / neighbors.length

      hotspots.push({
        id: `hotspot-${report.id}`,
        latitude: avgLat,
        longitude: avgLng,
        count: neighbors.length,
        radiusMeters: 150,
        reports: neighbors.map((n) => ({
          id: n.id,
          title: n.title,
          category: n.category,
          address: n.address,
        })),
      })
    }
  }

  return hotspots
}
