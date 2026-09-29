import React, { useEffect } from 'react';
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
  useEffect(() => {
    if (!map) return;

    const sourceId = 'lightning-flashes-source';
    const pointLayerId = 'lightning-flashes-points';
    const haloLayerId = 'lightning-flashes-halo';

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

      // Halo layer
      map.addLayer({
        id: haloLayerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': 9,
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.35,
          'circle-blur': 0.8
        }
      });

      // Core point layer
      map.addLayer({
        id: pointLayerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': 4.5,
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 1.2,
          'circle-stroke-color': '#FFFFFF'
        }
      });
    }

    if (map.getLayer(pointLayerId)) {
      map.setLayoutProperty(pointLayerId, 'visibility', visible ? 'visible' : 'none');
    }
    if (map.getLayer(haloLayerId)) {
      map.setLayoutProperty(haloLayerId, 'visibility', visible ? 'visible' : 'none');
    }

  }, [map, visible, flashes]);

  return null;
};
