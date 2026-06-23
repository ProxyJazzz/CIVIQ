'use client'

import { useCallback, useState } from 'react'
import { MapPin, Navigation, Loader2 } from 'lucide-react'

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

export function LocationPicker({ value, onChange, errors, disabled }: LocationPickerProps) {
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

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

        let address = `${lat}, ${lng}`

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            { headers: { 'Accept-Language': 'en' } },
          )

          if (res.ok) {
            const data = (await res.json()) as { display_name?: string }
            address = data.display_name ?? address
          }
        } catch {
          // Fallback to coordinate string if reverse geocode fails
        }

        onChange({ latitude: lat, longitude: lng, address })
        setGeoLoading(false)
      },
      (err) => {
        setGeoError(err.message)
        setGeoLoading(false)
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }, [onChange])

  function handleField(field: keyof LocationValue) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...value, [field]: e.target.value })
    }
  }

  return (
    <div className="space-y-4">
      {/* Auto-detect button */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
          <MapPin className="h-4 w-4 text-blue-400" />
        </div>
        <span className="text-sm font-medium">Location</span>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="ml-auto gap-1.5 rounded-full border-white/10 bg-white/5 text-xs hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-300"
          onClick={detectLocation}
          disabled={disabled ?? geoLoading}
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

      {geoError && (
        <p className="text-xs text-red-400">{geoError}</p>
      )}

      {/* Lat / Lng */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label
            htmlFor="latitude"
            className={cn('text-xs', errors?.latitude && 'text-red-400')}
          >
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
          {errors?.latitude && (
            <p className="text-xs text-red-400">{errors.latitude}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="longitude"
            className={cn('text-xs', errors?.longitude && 'text-red-400')}
          >
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
          {errors?.longitude && (
            <p className="text-xs text-red-400">{errors.longitude}</p>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="space-y-1.5">
        <Label
          htmlFor="address"
          className={cn('text-xs', errors?.address && 'text-red-400')}
        >
          Address
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
        {errors?.address && (
          <p className="text-xs text-red-400">{errors.address}</p>
        )}
      </div>
    </div>
  )
}
