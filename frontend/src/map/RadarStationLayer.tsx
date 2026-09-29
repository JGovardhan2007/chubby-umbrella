import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { MAJOR_RADAR_CITIES, LocationOption } from '../panels/TopBar';

interface WeatherStationLayerProps {
  map: maplibregl.Map | null;
  onSelectStation?: (station: LocationOption) => void;
}

interface CityWeatherData {
  tempC: number;
  code: number;
  precipMm: number;
}

function getWeatherIconAndLabel(code: number, precipMm: number): { icon: string; label: string; bgClass: string; textClass: string; borderClass: string } {
  if (code === 95 || code === 96 || code === 99) {
    return {
      icon: '⛈️',
      label: 'Thunderstorm',
      bgClass: 'bg-amber-500/15 backdrop-blur-md',
      textClass: 'text-amber-900',
      borderClass: 'border-amber-400/80 shadow-amber-500/20'
    };
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || precipMm > 0.1) {
    return {
      icon: '🌧️',
      label: 'Rain',
      bgClass: 'bg-blue-500/15 backdrop-blur-md',
      textClass: 'text-blue-900',
      borderClass: 'border-blue-400/80 shadow-blue-500/20'
    };
  }
  if (code === 1 || code === 2 || code === 3) {
    return {
      icon: '⛅',
      label: 'Cloudy',
      bgClass: 'bg-slate-500/10 backdrop-blur-md',
      textClass: 'text-slate-800',
      borderClass: 'border-slate-300 shadow-slate-500/10'
    };
  }
  if (code === 45 || code === 48) {
    return {
      icon: '🌫️',
      label: 'Fog',
      bgClass: 'bg-slate-400/15 backdrop-blur-md',
      textClass: 'text-slate-700',
      borderClass: 'border-slate-300'
    };
  }
  return {
    icon: '☀️',
    label: 'Clear',
    bgClass: 'bg-amber-500/10 backdrop-blur-md',
    textClass: 'text-amber-900',
    borderClass: 'border-amber-300/80 shadow-amber-500/10'
  };
}

export const RadarStationLayer: React.FC<WeatherStationLayerProps> = ({
  map,
  onSelectStation
}) => {
  const [weatherMap, setWeatherMap] = useState<Record<string, CityWeatherData>>({});
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // 1. Fetch real-time live weather condition codes & temperatures from Open-Meteo API
  useEffect(() => {
    let isMounted = true;

    const fetchLiveWeatherData = async () => {
      try {
        const lats = MAJOR_RADAR_CITIES.map((c) => c.lat).join(',');
        const lons = MAJOR_RADAR_CITIES.map((c) => c.lon).join(',');
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,weather_code,precipitation&timezone=auto`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const results = Array.isArray(data) ? data : [data];
          const newMap: Record<string, CityWeatherData> = {};

          results.forEach((item, idx) => {
            const city = MAJOR_RADAR_CITIES[idx];
            if (city && item.current) {
              newMap[city.name] = {
                tempC: Math.round(item.current.temperature_2m ?? 28),
                code: item.current.weather_code ?? 0,
                precipMm: item.current.precipitation ?? 0
              };
            }
          });

          if (isMounted) {
            setWeatherMap(newMap);
          }
        }
      } catch (err) {
        console.warn('Could not fetch live weather conditions for cities:', err);
      }
    };

    fetchLiveWeatherData();
    const interval = setInterval(fetchLiveWeatherData, 10 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // 2. Render Interactive Weather Condition Badges on Map (Decluttered with Zoom)
  useEffect(() => {
    if (!map) return;

    // Remove existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const updateBadgeSize = () => {
      const zoom = map.getZoom();
      document.querySelectorAll('.city-weather-badge-marker').forEach((badgeEl) => {
        const nameSpan = badgeEl.querySelector('.city-badge-name');
        if (nameSpan) {
          if (zoom < 5.8) {
            (nameSpan as HTMLElement).style.display = 'none';
          } else {
            (nameSpan as HTMLElement).style.display = 'inline';
          }
        }
      });
    };

    MAJOR_RADAR_CITIES.forEach((city) => {
      const weather = weatherMap[city.name] || { tempC: 28, code: 0, precipMm: 0 };
      const { icon, textClass, borderClass } = getWeatherIconAndLabel(weather.code, weather.precipMm);
      const isZoomedOut = map.getZoom() < 5.8;

      const el = document.createElement('div');
      el.className = 'city-weather-badge-marker cursor-pointer select-none transition-transform hover:scale-105 active:scale-95 group';
      el.innerHTML = `
        <div class="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/95 border ${borderClass} shadow-md transition-all hover:shadow-lg backdrop-blur-xs">
          <span class="text-xs leading-none">${icon}</span>
          <span class="text-[10.5px] font-bold ${textClass}">${weather.tempC}°</span>
          <span class="city-badge-name text-[10.5px] font-semibold text-slate-700 font-sans tracking-tight" style="display: ${isZoomedOut ? 'none' : 'inline'}">${city.name}</span>
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onSelectStation) {
          onSelectStation(city);
        }
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([city.lon, city.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });

    map.on('zoom', updateBadgeSize);

    return () => {
      map.off('zoom', updateBadgeSize);
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [map, weatherMap, onSelectStation]);

  return null;
};
