import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

interface LightningLayerProps {
  map: maplibregl.Map | null;
  visible: boolean;
  flashes?: { lat: number; lon: number; ka: number; type: string }[];
}

export const LightningLayer: React.FC<LightningLayerProps> = ({
  map,
  visible,
  flashes = []
}) => {
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (!map) return;

    const sourceId = 'lightning-flashes-source';
    const pointLayerId = 'lightning-flashes-points';
    const haloLayerId = 'lightning-flashes-halo';
    const pulseLayerId = 'lightning-flashes-pulse';

    const features = flashes.map((fl, idx) => ({
      type: 'Feature' as const,
      id: idx,
      geometry: {
        type: 'Point' as const,
        coordinates: [fl.lon, fl.lat]
      },
      properties: {
        ka: fl.ka,
        type: fl.type,
        color: fl.ka < 0 ? '#38BDF8' : '#FDE047' // Negative CG (Cyan) vs Positive CG (Yellow)
      }
    }));

    const geojsonData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features
    };

    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojsonData);
    } else {
      map.addSource(sourceId, {
        type: 'geojson',
        data: geojsonData
      });

      // Outer animated pulse ring
      map.addLayer({
        id: pulseLayerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': 16,
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.25,
          'circle-blur': 0.6
        }
      });

      // Halo glow
      map.addLayer({
        id: haloLayerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': 9,
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.6,
          'circle-blur': 0.5
        }
      });

      // Electric core strike point
      map.addLayer({
        id: pointLayerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': 4.5,
          'circle-color': '#FFFFFF',
          'circle-stroke-width': 2.0,
          'circle-stroke-color': ['get', 'color']
        }
      });
    }

    if (map.getLayer(pointLayerId)) {
      map.setLayoutProperty(pointLayerId, 'visibility', visible ? 'visible' : 'none');
    }
    if (map.getLayer(haloLayerId)) {
      map.setLayoutProperty(haloLayerId, 'visibility', visible ? 'visible' : 'none');
    }
    if (map.getLayer(pulseLayerId)) {
      map.setLayoutProperty(pulseLayerId, 'visibility', visible ? 'visible' : 'none');
    }

    // Dynamic lightning pulse animation loop
    let phase = 0;
    const animateLightning = () => {
      if (!map || !map.getLayer(pulseLayerId) || !visible) return;
      phase += 0.05;
      const radius = 12 + Math.sin(phase * 4) * 6;
      const opacity = 0.2 + Math.abs(Math.sin(phase * 4)) * 0.35;
      try {
        map.setPaintProperty(pulseLayerId, 'circle-radius', radius);
        map.setPaintProperty(pulseLayerId, 'circle-opacity', opacity);
      } catch {
        // Safe catch if map style is reloading
      }
      animRef.current = requestAnimationFrame(animateLightning);
    };

    if (visible && flashes.length > 0) {
      animRef.current = requestAnimationFrame(animateLightning);
    }

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [map, visible, flashes]);

  return null;
};
