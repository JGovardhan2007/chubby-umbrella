import React, { useEffect, useRef } from 'react';
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
  const animRef = useRef<number | null>(null);
  const dashOffsetRef = useRef<number>(0);

  useEffect(() => {
    if (!map) return;

    const sourceId = 'storm-tracks-source';
    const obsTrackLayerId = 'observed-tracks-line';
    const predTrackLayerId = 'predicted-tracks-line';
    const coneLayerId = 'uncertainty-cones-fill';
    const coneOutlineId = 'uncertainty-cones-outline';

    const features: any[] = [];

    for (const storm of storms) {
      // 1. Observed Past Track (Solid White line with shadow)
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

      // 2. Predicted Future Track (Animated Cyan Flow)
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
          const coneRadiusKm = 6.0 + 8.0 * h;
          const conePoly = createConeSectorCoords(storm.centroid_lat, storm.centroid_lon, pLat, pLon, coneRadiusKm);
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

      // Uncertainty cone layer (Gold shaded)
      map.addLayer({
        id: coneLayerId,
        type: 'fill',
        source: sourceId,
        filter: ['==', ['get', 'trackType'], 'cone'],
        paint: {
          'fill-color': '#F59E0B',
          'fill-opacity': 0.22
        }
      });

      map.addLayer({
        id: coneOutlineId,
        type: 'line',
        source: sourceId,
        filter: ['==', ['get', 'trackType'], 'cone'],
        paint: {
          'line-color': '#D97706',
          'line-width': 1.5,
          'line-dasharray': [2, 2]
        }
      });

      // Observed Track (Solid Slate)
      map.addLayer({
        id: obsTrackLayerId,
        type: 'line',
        source: sourceId,
        filter: ['==', ['get', 'trackType'], 'observed'],
        paint: {
          'line-color': '#0F172A',
          'line-width': 2.5,
          'line-opacity': 0.7
        }
      });

      // Predicted Track (Animated Flow Cyan Line)
      map.addLayer({
        id: predTrackLayerId,
        type: 'line',
        source: sourceId,
        filter: ['==', ['get', 'trackType'], 'predicted'],
        paint: {
          'line-color': '#0284C7',
          'line-width': 2.5,
          'line-dasharray': [3, 2],
          'line-opacity': 0.95
        }
      });
    }

    // Toggle visibility
    [obsTrackLayerId, predTrackLayerId, coneLayerId, coneOutlineId].forEach((layerId) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      }
    });

    // Continuous Flow Animation for Forecast Track
    let step = 0;
    const animateDash = () => {
      step = (step + 1) % 16;
      if (map && map.getLayer(predTrackLayerId)) {
        // Shift dash pattern smoothly to simulate forward motion
        const dashArray = step < 8 ? [3, 2] : [0.5, 2, 2.5, 0];
        // Ensure layer is still present
        try {
          if (map.getLayer(predTrackLayerId) && visible) {
            map.setPaintProperty(predTrackLayerId, 'line-dasharray', [
              3 + Math.sin(step / 2.5) * 0.5,
              2
            ]);
          }
        } catch {
          // ignore if style changed
        }
      }
      animRef.current = requestAnimationFrame(animateDash);
    };

    if (visible) {
      animRef.current = requestAnimationFrame(animateDash);
    }

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };

  }, [map, visible, storms, selectedHorizon]);

  return null;
};

/**
 * Creates an uncertainty cone polygon expanding outward from storm origin to forecast point
 */
function createConeSectorCoords(
  origLat: number,
  origLon: number,
  targetLat: number,
  targetLon: number,
  radiusKm: number,
  points: number = 18
): [number, number][] {
  const coords: [number, number][] = [[origLon, origLat]];
  const cosLat = Math.cos((targetLat * Math.PI) / 180);

  const mainHeading = Math.atan2(targetLon - origLon, targetLat - origLat);
  const spreadAngle = Math.PI / 4; // 45 degree dispersion spread

  for (let i = 0; i <= points; i++) {
    const angle = mainHeading - spreadAngle / 2 + (i / points) * spreadAngle;
    const dLat = (radiusKm * Math.cos(angle)) / 111.0;
    const dLon = (radiusKm * Math.sin(angle)) / (111.0 * Math.max(cosLat, 0.1));
    coords.push([Number((targetLon + dLon).toFixed(4)), Number((targetLat + dLat).toFixed(4))]);
  }

  coords.push([origLon, origLat]);
  return coords;
}
