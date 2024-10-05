import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../context/UserContext';
import LocationInput from '../components/LocationInput';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const LocationSelector = ({ onLocationChange }) => {
  const [position, setPosition] = useState(null);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationChange(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
};

const ParentComponent = () => {
  const navigate = useNavigate();
  const { setLocation } = useUserContext();
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleLocationSelect = (latlng) => {
    console.log('Selected location:', latlng);
    setSelectedLocation(latlng);
  };

  const handleDashboardClick = () => {
    if (selectedLocation) {
      setLocation(selectedLocation);
      navigate('/dashboard');
    } else {
      alert('Please select a location first.');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Select Location</h1>
      <LocationInput onLocationChange={handleLocationSelect} />
      <div className="mt-4">
        <button
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700"
          onClick={handleDashboardClick}
        >
          Go to Dashboard
        </button>
      </div>
      <MapContainer
        center={[51.505, -0.09]}
        zoom={13}
        style={{ height: '400px', width: '100%', marginTop: '20px' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <LocationSelector onLocationChange={handleLocationSelect} />
      </MapContainer>
    </div>
  );
};

export default ParentComponent;