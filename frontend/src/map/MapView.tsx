import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { LayerToggleState } from '../types/weather';
import { StormCell } from '../types/storm';
import { HorizonMinutes, SiteEtaSummary } from '../types/forecast';
import { RadarLayer } from './RadarLayer';
import { SatelliteLayer } from './SatelliteLayer';
import { LightningLayer } from './LightningLayer';
import { StormLayer } from './StormLayer';
import { TrackLayer } from './TrackLayer';
import { HazardLayer } from './HazardLayer';
import { AnomalyLayer } from '../anomaly/AnomalyLayer';
import { MapLegend } from './MapLegend';

interface MapViewProps {
  layers: LayerToggleState;
  storms: StormCell[];
  selectedStorm: StormCell | null;
  onSelectStorm: (storm: StormCell | null) => void;
  selectedHorizon: HorizonMinutes;
  siteEta: SiteEtaSummary | null;
  radarPoints?: { lat: number; lon: number; dbz: number }[];
  lightningFlashes?: { lat: number; lon: number; ka: number; type: string }[];
  onMapClickLocation?: (lat: number, lon: number) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  layers,
  storms,
  selectedStorm,
  onSelectStorm,
  selectedHorizon,
  siteEta,
  radarPoints,
  lightningFlashes,
  onMapClickLocation
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const siteMarkerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize MapLibre GL Dark Matter map centered over South India / Chennai testbed
    const mapInstance = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [80.0, 13.1],
      zoom: 8.5,
      pitch: 0,
      attributionControl: false
    });

    mapInstance.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    mapInstance.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    mapInstance.on('load', () => {
      setMap(mapInstance);
    });

    // Map click handler for selecting arbitrary target monitoring site
    mapInstance.on('click', (e) => {
      if (onMapClickLocation) {
        onMapClickLocation(e.lngLat.lat, e.lngLat.lng);
      }
    });

    return () => {
      mapInstance.remove();
    };
  }, []);

  // Update target site marker on map
  useEffect(() => {
    if (!map) return;

    if (siteEta) {
      const { latitude, longitude, label } = siteEta.target_location;

      if (!siteMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'site-marker-pin';
        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            <div class="w-4 h-4 rounded-full bg-sky-500 border-2 border-white shadow-lg animate-pulse"></div>
            <div class="absolute w-8 h-8 rounded-full bg-sky-400/30"></div>
          </div>
        `;

        siteMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([longitude, latitude])
          .setPopup(new maplibregl.Popup({ offset: 15 }).setText(`Target Site: ${label}`))
          .addTo(map);
      } else {
        siteMarkerRef.current.setLngLat([longitude, latitude]);
      }
    }
  }, [map, siteEta]);

  const primaryStorm = storms[0];

  return (
    <div className="relative w-full h-full bg-[#0B0F19] overflow-hidden flex-1">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Modular Meteorological Layer Implementations */}
      <RadarLayer
        map={map}
        visible={layers.radarReflectivity}
        radarPoints={radarPoints}
        centerLat={primaryStorm?.centroid_lat}
        centerLon={primaryStorm?.centroid_lon}
        maxDbz={primaryStorm?.intensity}
      />

      <SatelliteLayer
        map={map}
        visible={layers.satelliteIR}
        centerLat={primaryStorm?.centroid_lat}
        centerLon={primaryStorm?.centroid_lon}
        minBtK={primaryStorm?.indicators?.min_bt_k}
      />

      <LightningLayer
        map={map}
        visible={layers.lightningFlashes}
        flashes={lightningFlashes}
      />

      <StormLayer
        map={map}
        visible={layers.stormCells}
        storms={storms}
        selectedStormId={selectedStorm?.storm_id || null}
        onSelectStorm={(s) => onSelectStorm(s)}
      />

      <TrackLayer
        map={map}
        visible={layers.stormTracks}
        storms={storms}
        selectedHorizon={selectedHorizon}
      />

      <HazardLayer
        map={map}
        visible={layers.hazardZones}
        storms={storms}
      />

      <AnomalyLayer
        map={map}
        visible={layers.extremeAnomalies}
      />

      {/* Control Room Map Legend */}
      <MapLegend />
    </div>
  );
};
