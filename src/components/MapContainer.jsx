import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
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

  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, map, zoom]);

  // Fly to POI on arrival
  useEffect(() => {
    if (flyTarget) {
      map.flyTo([flyTarget.lat, flyTarget.lng], 18, { animate: true, duration: 1.5 });
    }
  }, [flyTarget, map]);

  return null;
};

// Memoized POI Marker Component to prevent flickering
const POIMarker = React.memo(({ poi, isSelected, stopNumber, isMatch, isNear, onClick }) => {
  const getCategoryColor = (cat) => {
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

  const catColor = getCategoryColor(poi.category);
  
  // CRITICAL: Memoize the icon object so Leaflet doesn't re-render it unless state changes
  const icon = React.useMemo(() => L.divIcon({
    className: 'custom-poi-marker-container',
    html: `
      <div class="custom-marker ${isNear ? 'pulse-active' : ''}">
        <div class="marker-dot ${isMatch && !isSelected ? 'border-orange-400' : 'border-white'} flex items-center justify-center shadow-lg transition-all duration-300" style="background-color: ${isSelected ? '#0ea5e9' : catColor}">
          <span class="text-xl">${poi.emoji || '📍'}</span>
        </div>
        ${stopNumber ? `<div class="stop-badge">${stopNumber}</div>` : ''}
        ${isMatch && !stopNumber ? `<div class="interest-badge">✨</div>` : ''}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  }), [isSelected, stopNumber, isMatch, isNear, poi.emoji, catColor]);

  return (
    <Marker 
      position={[poi.lat, poi.lng]}
      eventHandlers={{ click: onClick }}
      icon={icon}
    >
      <Popup>
        <div className="text-black">
          <h4 className="font-bold">{poi.name}</h4>
          <p className="text-xs">{poi.category}</p>
        </div>
      </Popup>
    </Marker>
  );
});

const MapContainerComponent = () => {
  const {
    pois,
    userLocation,
    activeRoute,
    isTourActive,
    togglePoiSelection,
    selectedPois,
    selectedCategories,
    activeDisplayPoi
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
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
        />
        
        <MapController center={mapCenter} zoom={isTourActive ? 19 : 14} isTourActive={isTourActive} flyTarget={activeDisplayPoi} />

        {/* POI Markers */}
        {pois.map((poi) => {
          const isSelected = selectedPois.some(p => p.id === poi.id);
          const stopIndex = selectedPois.findIndex(p => p.id === poi.id);
          const stopNumber = isSelected ? stopIndex + 1 : null;
          const isMatch = selectedCategories.includes(poi.category);

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
              onClick={() => togglePoiSelection(poi)}
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
