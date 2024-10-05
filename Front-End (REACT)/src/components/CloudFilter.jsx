import React, { useState } from 'react';
import { useUserContext } from '../context/UserContext';

const CloudFilter = ({ onFilterChange }) => {
  const { cloudThreshold, setCloudThreshold } = useUserContext();

  // Handler for when the threshold value changes
  const handleThresholdChange = (e) => {
    const value = e.target.value;
    setCloudThreshold(value);
    // Call the parent component's function to apply the filter
    onFilterChange(value);
  };

  return (
    <div>
      <label htmlFor="cloud-filter">Max Cloud Cover Percentage:</label>
      <input
        id="cloud-filter"
        type="range"
        min="0"
        max="100"
        value={cloudThreshold}
        onChange={handleThresholdChange}
      />
      <span>{cloudThreshold}%</span>
    </div>
  );
};

export default CloudFilter;