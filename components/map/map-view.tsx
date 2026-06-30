'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import MarkerClusterGroup from 'react-leaflet-cluster'

import { calculateTrustScore } from '@/lib/trust-score/calculate-trust-score'
import type { ReportWithStats } from '@/types/community'
import type { Hotspot } from '@/lib/realtime/detect-hotspots'

interface MapViewProps {
  reports: ReportWithStats[]
  hotspots?: Hotspot[]
}

const SEVERITY_COLORS: Record<string, string> = {
  High: '#EF4444',
  Medium: '#F59E0B',
  Low: '#00C896',
}

// Sub-component to handle map flyTo and fitBounds logic dynamically
function MapController({ reports, hotspots = [] }: { reports: ReportWithStats[]; hotspots: Hotspot[] }) {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    // Inject animation CSS on mount
    const styleId = 'civiq-hotspot-pulse-styles'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        @keyframes civiq-pulse-radar {
          0% {
            transform: scale(0.6);
            opacity: 1;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
        .civiq-leaflet-popup .leaflet-popup-content-wrapper {
          background: #0B0E13 !important;
          color: #FFFFFF !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 14px !important;
          padding: 6px !important;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6) !important;
        }
        .civiq-leaflet-popup .leaflet-popup-tip {
          background: #0B0E13 !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        .civiq-leaflet-popup .leaflet-popup-close-button {
          color: #A0AEC0 !important;
          font-size: 16px !important;
          padding: 8px !important;
        }
      `
      document.head.appendChild(style)
    }

    const urlParams = new URLSearchParams(window.location.search)
    const latParam = urlParams.get('lat')
    const lngParam = urlParams.get('lng')

    if (latParam && lngParam) {
      const lat = parseFloat(latParam)
      const lng = parseFloat(lngParam)
      if (!isNaN(lat) && !isNaN(lng)) {
        map.setView([lat, lng], 14, { animate: true })
      }
    } else {
      const validPoints: L.LatLngExpression[] = []
      reports.forEach((r) => {
        if (r.latitude && r.longitude && !isNaN(r.latitude) && !isNaN(r.longitude)) {
          validPoints.push([r.latitude, r.longitude])
        }
      })
      hotspots.forEach((h) => {
        if (h.latitude && h.longitude && !isNaN(h.latitude) && !isNaN(h.longitude)) {
          validPoints.push([h.latitude, h.longitude])
        }
      })

      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints)
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
      }
    }
  }, [reports, hotspots, map])

  return null
}

export function MapView({ reports, hotspots = [] }: MapViewProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>([28.6139, 77.209]) // New Delhi default
  const [mapZoom, setMapZoom] = useState<number>(11)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const latParam = urlParams.get('lat')
    const lngParam = urlParams.get('lng')

    if (latParam && lngParam) {
      const lat = parseFloat(latParam)
      const lng = parseFloat(lngParam)
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapCenter([lat, lng])
        setMapZoom(14)
      }
    }
  }, [])

  return (
    <div className="h-full w-full rounded-3xl overflow-hidden border border-white/8 bg-[#0B0E13]">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        zoomControl={true}
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        <MapController reports={reports} hotspots={hotspots} />

        {/* 1. Report Pins with Clustering */}
        <MarkerClusterGroup chunkedLoading>
          {reports.map((report) => {
            if (!report.latitude || !report.longitude || isNaN(report.latitude) || isNaN(report.longitude)) {
              return null
            }

            const color = SEVERITY_COLORS[report.severity] ?? '#64748B'
            const trust = calculateTrustScore({
              verifications: report.verification_count,
              votes: report.vote_count,
              comments: report.comment_count,
              createdAt: report.created_at,
            })

            const trustBadgeStyles =
              trust.label === 'High Trust'
                ? { backgroundColor: 'rgba(0,200,150,0.1)', color: '#00C896', border: '1px solid rgba(0,200,150,0.2)' }
                : trust.label === 'Medium Trust'
                  ? { backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }
                  : { backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }

            const customIcon = L.divIcon({
              className: 'civiq-report-marker',
              html: `<div style="
                width: 13px; height: 13px; border-radius: 50%;
                background: ${color}; border: 2.5px solid #0B0E13;
                box-shadow: 0 0 10px ${color}80;
                transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
              "></div>`,
              iconSize: [13, 13],
              iconAnchor: [6.5, 6.5],
              popupAnchor: [0, -10],
            })

            return (
              <Marker
                key={report.id}
                position={[report.latitude, report.longitude]}
                icon={customIcon}
                eventHandlers={{
                  mouseover: (e) => {
                    const el = e.target.getElement()?.querySelector('div')
                    if (el) {
                      el.style.transform = 'scale(1.4)'
                      el.style.boxShadow = `0 0 18px ${color}`
                    }
                  },
                  mouseout: (e) => {
                    const el = e.target.getElement()?.querySelector('div')
                    if (el) {
                      el.style.transform = 'scale(1)'
                      el.style.boxShadow = `0 0 10px ${color}80`
                    }
                  },
                }}
              >
                <Popup className="civiq-leaflet-popup">
                  <div style={{ fontFamily: "'Geist','Inter',sans-serif", maxWidth: '240px', padding: '4px', color: '#FFFFFF', background: '#0B0E13' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0, marginTop: '4px', boxShadow: `0 0 8px ${color}` }}></span>
                      <span style={{ fontSize: '13px', fontWeight: 800, lineHeight: 1.3, color: '#FFFFFF' }}>{report.title}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#A0AEC0', borderRadius: '99px', padding: '1px 7px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{report.category}</span>
                      <span style={{ background: `${color}15`, color: color, border: `1px solid ${color}35`, borderRadius: '99px', padding: '1px 7px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{report.severity}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                      <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: '8px' }}>Trust Rating</span>
                      <span style={{ borderRadius: '99px', padding: '1px 6px', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', ...trustBadgeStyles }}>{trust.label}</span>
                    </div>
                    <a href={`/report/${report.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 700, color: '#00C896', textDecoration: 'none', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px', transition: 'opacity 0.2s' }}>
                      View Details &rarr;
                    </a>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MarkerClusterGroup>

        {/* 2. Emergency Pulsing Hotspots */}
        {hotspots.map((hotspot, idx) => {
          if (!hotspot.latitude || !hotspot.longitude || isNaN(hotspot.latitude) || isNaN(hotspot.longitude)) {
            return null
          }

          const hotspotIcon = L.divIcon({
            className: 'civiq-leaflet-hotspot',
            html: `
              <div style="
                position: relative;
                width: 44px; height: 44px;
                display: flex; align-items: center; justify-content: center;
              ">
                <div style="
                  position: absolute;
                  width: 100%; height: 100%;
                  border-radius: 50%;
                  background: rgba(239, 68, 68, 0.12);
                  border: 2px solid rgba(239, 68, 68, 0.6);
                  animation: civiq-pulse-radar 1.5s infinite ease-out;
                  pointer-events: none;
                "></div>
                <div style="
                  width: 12px; height: 12px;
                  border-radius: 50%;
                  background: #EF4444;
                  border: 2px solid #FFFFFF;
                  box-shadow: 0 0 14px rgba(239, 68, 68, 0.95);
                "></div>
              </div>
            `,
            iconSize: [44, 44],
            iconAnchor: [22, 22],
            popupAnchor: [0, -18],
          })

          return (
            <Marker
              key={`hotspot-${idx}`}
              position={[hotspot.latitude, hotspot.longitude]}
              icon={hotspotIcon}
            >
              <Popup className="civiq-leaflet-popup">
                <div style={{ fontFamily: "'Geist','Inter',sans-serif", maxWidth: '240px', padding: '4px', color: '#FFFFFF', background: '#0B0E13' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#EF4444' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', flexShrink: 0, boxShadow: '0 0 8px #EF4444' }}></span>
                    <span style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Emergency Hotspot</span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#A0AEC0', marginBottom: '10px', lineHeight: 1.4 }}>
                    Concentration of <strong>{hotspot.count}</strong> high-severity unresolved issues within a 150m radius.
                  </p>
                  <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px', marginBottom: '4px' }}>Seeded Reports</div>
                  <div style={{ fontSize: '11px', color: '#FFFFFF', maxHeight: '85px', overflowY: 'auto', lineHeight: 1.5 }}>
                    {hotspot.reports.map((r) => `• ${r.title}`).join('<br/>')}
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
