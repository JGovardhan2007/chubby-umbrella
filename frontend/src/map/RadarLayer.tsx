import React, { useEffect } from 'react';
import maplibregl from 'maplibre-gl';

interface RadarLayerProps {
  map: maplibregl.Map | null;
  visible: boolean;
  radarPoints?: { lat: number; lon: number; dbz: number }[];
  centerLat?: number;
  centerLon?: number;
  maxDbz?: number;
}

export const RadarLayer: React.FC<RadarLayerProps> = ({
  map,
  visible,
  radarPoints = [],
  centerLat = 13.1,
  centerLon = 79.7,
  maxDbz = 52.0
}) => {
  useEffect(() => {
    if (!map) return;

    const sourceId = 'radar-reflectivity-source';
    const fillLayerId = 'radar-reflectivity-fill';
    const heatLayerId = 'radar-reflectivity-heat';

    // Generate circular simulated radar contours around center
    const features = [];
    const dbzLevels = [
      { minDbz: 20, color: 'rgba(56, 189, 248, 0.25)', radiusKm: 38 },
      { minDbz: 35, color: 'rgba(34, 197, 94, 0.45)', radiusKm: 26 },
      { minDbz: 45, color: 'rgba(234, 179, 8, 0.65)', radiusKm: 18 },
      { minDbz: 52, color: 'rgba(239, 68, 68, 0.85)', radiusKm: 10 },
      { minDbz: 58, color: 'rgba(168, 85, 247, 0.95)', radiusKm: 5 },
    ];

    for (const lvl of dbzLevels) {
      if (maxDbz >= lvl.minDbz) {
        const poly = createCircleCoords(centerLat, centerLon, lvl.radiusKm);
        features.push({
          type: 'Feature' as const,
          geometry: {
            type: 'Polygon' as const,
            coordinates: [poly]
          },
          properties: {
            dbz: lvl.minDbz,
            color: lvl.color
          }
        });
      }
    }

    // Add extra radar sample points
    for (const pt of radarPoints) {
      features.push({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [pt.lon, pt.lat]
        },
        properties: {
          dbz: pt.dbz,
          color: pt.dbz >= 50 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(34, 197, 94, 0.6)'
        }
      });
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
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        filter: ['==', '$type', 'Polygon'],
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.85
        }
      });
    }

    // Update visibility
    if (map.getLayer(fillLayerId)) {
      map.setLayoutProperty(fillLayerId, 'visibility', visible ? 'visible' : 'none');
    }

  }, [map, visible, radarPoints, centerLat, centerLon, maxDbz]);

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
