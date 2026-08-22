import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import { haversineDistanceKm, type Hospital } from '../services/hospital';
import DirectionsButton from './DirectionsButton';
import './MapView.css';

// Vite bundles Leaflet's default marker image paths incorrectly unless
// explicitly re-pointed at the imported assets.
const defaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const userIcon = L.divIcon({
  className: 'map-view__user-marker',
  html: '<span></span>',
  iconSize: [18, 18],
});

const DEFAULT_CENTER: [number, number] = [22.9734, 78.6569]; // India centroid fallback

interface MapViewProps {
  hospitals: Hospital[];
  onHospitalSelect?: (hospital: Hospital) => void;
}

function RecenterOnUser({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 12);
  }, [position, map]);
  return null;
}

export default function MapView({ hospitals, onHospitalSelect }: MapViewProps) {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'granted' | 'denied' | 'unavailable' | 'timeout' | 'unsupported'>('idle');

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGeoStatus('unsupported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPosition([pos.coords.latitude, pos.coords.longitude]);
        setGeoStatus('granted');
      },
      (err) => {
        if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
          setGeoStatus('denied');
        } else if (err.code === GeolocationPositionError.TIMEOUT) {
          setGeoStatus('timeout');
        } else {
          setGeoStatus('unavailable');
        }
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, []);

  const located = useMemo(() => hospitals.filter((h) => h.latitude != null && h.longitude != null), [hospitals]);

  const sorted = useMemo(() => {
    if (!userPosition) return located;
    return [...located].sort((a, b) => {
      const distA = haversineDistanceKm(userPosition[0], userPosition[1], a.latitude!, a.longitude!);
      const distB = haversineDistanceKm(userPosition[0], userPosition[1], b.latitude!, b.longitude!);
      return distA - distB;
    });
  }, [located, userPosition]);

  return (
    <div className="map-view">
      {geoStatus === 'denied' && (
        <div className="map-view__banner">
          Location access was denied — showing all hospitals without distance sorting. You can still view details and get directions.
        </div>
      )}
      {geoStatus === 'unsupported' && (
        <div className="map-view__banner">
          Your browser doesn't support geolocation — showing all hospitals.
        </div>
      )}
      {geoStatus === 'timeout' && (
        <div className="map-view__banner">
          Location request timed out — showing all hospitals. You can still view details and get directions.
        </div>
      )}
      {geoStatus === 'unavailable' && (
        <div className="map-view__banner">
          Location unavailable. You can still browse hospitals on the map.
        </div>
      )}

      <div className="map-view__container">
        <MapContainer center={DEFAULT_CENTER} zoom={5} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterOnUser position={userPosition} />

          {userPosition && (
            <Marker position={userPosition} icon={userIcon}>
              <Popup>You are here</Popup>
            </Marker>
          )}

          {located.map((h) => (
            <Marker
              key={h.id}
              position={[h.latitude!, h.longitude!]}
              eventHandlers={{ click: () => onHospitalSelect?.(h) }}
            >
              <Popup>
                <div className="map-view__popup">
                  <strong>{h.name}</strong>
                  <span className="map-view__popup-specialties">{(h.facilities || []).slice(0, 3).join(', ')}</span>
                  <span className="map-view__popup-line">
                    {h.beds?.general?.available ?? 0} general beds · {h.beds?.icu?.available ?? 0} ICU
                    {h.beds?.ventilators ? ` · ${h.beds.ventilators.available} ventilators` : ''}
                    {(h.reviewCount ?? 0) > 0 ? ` · ★ ${h.averageRating?.toFixed(1)}` : ''}
                  </span>
                  <DirectionsButton latitude={h.latitude!} longitude={h.longitude!} className="map-view__popup-directions" />
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="map-view__list">
        <h4>{userPosition ? 'Nearest Hospitals' : 'Hospitals'}</h4>
        {sorted.map((h) => {
          const distance = userPosition
            ? haversineDistanceKm(userPosition[0], userPosition[1], h.latitude!, h.longitude!)
            : null;
          return (
            <button key={h.id} className="map-view__list-item" onClick={() => onHospitalSelect?.(h)}>
              <span className="map-view__list-name">{h.name}</span>
              <span className="map-view__list-meta mono">
                {distance != null ? `${distance.toFixed(1)} km away` : h.city}
              </span>
              <span className="map-view__list-beds" style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 2, display: 'block', textAlign: 'left' }}>
                🛏 {h.beds?.general?.available ?? 0}/{h.beds?.general?.total ?? 0} beds &nbsp;
                💊 {h.beds?.oxygen?.available ?? 0} O₂ &nbsp;
                🚨 {h.beds?.emergency?.available ?? 0} ER &nbsp;
                🏥 {h.beds?.icu?.available ?? 0} ICU
              </span>
            </button>
          );
        })}
        {located.length === 0 && <p className="text-secondary">No hospitals with location data yet.</p>}

      </div>
    </div>
  );
}
