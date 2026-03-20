import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTourContext } from '../context/TourContext';

// Fix for default marker icons in Leaflet + Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom User Location Icon
const userIcon = L.divIcon({
  className: 'user-location-marker',
  html: '<div class="user-location-dot"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

// Component to handle map center and view updates
const MapController = ({ center, zoom, isTourActive, flyTarget }) => {
  const map = useMap();
  const hasSetInitialZoom = React.useRef(false);
  const userDragged = React.useRef(false);

  // Detect when user manually drags/moves the map
  useEffect(() => {
    const onDragStart = () => { userDragged.current = true; };
    map.on('dragstart', onDragStart);
    return () => { map.off('dragstart', onDragStart); };
  }, [map]);

  // During tour: only pan to follow user if they haven't dragged the map
  useEffect(() => {
    if (!center) return;
    if (isTourActive) {
      if (!hasSetInitialZoom.current) {
        map.setView(center, zoom || 17, { animate: true });
        hasSetInitialZoom.current = true;
        userDragged.current = false;
      } else if (!userDragged.current) {
        map.setView(center, map.getZoom(), { animate: true, duration: 0.3 });
      }
    } else {
      hasSetInitialZoom.current = false;
      userDragged.current = false;
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, map, zoom, isTourActive]);

  // Fly to POI on arrival — always fly, and re-enable follow mode
  useEffect(() => {
    if (flyTarget) {
      userDragged.current = false;
      map.flyTo([flyTarget.lat, flyTarget.lng], 18, { animate: true, duration: 1.5 });
    }
  }, [flyTarget, map]);

  return null;
};

// Fake GPS: click on map to set user location
const FakeGpsHandler = ({ enabled, onLocationSet }) => {
  useMapEvents({
    click(e) {
      if (enabled) {
        onLocationSet({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          accuracy: 10,
          heading: null,
          speed: 1.2,
          timestamp: Date.now()
        });
      }
    }
  });
  return null;
};

// Memoized POI Marker Component to prevent flickering
const POIMarker = ({ poi, isSelected, stopNumber, isMatch, isNear, markerStyle, onClick }) => {
  const getCategoryColor = (cat) => {
    if (markerStyle === 'minimal') return '#475569'; // slate-600 for all
    switch(cat?.toLowerCase()) {
      case 'history': return '#f59e0b';
      case 'art': return '#ec4899';
      case 'architecture': return '#0ea5e9';
      case 'subculture': return '#8b5cf6';
      case 'nature': return '#22c55e';
      case 'urban': return '#64748b';
      default: return '#334155';
    }
  };

  const catColor = getCategoryColor(Array.isArray(poi.categories) ? poi.categories[0] : poi.category);
  
  // CRITICAL: Memoize the icon object so Leaflet doesn't re-render it unless state changes
  const borderStyle = markerStyle === 'minimal'
    ? (isMatch && !isSelected ? 'border-sky-400' : 'border-slate-500/60')
    : (isMatch && !isSelected ? 'border-orange-400' : 'border-white');

  const icon = React.useMemo(() => L.divIcon({
    className: 'custom-poi-marker-container',
    html: `
      <div class="custom-marker ${isNear ? 'pulse-active' : ''}">
        <div class="marker-dot ${borderStyle} flex items-center justify-center shadow-lg transition-all duration-300" style="background-color: ${isSelected ? '#0ea5e9' : catColor}">
          <span class="text-xl">${poi.emoji || '📍'}</span>
        </div>
        ${stopNumber ? `<div class="stop-badge">${stopNumber}</div>` : ''}
        ${isMatch && !stopNumber ? `<div class="interest-badge">✨</div>` : ''}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  }), [isSelected, stopNumber, isMatch, isNear, poi.emoji, catColor, borderStyle, markerStyle]);

  return (
    <Marker
      position={[poi.lat, poi.lng]}
      eventHandlers={{ click: onClick }}
      icon={icon}
    />
  );
};

const MapContainerComponent = () => {
  const {
    pois,
    userLocation,
    setUserLocation,
    activeRoute,
    isTourActive,
    togglePoiSelection,
    selectedPois,
    selectedCategories,
    activeDisplayPoi,
    markerStyle,
    setPreviewPoi,
    fakeGpsEnabled,
  } = useTourContext();

  const [mapCenter, setMapCenter] = useState([49.4875, 8.4660]); // Default Mannheim center

  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation]);

  return (
    <div id="map" className="h-screen w-full relative z-0">
      <MapContainer
        center={mapCenter}
        zoom={13}
        scrollWheelZoom={true}
        dragging={true}
        touchZoom={true}
        doubleClickZoom={true}
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
        />
        
        <MapController center={mapCenter} zoom={isTourActive ? 19 : 14} isTourActive={isTourActive} flyTarget={activeDisplayPoi} />
        <FakeGpsHandler enabled={fakeGpsEnabled} onLocationSet={setUserLocation} />

        {/* POI Markers */}
        {pois.map((poi) => {
          const isSelected = selectedPois.some(p => p.id === poi.id);
          const stopIndex = selectedPois.findIndex(p => p.id === poi.id);
          const stopNumber = isSelected ? stopIndex + 1 : null;
          const isMatch = selectedCategories.length > 0 && Array.isArray(poi.categories) && poi.categories.some(cat => selectedCategories.includes(cat));

          // Calculate distance for pulse animation
          let isNear = false;
          if (userLocation) {
            const dx = userLocation.lng - poi.lng;
            const dy = userLocation.lat - poi.lat;
            const dist = Math.sqrt(dx * dx + dy * dy) * 111320;
            if (dist < 150) isNear = true;
          }

          return (
            <POIMarker 
              key={poi.id}
              poi={poi}
              isSelected={isSelected}
              stopNumber={stopNumber}
              isMatch={isMatch}
              isNear={isNear}
              markerStyle={markerStyle}
              onClick={() => isTourActive ? togglePoiSelection(poi) : setPreviewPoi(poi)}
            />
          );
        })}

        {/* Active Route Polyline */}
        {activeRoute && activeRoute.geometry && (
          <Polyline 
            positions={activeRoute.geometry.coordinates.map(c => [c[1], c[0]])} 
            pathOptions={{ 
              color: '#0ea5e9', 
              weight: 6, 
              opacity: 0.8,
              lineJoin: 'round',
              className: 'route-glow' 
            }} 
          />
        )}

        {/* User Location Marker */}
        {userLocation && (
          <Marker 
            position={[userLocation.lat, userLocation.lng]} 
            icon={userIcon}
            zIndexOffset={1000}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapContainerComponent;
