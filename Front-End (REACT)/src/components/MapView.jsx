import React from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';

const MapView = ({ geoJsonData }) => {
  return (
    <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: '400px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {geoJsonData && <GeoJSON data={geoJsonData} />}
    </MapContainer>
  );
};

export default MapView;