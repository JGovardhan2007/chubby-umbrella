import React, { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import { StormCell } from '../types/storm';
import { HorizonMinutes } from '../types/forecast';

interface TrackLayerProps {
  map: maplibregl.Map | null;
  visible: boolean;
  storms: StormCell[];
  selectedHorizon: HorizonMinutes;
}

export const TrackLayer: React.FC<TrackLayerProps> = ({
  map,
  visible,
  storms,
  selectedHorizon
}) => {
  useEffect(() => {
    if (!map) return;

    const sourceId = 'storm-tracks-source';
    const obsTrackLayerId = 'observed-tracks-line';
    const predTrackLayerId = 'predicted-tracks-line';
    const coneLayerId = 'uncertainty-cones-fill';

    const features: any[] = [];

    for (const storm of storms) {
      // 1. Observed Past Track (Solid Line)
      if (storm.history && storm.history.length >= 1) {
        const obsCoords = storm.history.map((h) => [h.centroid_lon, h.centroid_lat]);
        obsCoords.push([storm.centroid_lon, storm.centroid_lat]);

        features.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: obsCoords
          },
          properties: {
            trackType: 'observed',
            storm_id: storm.storm_id
          }
        });
      }

      // 2. Predicted Future Track (Dashed Line)
      // Extrapolate points based on heading & speed
      const predCoords: [number, number][] = [[storm.centroid_lon, storm.centroid_lat]];
      const hoursList = [0.25, 0.5, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0];
      const cosLat = Math.cos((storm.centroid_lat * Math.PI) / 180);

      for (const h of hoursList) {
        const dLat = (storm.velocity_v_kmh * h) / 111.0;
        const dLon = (storm.velocity_u_kmh * h) / (111.0 * Math.max(cosLat, 0.1));
        const pLat = Number((storm.centroid_lat + dLat).toFixed(4));
        const pLon = Number((storm.centroid_lon + dLon).toFixed(4));
        predCoords.push([pLon, pLat]);

        // Add uncertainty dispersion cone for chosen horizon
        if (selectedHorizon > 0 && Math.abs(selectedHorizon - h * 60) < 15) {
          const coneRadiusKm = 5.0 + 6.0 * h;
          const conePoly = createCircleCoords(pLat, pLon, coneRadiusKm);
          features.push({
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [conePoly]
            },
            properties: {
              trackType: 'cone',
              storm_id: storm.storm_id,
              leadTime: h * 60
            }
          });
        }
      }

      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: predCoords
        },
        properties: {
          trackType: 'predicted',
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

      // Uncertainty cone layer
      map.addLayer({
        id: coneLayerId,
        type: 'fill',
        source: sourceId,
        filter: ['==', ['get', 'trackType'], 'cone'],
        paint: {
          'fill-color': '#F59E0B',
          'fill-opacity': 0.18
        }
      });

      // Observed Track (Solid white)
      map.addLayer({
        id: obsTrackLayerId,
        type: 'line',
        source: sourceId,
        filter: ['==', ['get', 'trackType'], 'observed'],
        paint: {
          'line-color': '#FFFFFF',
          'line-width': 2.5,
          'line-opacity': 0.9
        }
      });

      // Predicted Track (Dashed Cyan)
      map.addLayer({
        id: predTrackLayerId,
        type: 'line',
        source: sourceId,
        filter: ['==', ['get', 'trackType'], 'predicted'],
        paint: {
          'line-color': '#38BDF8',
          'line-width': 2.0,
          'line-dasharray': [3, 2],
          'line-opacity': 0.85
        }
      });
    }

    [obsTrackLayerId, predTrackLayerId, coneLayerId].forEach((layerId) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      }
    });

  }, [map, visible, storms, selectedHorizon]);

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
