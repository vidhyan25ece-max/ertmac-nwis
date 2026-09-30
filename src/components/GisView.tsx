import React, { useState, useEffect, useRef } from 'react';
import { ActiveDrillingState, OffsetWell } from '../types/drilling';
import { OFFSET_WELLS } from '../data/wellsData';
import { useTheme } from '../context/ThemeContext';
import { TabId } from './Sidebar';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  RotateCcw,
  ArrowRight,
  X,
  Map as MapIcon,
  Globe,
  Crosshair,
  Navigation,
} from 'lucide-react';

interface GisViewProps {
  activeWell: ActiveDrillingState;
  selectedWell: OffsetWell | null;
  onSelectOffsetWell: (well: OffsetWell) => void;
  onSetDepth: (depth: number) => void;
  onNavigateTab?: (tab: TabId) => void;
}

export const GisView: React.FC<GisViewProps> = ({
  activeWell,
  selectedWell,
  onSelectOffsetWell,
  onSetDepth,
  onNavigateTab,
}) => {
  const { isDark } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const vectorLineRef = useRef<L.Polyline | null>(null);
  const midpointBadgeRef = useRef<L.Marker | null>(null);

  // Basemap Mode: 'map' (OpenStreetMap) or 'satellite' (Esri World Imagery)
  const [basemapMode, setBasemapMode] = useState<'map' | 'satellite'>('map');
  // Radius Filter: 3, 5, 10, 15, 25 km (Default: 5 km)
  const [selectedRadiusKm, setSelectedRadiusKm] = useState<number>(5);
  // Selected Well state
  const [activeSelectedWell, setActiveSelectedWell] = useState<OffsetWell | null>(null);
  // Live cursor position indicator
  const [cursorPos, setCursorPos] = useState<{ lat: number; lng: number } | null>(null);

  // Safe fallback coordinates for active well
  const safeLat =
    typeof activeWell?.latitude === 'number' && !isNaN(activeWell.latitude)
      ? activeWell.latitude
      : 21.625;
  const safeLng =
    typeof activeWell?.longitude === 'number' && !isNaN(activeWell.longitude)
      ? activeWell.longitude
      : 73.015;

  /**
   * Pure mathematical calculation of bounding box for a radius around lat/lng.
   * Safe against undefined, NaN, and container sizing issues.
   */
  const getRadiusBounds = (lat: number, lng: number, radiusKm: number): L.LatLngBounds | null => {
    if (
      typeof lat !== 'number' ||
      isNaN(lat) ||
      typeof lng !== 'number' ||
      isNaN(lng) ||
      typeof radiusKm !== 'number' ||
      isNaN(radiusKm) ||
      radiusKm <= 0
    ) {
      return null;
    }
    const dLat = radiusKm / 111.0;
    const radLat = (lat * Math.PI) / 180;
    const cosLat = Math.cos(radLat);
    const dLng = Math.abs(cosLat) > 0.0001 ? radiusKm / (111.0 * Math.abs(cosLat)) : radiusKm / 111.0;

    const southWest = L.latLng(lat - dLat, lng - dLng);
    const northEast = L.latLng(lat + dLat, lng + dLng);
    return L.latLngBounds(southWest, northEast);
  };

  /**
   * Helper to compute geographic latitude and longitude for each well from
   * active well's base latitude/longitude, distance (km), and azimuth (deg)
   */
  const getWellCoordinates = (well: OffsetWell): [number, number] => {
    const dist = typeof well?.distanceKm === 'number' && !isNaN(well.distanceKm) ? well.distanceKm : 3.0;
    const az = typeof well?.azimuthDeg === 'number' && !isNaN(well.azimuthDeg) ? well.azimuthDeg : 45.0;
    const rad = (az * Math.PI) / 180;
    const dLat = (dist * Math.cos(rad)) / 111.0;
    const radLat = (safeLat * Math.PI) / 180;
    const cosLat = Math.cos(radLat);
    const dLon = dist * Math.sin(rad) / (111.0 * (Math.abs(cosLat) > 0.0001 ? Math.abs(cosLat) : 1.0));
    return [safeLat + dLat, safeLng + dLon];
  };

  /**
   * CAMERA ACTION 1: WHEN I CLICK A SPECIFIC WELL → ZOOM IN
   */
  const handleSelectWell = (well: OffsetWell | null) => {
    if (!well) return;

    setActiveSelectedWell(well);
    if (selectedWell?.id !== well.id) {
      onSelectOffsetWell(well);
    }

    if (!mapInstanceRef.current) return;

    const coords = getWellCoordinates(well);
    if (
      !Array.isArray(coords) ||
      coords.length !== 2 ||
      typeof coords[0] !== 'number' ||
      isNaN(coords[0]) ||
      typeof coords[1] !== 'number' ||
      isNaN(coords[1])
    ) {
      return;
    }

    let targetZoom = 15;
    const dist = typeof well.distanceKm === 'number' && !isNaN(well.distanceKm) ? well.distanceKm : 3.0;
    if (dist < 1.0) {
      targetZoom = 17;
    } else if (dist <= 2.0) {
      targetZoom = 16;
    } else if (dist <= 3.5) {
      targetZoom = 15;
    } else {
      targetZoom = 14;
    }

    try {
      mapInstanceRef.current.flyTo(coords, targetZoom, {
        duration: 1.25,
        easeLinearity: 0.25,
      });
    } catch (err) {
      console.warn('flyTo failed, fallback to setView:', err);
      try {
        mapInstanceRef.current.setView(coords, targetZoom);
      } catch {}
    }
  };

  /**
   * CAMERA ACTION 2: WHEN I CLICK A RADIUS → ZOOM OUT TO SHOW THAT ENTIRE AREA
   */
  const handleRadiusChange = (radiusKm: number) => {
    if (typeof radiusKm !== 'number' || isNaN(radiusKm) || radiusKm <= 0) return;

    setSelectedRadiusKm(radiusKm);
    setActiveSelectedWell(null);

    if (!mapInstanceRef.current) return;

    const radiusBounds = getRadiusBounds(safeLat, safeLng, radiusKm);
    if (!radiusBounds || !radiusBounds.isValid()) {
      try {
        const fallbackZoom = radiusKm <= 5 ? 13 : radiusKm <= 10 ? 12 : 10;
        mapInstanceRef.current.setView([safeLat, safeLng], fallbackZoom);
      } catch {}
      return;
    }

    try {
      mapInstanceRef.current.flyToBounds(radiusBounds, {
        padding: [45, 45],
        duration: 1.25,
        easeLinearity: 0.25,
      });
    } catch (err) {
      console.warn('flyToBounds failed, fallback to setView:', err);
      try {
        const fallbackZoom = radiusKm <= 5 ? 13 : radiusKm <= 10 ? 12 : 10;
        mapInstanceRef.current.setView([safeLat, safeLng], fallbackZoom);
      } catch {}
    }
  };

  // Reset View: Re-center on active well and fit the current radius boundary
  const handleResetView = () => {
    handleRadiusChange(selectedRadiusKm);
  };

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Safety: remove leftover _leaflet_id to avoid "Map container is already initialized"
    if ((mapContainerRef.current as unknown as { _leaflet_id?: unknown })._leaflet_id != null) {
      delete (mapContainerRef.current as unknown as { _leaflet_id?: unknown })._leaflet_id;
    }

    try {
      // Create Leaflet map centered at active drilling well
      const map = L.map(mapContainerRef.current, {
        center: [safeLat, safeLng],
        zoom: 12,
        minZoom: 7,
        maxZoom: 19,
        zoomControl: false,
      });

      // Controls
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.control.scale({ imperial: false, metric: true, position: 'bottomleft' }).addTo(map);

      // Tile Layer (Standard OpenStreetMap, 100% free, reliable)
      const initialTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      currentTileLayerRef.current = initialTiles;

      // Layer group for markers
      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;

      map.on('mousemove', (e) => {
        if (e && e.latlng) {
          setCursorPos({ lat: e.latlng.lat, lng: e.latlng.lng });
        }
      });

      mapInstanceRef.current = map;

      // Safe size validation and initial bounds fit after DOM layout
      const timer = setTimeout(() => {
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.invalidateSize();
            const initialBounds = getRadiusBounds(safeLat, safeLng, 5);
            if (initialBounds && initialBounds.isValid()) {
              mapInstanceRef.current.fitBounds(initialBounds, { padding: [45, 45] });
            }
          } catch (e) {
            console.warn('Initial map fitBounds error:', e);
          }
        }
      }, 150);

      const handleResize = () => {
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.invalidateSize();
          } catch {}
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', handleResize);
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.remove();
          } catch (e) {
            console.warn('Error removing Leaflet map:', e);
          }
          mapInstanceRef.current = null;
        }
      };
    } catch (err) {
      console.error('Fatal error initializing Leaflet map:', err);
    }
  }, [safeLat, safeLng]);

  // Update Tile Layer when Map / Satellite mode toggles
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (currentTileLayerRef.current) {
      try {
        mapInstanceRef.current.removeLayer(currentTileLayerRef.current);
      } catch {}
    }

    try {
      let newTileLayer: L.TileLayer;
      if (basemapMode === 'satellite') {
        newTileLayer = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {
            maxZoom: 19,
            attribution:
              'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
          }
        );
      } else {
        newTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        });
      }

      newTileLayer.addTo(mapInstanceRef.current);
      currentTileLayerRef.current = newTileLayer;
    } catch (err) {
      console.warn('Error switching tile layer:', err);
    }
  }, [basemapMode]);

  // Update Radius Circle boundary around Active Well
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (radiusCircleRef.current) {
      try {
        mapInstanceRef.current.removeLayer(radiusCircleRef.current);
      } catch {}
      radiusCircleRef.current = null;
    }

    try {
      const radiusMeters = selectedRadiusKm * 1000;
      const circle = L.circle([safeLat, safeLng], {
        radius: radiusMeters,
        color: '#f59e0b',
        weight: 1.5,
        dashArray: '6, 6',
        fillColor: '#f59e0b',
        fillOpacity: 0.04,
      }).addTo(mapInstanceRef.current);

      radiusCircleRef.current = circle;
    } catch (err) {
      console.warn('Error updating radius circle:', err);
    }
  }, [selectedRadiusKm, safeLat, safeLng]);

  // Draw Connecting Vector Line when a Well is Selected
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (vectorLineRef.current) {
      try {
        mapInstanceRef.current.removeLayer(vectorLineRef.current);
      } catch {}
      vectorLineRef.current = null;
    }
    if (midpointBadgeRef.current) {
      try {
        mapInstanceRef.current.removeLayer(midpointBadgeRef.current);
      } catch {}
      midpointBadgeRef.current = null;
    }

    if (!activeSelectedWell) return;

    const coords = getWellCoordinates(activeSelectedWell);
    if (!coords || isNaN(coords[0]) || isNaN(coords[1])) return;

    try {
      const line = L.polyline([[safeLat, safeLng], coords], {
        color: '#eab308',
        weight: 2,
        dashArray: '5, 5',
        opacity: 0.9,
      }).addTo(mapInstanceRef.current);
      vectorLineRef.current = line;

      const midLat = (safeLat + coords[0]) / 2;
      const midLng = (safeLng + coords[1]) / 2;

      const badgeIcon = L.divIcon({
        className: 'gis-vector-badge',
        html: `
          <div style="font-family: monospace; font-size: 10px; font-weight: bold; color: #fbbf24; background: rgba(15, 23, 42, 0.95); padding: 2px 7px; border-radius: 4px; border: 1px solid rgba(245, 158, 11, 0.8); white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.6); transform: translate(-50%, -50%); display: flex; align-items: center; gap: 4px;">
            <span>${activeSelectedWell.distanceKm} km</span>
            <span style="color: #64748b;">•</span>
            <span>${activeSelectedWell.azimuthDeg}°</span>
          </div>
        `,
        iconSize: [0, 0],
      });

      const midpointMarker = L.marker([midLat, midLng], {
        icon: badgeIcon,
        interactive: false,
        zIndexOffset: 800,
      }).addTo(mapInstanceRef.current);
      midpointBadgeRef.current = midpointMarker;
    } catch (err) {
      console.warn('Error drawing vector line:', err);
    }
  }, [activeSelectedWell, safeLat, safeLng]);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    const markersGroup = markersGroupRef.current;
    markersGroup.clearLayers();

    try {
      // 1. ACTIVE RIG MARKER
      const activeIcon = L.divIcon({
        className: 'active-well-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer;">
            <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(234, 179, 8, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 20px; height: 20px; background: #0284c7; border: 3px solid #eab308; border-radius: 50%; box-shadow: 0 0 14px rgba(234,179,8,0.95); display: flex; align-items: center; justify-content: center; z-index: 10;">
              <div style="width: 5px; height: 5px; background: #ffffff; border-radius: 50%;"></div>
            </div>
            <div style="margin-top: 4px; font-family: monospace; font-size: 10px; font-weight: bold; color: #fbbf24; background: rgba(15, 23, 42, 0.95); padding: 2px 7px; border-radius: 4px; border: 1px solid rgba(234, 179, 8, 0.7); white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.6); z-index: 10;">
              ACTIVE RIG: ${activeWell?.wellId || 'ACT-RIG-07'}
            </div>
          </div>
        `,
        iconSize: [120, 46],
        iconAnchor: [60, 10],
      });

      const activeMarker = L.marker([safeLat, safeLng], {
        icon: activeIcon,
        zIndexOffset: 1000,
      }).addTo(markersGroup);

      activeMarker.on('click', () => {
        handleResetView();
      });

      activeMarker.bindTooltip(
        `<div style="font-family: monospace; font-size: 11px; padding: 2px 4px; line-height: 1.3;">
          <strong style="color: #38bdf8;">ACTIVE DRILLING WELL</strong><br/>
          <span style="color: #ffffff;">${activeWell?.wellName || activeWell?.wellId || 'Active Rig'}</span><br/>
          <span style="color: #fbbf24; font-weight: bold;">Current Depth: ${activeWell?.currentDepth || 0} m MD</span>
        </div>`,
        { direction: 'top', offset: [0, -12], className: 'gis-hover-tooltip' }
      );

      // 2. NEARBY WELL MARKERS (Filtered by radius)
      const visibleWells = (OFFSET_WELLS || []).filter(
        (w) => typeof w.distanceKm === 'number' && w.distanceKm <= selectedRadiusKm
      );

      visibleWells.forEach((well) => {
        const isSelected = activeSelectedWell?.id === well.id;
        const isStuck = well.primaryIncident?.type === 'Stuck Pipe';
        const isLoss = well.primaryIncident?.type === 'Mud Loss';
        const isKick = well.primaryIncident?.type === 'Gas Influx / Kick';

        const color = isStuck ? '#ef4444' : isLoss ? '#f59e0b' : isKick ? '#f97316' : '#06b6d4';
        const coords = getWellCoordinates(well);
        if (!coords || isNaN(coords[0]) || isNaN(coords[1])) return;

        const markerHtml = `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            ${
              isSelected
                ? `<div style="position: absolute; width: 40px; height: 40px; top: -13px; border-radius: 50%; border: 3px solid #eab308; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.9;"></div>`
                : ''
            }
            <div style="width: ${isSelected ? '20px' : '13px'}; height: ${
          isSelected ? '20px' : '13px'
        }; background: ${color}; border: 2.5px solid ${
          isSelected ? '#eab308' : '#ffffff'
        }; border-radius: 50%; box-shadow: 0 2px 10px rgba(0,0,0,0.6); z-index: 10;">
            </div>
            <span style="margin-top: 3px; font-family: monospace; font-size: ${
              isSelected ? '10px' : '9px'
            }; font-weight: bold; color: ${isSelected ? '#fbbf24' : '#e2e8f0'}; background: rgba(15, 23, 42, ${
          isSelected ? '0.96' : '0.85'
        }); padding: 1px 5px; border-radius: 3px; border: 1px solid ${
          isSelected ? '#eab308' : 'rgba(100, 116, 139, 0.5)'
        }; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.5);">
              ${well.name} (${well.distanceKm}km)
            </span>
          </div>
        `;

        const wellIcon = L.divIcon({
          className: 'offset-well-marker',
          html: markerHtml,
          iconSize: [isSelected ? 110 : 80, isSelected ? 44 : 32],
          iconAnchor: [isSelected ? 55 : 40, isSelected ? 10 : 7],
        });

        const marker = L.marker(coords, {
          icon: wellIcon,
          zIndexOffset: isSelected ? 900 : 400,
        }).addTo(markersGroup);

        marker.bindTooltip(
          `<div style="font-family: monospace; font-size: 11px; padding: 2px 4px; line-height: 1.3;">
            <strong style="color: #ffffff;">${well.name} (${well.id})</strong><br/>
            <span style="color: #94a3b8;">Distance: <b style="color: #fbbf24;">${well.distanceKm} km</b> • Bearing: ${well.azimuthDeg}°</span><br/>
            <span style="color: ${color}; font-weight: bold;">Incident: ${well.primaryIncident?.type || 'Normal'} @ ${well.primaryIncident?.depth || 0}m</span>
          </div>`,
          { direction: 'top', offset: [0, -12], className: 'gis-hover-tooltip' }
        );

        marker.on('click', () => {
          handleSelectWell(well);
        });
      });
    } catch (err) {
      console.warn('Error updating markers:', err);
    }
  }, [activeSelectedWell, selectedRadiusKm, safeLat, safeLng]);

  const visibleWells = (OFFSET_WELLS || []).filter(
    (w) => typeof w.distanceKm === 'number' && w.distanceKm <= selectedRadiusKm
  );

  return (
    <div className="space-y-3 max-w-7xl mx-auto select-none">
      {/* Real Geographic Map Outer Container with explicit responsive height */}
      <div
        className={`w-full rounded-xl border relative overflow-hidden transition-all ${
          isDark
            ? 'bg-[#0b1224] border-slate-800 shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
        style={{ height: '620px', minHeight: '560px', width: '100%' }}
      >
        {/* Unified Non-Overlapping Floating Map Controls Toolbar */}
        <div className="absolute top-3 left-3 right-3 z-[400] pointer-events-none flex flex-wrap items-center justify-between gap-3">
          {/* Main Controls Cluster */}
          <div className="flex flex-wrap items-center gap-3 pointer-events-auto">
            {/* 1. Basemap Toggle [ MAP | SATELLITE ] */}
            <div className="flex items-center rounded-lg bg-slate-900/90 p-0.5 border border-slate-700/80 shadow-lg backdrop-blur-sm shrink-0">
              <button
                onClick={() => setBasemapMode('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded-md transition-all ${
                  basemapMode === 'map'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <MapIcon className="h-3.5 w-3.5" />
                <span>MAP</span>
              </button>
              <button
                onClick={() => setBasemapMode('satellite')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded-md transition-all ${
                  basemapMode === 'satellite'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                <span>SATELLITE</span>
              </button>
            </div>

            {/* 2. Radius Controls [ RADIUS 3km 5km 10km 15km 25km ] */}
            <div className="flex items-center rounded-lg bg-slate-900/90 p-0.5 border border-slate-700/80 shadow-lg backdrop-blur-sm text-xs font-mono shrink-0">
              <span className="text-slate-400 font-semibold px-2 uppercase text-[10px] hidden sm:inline">
                RADIUS
              </span>
              {[3, 5, 10, 15, 25].map((r) => {
                const isCurrent = selectedRadiusKm === r && !activeSelectedWell;
                return (
                  <button
                    key={r}
                    onClick={() => handleRadiusChange(r)}
                    className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-all ${
                      isCurrent
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : selectedRadiusKm === r
                        ? 'bg-amber-500/25 text-amber-300'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                    title={`Zoom out to entire ${r} km radius`}
                  >
                    {r}km
                  </button>
                );
              })}
            </div>

            {/* 3. Inspect Offset Well Dropdown */}
            <div className="flex items-center rounded-lg bg-slate-900/90 px-3 py-1.5 border border-slate-700/80 shadow-lg backdrop-blur-sm text-xs font-mono min-w-[210px] shrink-0">
              <Navigation className="h-3.5 w-3.5 text-cyan-400 mr-2 shrink-0" />
              <select
                value={activeSelectedWell?.id || ''}
                onChange={(e) => {
                  const found = OFFSET_WELLS.find((w) => w.id === e.target.value);
                  if (found) handleSelectWell(found);
                  else handleResetView();
                }}
                className="bg-transparent text-cyan-300 font-bold focus:outline-none cursor-pointer w-full truncate"
              >
                <option value="" className="bg-slate-900 text-slate-400">
                  Inspect Offset Well...
                </option>
                {visibleWells.map((w) => (
                  <option key={w.id} value={w.id} className="bg-slate-900 text-slate-200">
                    {w.name} ({w.distanceKm} km)
                  </option>
                ))}
              </select>
            </div>

            {/* Reset View Button */}
            <button
              onClick={handleResetView}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900/90 px-3 py-1.5 border border-slate-700/80 shadow-lg backdrop-blur-sm text-xs font-mono font-semibold text-slate-200 hover:text-cyan-400 hover:border-cyan-500/50 transition-all shrink-0"
              title="Reset map view to entire radius circle"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>RESET VIEW</span>
            </button>
          </div>

          {/* 4. Legend Group (Right Cluster with dedicated container, zero overlap) */}
          <div className="flex items-center gap-3 rounded-lg bg-slate-900/90 px-3 py-1.5 border border-slate-700/80 shadow-lg backdrop-blur-sm text-[11px] font-mono pointer-events-auto shrink-0 whitespace-nowrap">
            <span className="flex items-center gap-1.5 text-slate-200">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-500 border border-amber-400"></span> Active Rig
            </span>
            <span className="flex items-center gap-1.5 text-slate-200">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span> Stuck Pipe
            </span>
            <span className="flex items-center gap-1.5 text-slate-200">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span> Mud Loss
            </span>
            <span className="flex items-center gap-1.5 text-slate-200">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500"></span> Kick
            </span>
          </div>
        </div>

        {/* Floating Selected-Well Popup Panel */}
        {activeSelectedWell && (
          <div className="absolute bottom-12 right-4 sm:top-20 sm:bottom-auto z-[450] w-84 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-700/90 bg-[#0b1325]/95 p-4 shadow-2xl backdrop-blur-md text-xs font-mono text-slate-200 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-2 mb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                  OFFSET WELL INSPECTION
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  {activeSelectedWell.name}
                </h3>
              </div>
              <button
                onClick={() => {
                  setActiveSelectedWell(null);
                  handleResetView();
                }}
                className="rounded p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close and zoom back to radius view"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Structured Info Rows */}
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between items-center py-0.5 border-b border-slate-800/60">
                <span className="text-slate-400 font-semibold">OFFSET DISTANCE</span>
                <span className="font-bold text-amber-400">{activeSelectedWell.distanceKm} km</span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-b border-slate-800/60">
                <span className="text-slate-400 font-semibold">AZIMUTH BEARING</span>
                <span className="font-bold text-cyan-400">{activeSelectedWell.azimuthDeg}°</span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-b border-slate-800/60">
                <span className="text-slate-400 font-semibold">INCIDENT DEPTH</span>
                <span className="font-bold text-white">{activeSelectedWell.primaryIncident?.depth || 0} m MD</span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-b border-slate-800/60">
                <span className="text-slate-400 font-semibold">FORMATION</span>
                <span className="text-slate-200 truncate max-w-[160px]">
                  {activeSelectedWell.targetFormation?.split('/')[0] || 'Unknown'}
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-b border-slate-800/60">
                <span className="text-slate-400 font-semibold">PRIMARY EVENT</span>
                <span
                  className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                    activeSelectedWell.primaryIncident?.type === 'Stuck Pipe'
                      ? 'text-red-400 bg-red-950/60 border border-red-500/40'
                      : activeSelectedWell.primaryIncident?.type === 'Mud Loss'
                      ? 'text-amber-400 bg-amber-950/60 border border-amber-500/40'
                      : 'text-cyan-400 bg-cyan-950/60 border border-cyan-500/40'
                  }`}
                >
                  {activeSelectedWell.primaryIncident?.type || 'No Incident'}
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-400 font-semibold">REPORT CITATION</span>
                <span className="text-slate-300">
                  {activeSelectedWell.primaryIncident?.reportName?.replace('.pdf', '') || 'N/A'}
                </span>
              </div>
            </div>

            {/* Actions: VIEW DETAILS & JUMP DEPTH */}
            <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-col gap-1.5">
              <button
                onClick={() => {
                  if (onNavigateTab) onNavigateTab('intelligence');
                }}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-mono font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md"
              >
                <span>VIEW HISTORICAL INTELLIGENCE</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => {
                  if (activeSelectedWell.primaryIncident?.depth) {
                    onSetDepth(activeSelectedWell.primaryIncident.depth);
                  }
                }}
                className="w-full rounded-lg py-1.5 text-[11px] font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-colors"
              >
                JUMP BIT TO {activeSelectedWell.primaryIncident?.depth || 0}m MD
              </button>
            </div>
          </div>
        )}

        {/* Bottom Telemetry & Status HUD Bar */}
        <div className="absolute bottom-0 left-0 right-0 z-[400] flex flex-wrap items-center justify-between px-4 py-1.5 bg-slate-950/90 border-t border-slate-800/80 backdrop-blur-md text-[10px] font-mono text-slate-300">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-400">
              <Crosshair className="h-3 w-3 text-cyan-400" />
              <span>
                {cursorPos
                  ? `${cursorPos.lat.toFixed(4)}° N, ${cursorPos.lng.toFixed(4)}° E`
                  : `${safeLat.toFixed(4)}° N, ${safeLng.toFixed(4)}° E`}
              </span>
            </span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="text-slate-400 hidden sm:inline">DATUM: WGS 84 / UTM 43N</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-amber-400 font-semibold">
              {visibleWells.length} OFFSET WELLS WITHIN {selectedRadiusKm} KM
            </span>
            <span className="text-slate-600 hidden md:inline">|</span>
            <span className="text-cyan-400 hidden md:inline">
              RIG: {activeWell?.rigName || 'Active Rig'} (DEPTH: {activeWell?.currentDepth || 0}m)
            </span>
          </div>
        </div>

        {/* Leaflet Map DOM Mount Element with Guaranteed Non-Zero Dimensions */}
        <div
          ref={mapContainerRef}
          id="leaflet-gis-map-container"
          style={{ height: '620px', minHeight: '560px', width: '100%' }}
          className="relative z-10 w-full"
        />
      </div>
    </div>
  );
};
