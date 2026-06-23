'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

import { calculateTrustScore } from '@/lib/trust-score/calculate-trust-score'
import type { ReportWithStats } from '@/types/community'

interface MapViewProps {
  reports: ReportWithStats[]
}

const SEVERITY_COLORS: Record<string, string> = {
  High: '#ef4444',
  Medium: '#f59e0b',
  Low: '#22c55e',
}

function createPopupHTML(report: ReportWithStats) {
  const trust = calculateTrustScore({
    verifications: report.verification_count,
    votes: report.vote_count,
    createdAt: report.created_at,
  })
  const color = SEVERITY_COLORS[report.severity] ?? '#6b7280'

  return `
    <div style="font-family:system-ui,sans-serif;max-width:220px;padding:4px 0;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;"></span>
        <span style="font-size:13px;font-weight:600;line-height:1.3;">${report.title}</span>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
        <span style="background:rgba(255,255,255,0.1);border-radius:99px;padding:2px 8px;font-size:11px;">${report.category}</span>
        <span style="background:${color}22;color:${color};border-radius:99px;padding:2px 8px;font-size:11px;">${report.severity}</span>
      </div>
      <div style="font-size:11px;color:#9ca3af;margin-bottom:6px;">Trust: <strong style="color:#d1d5db;">${trust.label}</strong> (${trust.score})</div>
      <a href="/report/${report.id}" style="display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:500;color:#60a5fa;text-decoration:none;">
        View details →
      </a>
    </div>
  `
}

export function MapView({ reports }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

    if (!token || !containerRef.current) return

    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [77.209, 28.6139], // Default: New Delhi
      zoom: 11,
    })

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    mapRef.current = map

    return () => {
      markersRef.current.forEach((m) => m.remove())
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Update markers when reports change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Remove old markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    if (reports.length === 0) return

    const bounds = new mapboxgl.LngLatBounds()

    reports.forEach((report) => {
      if (!report.latitude || !report.longitude) return

      const el = document.createElement('div')
      el.className = 'civiq-marker'
      const color = SEVERITY_COLORS[report.severity] ?? '#6b7280'
      el.style.cssText = `
        width: 14px; height: 14px; border-radius: 50%;
        background: ${color}; border: 2px solid rgba(255,255,255,0.6);
        box-shadow: 0 0 0 4px ${color}40;
        cursor: pointer; transition: transform 0.15s;
      `
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.5)'
      })
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)'
      })

      const popup = new mapboxgl.Popup({
        offset: 14,
        className: 'civiq-popup',
        maxWidth: '240px',
      }).setHTML(createPopupHTML(report))

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([report.longitude, report.latitude])
        .setPopup(popup)
        .addTo(map)

      markersRef.current.push(marker)
      bounds.extend([report.longitude, report.latitude])
    })

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 80, maxZoom: 14, duration: 800 })
    }
  }, [reports])

  const hasToken = !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  if (!hasToken) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm text-muted-foreground">
        <p>Set <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">NEXT_PUBLIC_MAPBOX_TOKEN</code> to enable the map.</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-2xl overflow-hidden"
      aria-label="Community issues map"
    />
  )
}
