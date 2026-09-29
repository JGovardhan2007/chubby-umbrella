import React, { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import { StormCell } from '../types/storm';

interface HazardLayerProps {
  map: maplibregl.Map | null;
  visible: boolean;
  storms: StormCell[];
}

export const HazardLayer: React.FC<HazardLayerProps> = ({
  map,
  visible,
  storms
}) => {
  useEffect(() => {
    if (!map) return;

    const sourceId = 'hazard-zones-source';
    const fillLayerId = 'hazard-zones-fill';
    const lineLayerId = 'hazard-zones-line';

    const features: any[] = [];

    for (const storm of storms) {
      // Create hazard impact buffer zones
      const baseRadius = Math.sqrt(storm.area_km2 / Math.PI);
      
      // High-risk core hazard zone
      if (storm.intensity >= 48) {
        const poly = createCircleCoords(storm.centroid_lat, storm.centroid_lon, baseRadius * 1.4);
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [poly]
          },
          properties: {
            hazardType: 'Severe Convective Core',
            color: '#EF4444',
            opacity: 0.22,
            storm_id: storm.storm_id
          }
        });
      }

      // Lightning risk outer zone
      const ltgPoly = createCircleCoords(storm.centroid_lat, storm.centroid_lon, baseRadius * 2.2);
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [ltgPoly]
        },
        properties: {
          hazardType: 'Lightning Risk Zone',
          color: '#06B6D4',
          opacity: 0.12,
          storm_id: storm.storm_id
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
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': ['get', 'opacity']
        }
      });

      map.addLayer({
        id: lineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 1.2,
          'line-opacity': 0.6
        }
      });
    }

    [fillLayerId, lineLayerId].forEach((layerId) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      }
    });

  }, [map, visible, storms]);

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
