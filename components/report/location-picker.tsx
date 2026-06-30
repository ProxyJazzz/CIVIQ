'use client'

import { useCallback, useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Navigation, Loader2, Search, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface LocationValue {
  latitude: string
  longitude: string
  address: string
}

interface LocationPickerProps {
  value: LocationValue
  onChange: (value: LocationValue) => void
  errors?: {
    latitude?: string
    longitude?: string
    address?: string
  }
  disabled?: boolean
}

// Leaflet custom blue glass pin icon
const locationPinIcon = L.divIcon({
  className: 'civiq-location-pin',
  html: `<div style="
    display: flex; align-items: center; justify-content: center;
    width: 32px; height: 32px; border-radius: 50%;
    background: rgba(59, 130, 246, 0.15); border: 2px solid #3B82F6;
    box-shadow: 0 0 12px rgba(59, 130, 246, 0.5);
  ">
    <div style="width: 10px; height: 10px; border-radius: 50%; background: #3B82F6;"></div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

// Sub-component to center map when coords change from search/autodetect
function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      map.setView([lat, lng], 14, { animate: true })
    }
  }, [lat, lng, map])
  return null
}

// Sub-component to capture map click events for manual pin placement
function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export function LocationPicker({ value, onChange, errors, disabled }: LocationPickerProps) {
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([])
  const [searching, setSearching] = useState(false)

  const defaultLat = parseFloat(value.latitude) || 28.6139
  const defaultLng = parseFloat(value.longitude) || 77.2090

  // Reverse geocodes coordinates to display address
  const fetchAddress = useCallback(
    async (lat: string, lng: string) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
          { headers: { 'Accept-Language': 'en' } },
        )
        if (res.ok) {
          const data = (await res.json()) as { display_name?: string }
          return data.display_name ?? `${lat}, ${lng}`
        }
      } catch {
        // Fallback
      }
      return `${lat}, ${lng}`
    },
    [],
  )

  // Geo auto-detect GPS coordinates
  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.')
      return
    }

    setGeoLoading(true)
    setGeoError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toFixed(6)
        const lng = position.coords.longitude.toFixed(6)
        const address = await fetchAddress(lat, lng)

        onChange({ latitude: lat, longitude: lng, address })
        setGeoLoading(false)
      },
      (err) => {
        setGeoError(err.message)
        setGeoLoading(false)
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }, [onChange, fetchAddress])

  // Osm Nominatim Location search lookup
  async function handleSearch(e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) {
    if (e) e.preventDefault()
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=4`,
        { headers: { 'Accept-Language': 'en' } },
      )
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data)
      }
    } catch (err) {
      console.error('OSM Search failed', err)
    } finally {
      setSearching(false)
    }
  }

  // Handle manual clicks on Leaflet canvas
  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      if (disabled) return
      const latStr = lat.toFixed(6)
      const lngStr = lng.toFixed(6)
      const address = await fetchAddress(latStr, lngStr)

      onChange({ latitude: latStr, longitude: lngStr, address })
    },
    [onChange, fetchAddress, disabled],
  )

  function handleField(field: keyof LocationValue) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...value, [field]: e.target.value })
    }
  }

  return (
    <div className="space-y-4">
      {/* Auto-detect and Header row */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
          <MapPin className="h-4 w-4 text-blue-400" />
        </div>
        <span className="text-sm font-medium">Incident Location</span>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="ml-auto gap-1.5 rounded-full border-white/10 bg-white/5 text-xs hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-300"
          onClick={detectLocation}
          disabled={disabled || geoLoading}
          aria-label="Auto-detect location"
        >
          {geoLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Navigation className="h-3 w-3" />
          )}
          {geoLoading ? 'Detecting…' : 'Auto-detect'}
        </Button>
      </div>

      {geoError && <p className="text-xs text-red-400">{geoError}</p>}

      {/* Geocoding search input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search address or area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void handleSearch(e)
              }
            }}
            disabled={disabled || searching}
            className="pl-9 bg-white/5"
          />
        </div>
        <Button
          type="button"
          onClick={(e) => void handleSearch(e)}
          variant="outline"
          disabled={disabled || searching}
          className="border-white/10 bg-white/5"
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </Button>
      </div>

      {/* Autocomplete Search Results */}
      {searchResults.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-[#0B0E13]/80 p-2 space-y-1.5 max-h-40 overflow-y-auto">
          {searchResults.map((result, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                const lat = parseFloat(result.lat).toFixed(6)
                const lng = parseFloat(result.lon).toFixed(6)
                onChange({ latitude: lat, longitude: lng, address: result.display_name })
                setSearchResults([])
                setSearchQuery('')
              }}
              className="w-full text-left text-xs p-2 rounded-lg hover:bg-white/5 transition-colors flex justify-between items-center text-muted-foreground hover:text-white"
            >
              <span className="truncate pr-2">{result.display_name}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-blue-400" />
            </button>
          ))}
        </div>
      )}

      {/* Leaflet Map Frame */}
      <div className="h-[220px] w-full rounded-2xl overflow-hidden border border-white/8 bg-[#0B0E13] relative z-10">
        <MapContainer
          center={[defaultLat, defaultLng]}
          zoom={13}
          zoomControl={false}
          className="h-full w-full"
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          <MapRecenter lat={defaultLat} lng={defaultLng} />
          {!disabled && <MapClickHandler onClick={handleMapClick} />}
          <Marker position={[defaultLat, defaultLng]} icon={locationPinIcon} />
        </MapContainer>
        <div className="absolute bottom-2 right-2 z-[400] glass-panel px-2.5 py-1 rounded-md text-[9px] uppercase tracking-wider font-extrabold text-muted-foreground border border-white/5">
          Click map to pin coordinate
        </div>
      </div>

      {/* Lat / Lng inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="latitude" className={cn('text-xs', errors?.latitude && 'text-red-400')}>
            Latitude
          </Label>
          <Input
            id="latitude"
            name="latitude"
            type="number"
            step="any"
            placeholder="28.6139"
            value={value.latitude}
            onChange={handleField('latitude')}
            disabled={disabled}
            aria-invalid={!!errors?.latitude}
            className={cn(
              'bg-white/5 text-sm',
              errors?.latitude && 'border-red-500/50 focus-visible:ring-red-500/30',
            )}
          />
          {errors?.latitude && <p className="text-xs text-red-400">{errors.latitude}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="longitude" className={cn('text-xs', errors?.longitude && 'text-red-400')}>
            Longitude
          </Label>
          <Input
            id="longitude"
            name="longitude"
            type="number"
            step="any"
            placeholder="77.2090"
            value={value.longitude}
            onChange={handleField('longitude')}
            disabled={disabled}
            aria-invalid={!!errors?.longitude}
            className={cn(
              'bg-white/5 text-sm',
              errors?.longitude && 'border-red-500/50 focus-visible:ring-red-500/30',
            )}
          />
          {errors?.longitude && <p className="text-xs text-red-400">{errors.longitude}</p>}
        </div>
      </div>

      {/* Address Text Area */}
      <div className="space-y-1.5">
        <Label htmlFor="address" className={cn('text-xs', errors?.address && 'text-red-400')}>
          Mapped Address
        </Label>
        <Input
          id="address"
          name="address"
          placeholder="Block, street, area, city"
          value={value.address}
          onChange={handleField('address')}
          disabled={disabled}
          aria-invalid={!!errors?.address}
          className={cn(
            'bg-white/5 text-sm',
            errors?.address && 'border-red-500/50 focus-visible:ring-red-500/30',
          )}
        />
        {errors?.address && <p className="text-xs text-red-400">{errors.address}</p>}
      </div>
    </div>
  )
}
