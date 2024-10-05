import React, { useState, useEffect } from 'react';
import { useUserContext } from '../context/UserContext';
import { analyzeLandsat } from '../services/landsatApi';
import MapView from '../components/MapView';
import NotificationSettings from '../components/NotificationSettings';
import CloudFilter from '../components/CloudFilter';
import SpectralGraph from '../components/SpectralGraph';
import SceneMetadata from '../components/SceneMetadata';
import DataExport from '../components/DataExport';

const Dashboard = () => {
  const { location, cloudThreshold, setCloudThreshold } = useUserContext();
  const [landsatData, setLandsatData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (location) {
      fetchLandsatData();
    }
  }, [location, cloudThreshold]);

  const fetchLandsatData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeLandsat(
        `${location.lat},${location.lng}`,
        cloudThreshold,
        'latest'
      );
      setLandsatData(data);
    } catch (err) {
      setError(err.message || 'An error occurred while fetching Landsat data.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (value) => {
    setCloudThreshold(value);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!landsatData) return <div>No data available. Please select a location.</div>;

  const spectralData = {
    bands: Object.keys(landsatData.reflectance_data),
    values: Object.values(landsatData.reflectance_data)
  };

  const dataForExport = [
    ['Band', 'Reflectance'],
    ...Object.entries(landsatData.reflectance_data)
  ];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Landsat Data Dashboard</h1>
      <MapView geoJsonData={{
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(location.lng), parseFloat(location.lat)]
        }
      }} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <CloudFilter onFilterChange={handleFilterChange} />
        <NotificationSettings />
        <SpectralGraph data={spectralData} />
        <SceneMetadata metadata={landsatData.scene_metadata} />
      </div>
      <DataExport data={dataForExport} />
    </div>
  );
};

export default Dashboard;