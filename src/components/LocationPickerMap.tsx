'use client';

import { useEffect, useRef, useState } from 'react';

interface LocationPickerMapProps {
  initialLat?: number | null;
  initialLng?: number | null;
  onLocationSelect: (lat: number, lng: number) => void;
}

/**
 * Interactive map picker using Leaflet (loaded from CDN) + OpenStreetMap tiles.
 * No API key required. Works purely in the browser.
 *
 * - Click anywhere on the map to drop the pin.
 * - Drag the pin to fine-tune.
 * - "Use Current Location" button centers the map on device GPS.
 */
export default function LocationPickerMap({
  initialLat,
  initialLng,
  onLocationSelect,
}: LocationPickerMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  const defaultLat = initialLat ?? 20.5937; // Center of India
  const defaultLng = initialLng ?? 78.9629;
  const defaultZoom = initialLat != null ? 16 : 5;

  useEffect(() => {
    if (mapInstanceRef.current) return;

    const initMap = () => {
      if (!mapRef.current || mapInstanceRef.current) return;
      const L = (window as any).L;

      const map = L.map(mapRef.current).setView([defaultLat, defaultLng], defaultZoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Custom red pin icon
      const icon = L.divIcon({
        className: '',
        html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="32" height="48">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z" fill="#722F37"/>
          <circle cx="12" cy="12" r="5" fill="white"/>
        </svg>`,
        iconSize: [32, 48],
        iconAnchor: [16, 48],
      });

      const marker = L.marker([defaultLat, defaultLng], { draggable: true, icon }).addTo(map);

      // Notify parent on drag end
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onLocationSelect(Math.round(pos.lat * 1e7) / 1e7, Math.round(pos.lng * 1e7) / 1e7);
      });

      // Click anywhere on map moves the marker
      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng);
        onLocationSelect(
          Math.round(e.latlng.lat * 1e7) / 1e7,
          Math.round(e.latlng.lng * 1e7) / 1e7
        );
      });

      // Fire initial selection if coords are pre-set
      if (initialLat != null && initialLng != null) {
        onLocationSelect(initialLat, initialLng);
      }

      mapInstanceRef.current = map;
      markerRef.current = marker;
    };

    // Load Leaflet CSS once
    if (!document.querySelector('#leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS if not already present
    if ((window as any).L) {
      initMap();
    } else {
      const existing = document.querySelector('#leaflet-js');
      if (existing) {
        existing.addEventListener('load', initMap);
      } else {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = initMap;
        document.head.appendChild(script);
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('error');
      return;
    }
    setGeoStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 1e7) / 1e7;
        const lng = Math.round(pos.coords.longitude * 1e7) / 1e7;
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([lat, lng], 17);
          markerRef.current.setLatLng([lat, lng]);
        }
        onLocationSelect(lat, lng);
        setGeoStatus('idle');
      },
      () => setGeoStatus('error'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div>
      {/* Map container */}
      <div
        ref={mapRef}
        className="rounded-xl border border-[#E8E2D9] overflow-hidden"
        style={{ height: '300px', width: '100%' }}
      />

      {/* Controls below map */}
      <div className="flex items-start justify-between mt-3 gap-3 flex-wrap">
        <p className="text-xs text-[#6B6B6B] mt-1">
          Click on the map or drag the pin to mark the exact shop/warehouse location.
        </p>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={geoStatus === 'loading'}
          className="shrink-0 flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06z" />
          </svg>
          {geoStatus === 'loading' ? 'Detecting…' : 'Use Current Location'}
        </button>
      </div>

      {geoStatus === 'error' && (
        <p className="text-xs text-red-500 mt-1">
          Could not detect GPS location. Please allow browser location access or pin manually on the map.
        </p>
      )}
    </div>
  );
}
