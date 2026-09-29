import React, { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import { MAJOR_RADAR_CITIES, LocationOption } from '../panels/TopBar';

interface RadarStationLayerProps {
  map: maplibregl.Map | null;
  onSelectStation?: (station: LocationOption) => void;
}

export const RadarStationLayer: React.FC<RadarStationLayerProps> = ({
  map,
  onSelectStation
}) => {
  useEffect(() => {
    if (!map) return;

    const sourceId = 'nationwide-radar-stations-source';
    const pointLayerId = 'nationwide-radar-stations-points';
    const ringLayerId = 'nationwide-radar-stations-rings';
    const labelLayerId = 'nationwide-radar-stations-labels';

    const features: GeoJSON.Feature[] = MAJOR_RADAR_CITIES.map((city, idx) => ({
      type: 'Feature',
      id: idx,
      geometry: {
        type: 'Point',
        coordinates: [city.lon, city.lat]
      },
      properties: {
        name: city.name,
        state: city.state,
        radarStation: city.radarStation,
        lat: city.lat,
        lon: city.lon
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

      // 1. Radar coverage pulse rings (150-250km radar footprint)
      map.addLayer({
        id: ringLayerId,
        type: 'circle',
        source: sourceId,
        maxzoom: 9,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4, 18,
            6, 38,
            8, 75
          ],
          'circle-color': '#0284C7',
          'circle-opacity': 0.08,
          'circle-stroke-width': 1.2,
          'circle-stroke-color': '#38BDF8',
          'circle-stroke-opacity': 0.4
        }
      });

      // 2. Radar station beacons
      map.addLayer({
        id: pointLayerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4, 4,
            7, 6,
            10, 8
          ],
          'circle-color': '#0284C7',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF'
        }
      });

      // 3. Station name labels
      map.addLayer({
        id: labelLayerId,
        type: 'symbol',
        source: sourceId,
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-size': 11,
          'text-offset': [0, 1.2],
          'text-anchor': 'top',
          'text-allow-overlap': false
        },
        paint: {
          'text-color': '#0F172A',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 2.0
        }
      });

      // Handle clicking radar station to jump
      map.on('click', pointLayerId, (e) => {
        if (e.features && e.features[0] && onSelectStation) {
          const props = e.features[0].properties as any;
          onSelectStation({
            name: props.name,
            state: props.state,
            lat: Number(props.lat),
            lon: Number(props.lon),
            radarStation: props.radarStation
          });
        }
      });

      map.on('mouseenter', pointLayerId, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', pointLayerId, () => {
        map.getCanvas().style.cursor = '';
      });
    }
  }, [map, onSelectStation]);

  return null;
};
