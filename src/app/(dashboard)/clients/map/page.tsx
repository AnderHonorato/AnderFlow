'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MapPin, ExternalLink } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const accentIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

interface ClientLocation {
  id: string
  name: string
  company?: string
  email: string
  activeProjects: number
  lat: number
  lng: number
  city: string
}

const geocodeCache = new Map<string, { lat: number; lng: number; city: string } | null>()

async function geocodeClient(client: any): Promise<ClientLocation | null> {
  const address = [client.company, client.phone].filter(Boolean).join(' ') || client.email
  const cacheKey = address.toLowerCase().trim()

  if (geocodeCache.has(cacheKey)) {
    const cached = geocodeCache.get(cacheKey)
    if (!cached) return null
    return { ...client, lat: cached.lat, lng: cached.lng, city: cached.city }
  }

  try {
    const query = encodeURIComponent(`Brasil, ${address}`)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      { headers: { 'User-Agent': 'Anderflow/1.0' } }
    )
    const data = await res.json()
    if (data.length > 0) {
      const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), city: data[0].display_name?.split(',')[0] || '' }
      geocodeCache.set(cacheKey, result)
      return { ...client, ...result }
    }
    geocodeCache.set(cacheKey, null)
    return null
  } catch {
    geocodeCache.set(cacheKey, null)
    return null
  }
}

export default function ClientMapPage() {
  const router = useRouter()
  const [clients, setClients] = useState<any[]>([])
  const [locations, setLocations] = useState<ClientLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    fetch('/api/clients')
      .then(r => r.json())
      .then(async json => {
        const data = json.data || []
        setClients(data)

        const locResults = await Promise.all(
          data.map(async (c: any) => {
            const activeProjects = c._count?.projects || 0
            return geocodeClient({ ...c, activeProjects })
          })
        )

        const valid = locResults.filter(Boolean) as ClientLocation[]
        setLocations(valid)
        setLoading(false)
        setMapReady(true)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[calc(100vh-120px)] w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/clients')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-[15px] font-[500]">Mapa de Clientes</h1>
            <p className="text-[11px] text-[var(--text-3)]">
              {locations.length} clientes localizados
              {locations.length < clients.length && ` · ${clients.length - locations.length} sem localização`}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        {mapReady && (
          <MapContainer
            center={[-14.235, -51.925]}
            zoom={4}
            style={{ height: '100%', width: '100%', backgroundColor: 'var(--surface)' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {locations.map((loc) => (
              <Marker
                key={loc.id}
                position={[loc.lat, loc.lng]}
                icon={loc.activeProjects > 0 ? accentIcon : defaultIcon}
              >
                <Popup>
                  <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 180 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: '#F0F0EB' }}>
                      {loc.name}
                    </p>
                    {loc.company && (
                      <p style={{ fontSize: 11, margin: '2px 0', color: '#A8A8A2' }}>{loc.company}</p>
                    )}
                    <p style={{ fontSize: 11, margin: '2px 0', color: '#5C5C58' }}>{loc.email}</p>
                    <p style={{ fontSize: 10, margin: '4px 0', color: '#A8A8A2' }}>
                      {loc.city} · {loc.activeProjects} projeto{loc.activeProjects !== 1 ? 's' : ''} ativo{loc.activeProjects !== 1 ? 's' : ''}
                    </p>
                    <button
                      onClick={() => router.push(`/clients/${loc.id}`)}
                      style={{
                        background: 'var(--accent)',
                        color: '#fff',
                        border: 'none',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 11,
                        cursor: 'pointer',
                        marginTop: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      Ver cliente <ExternalLink size={10} />
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface)]">
            <Skeleton className="h-full w-full rounded-none" />
          </div>
        )}
      </div>
    </div>
  )
}
