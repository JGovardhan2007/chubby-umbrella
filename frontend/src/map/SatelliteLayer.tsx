import React, { useEffect } from 'react';
import maplibregl from 'maplibre-gl';

interface SatelliteLayerProps {
  map: maplibregl.Map | null;
  visible: boolean;
  centerLat?: number;
  centerLon?: number;
  minBtK?: number;
}

export const SatelliteLayer: React.FC<SatelliteLayerProps> = ({
  map,
  visible,
  centerLat = 13.1,
  centerLon = 79.7,
  minBtK = 215.0
}) => {
  useEffect(() => {
    if (!map) return;

    const sourceId = 'satellite-tir-source';
    const layerId = 'satellite-tir-layer';

    // Simulated thermal infrared anvil cloud top buffer (cold core < 220K is deepest violet/blue)
    const features = [];
    const tirLevels = [
      { tempK: 245, color: 'rgba(99, 102, 241, 0.20)', radiusKm: 65 },
      { tempK: 230, color: 'rgba(79, 70, 229, 0.35)', radiusKm: 45 },
      { tempK: 220, color: 'rgba(139, 92, 246, 0.50)', radiusKm: 28 },
      { tempK: 212, color: 'rgba(236, 72, 153, 0.65)', radiusKm: 14 },
    ];

    for (const lvl of tirLevels) {
      if (minBtK <= lvl.tempK) {
        const poly = createCircleCoords(centerLat, centerLon, lvl.radiusKm);
        features.push({
          type: 'Feature' as const,
          geometry: {
            type: 'Polygon' as const,
            coordinates: [poly]
          },
          properties: {
            tempK: lvl.tempK,
            color: lvl.color
          }
        });
      }
    }

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

      map.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.8
        }
      });
    }

    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
    }

  }, [map, visible, centerLat, centerLon, minBtK]);

  return null;
};

function createCircleCoords(lat: number, lon: number, radiusKm: number, points = 24): [number, number][] {
  const coords: [number, number][] = [];
  const cosLat = Math.cos((lat * Math.PI) / 180);
  for (let i = 0; i <= points; i++) {
    const angle = (i * 2 * Math.PI) / points;
    const dLat = (radiusKm * Math.cos(angle)) / 111.0;
    const dLon = (radiusKm * Math.sin(angle)) / (111.0 * Math.max(cosLat, 0.1));
    coords.push([Number((lon + dLon).toFixed(4)), Number((lat + dLat).toFixed(4))]);
  }
  return coords;
}
