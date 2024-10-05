import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUserContext } from '../context/UserContext';

const useLandsatData = (location) => {
  const [data, setData] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const { cloudThreshold } = useUserContext();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`API_URL`, {
          params: {
            lat: location.lat,
            lon: location.lng,
            cloudCover: cloudThreshold,
          },
        });
        setData(response.data.spectralData);
        setMetadata(response.data.metadata);
      } catch (error) {
        console.error('Error fetching Landsat data:', error);
      }
    };
    if (location) fetchData();
  }, [location, cloudThreshold]);

  return { data, metadata };
};

export default useLandsatData;