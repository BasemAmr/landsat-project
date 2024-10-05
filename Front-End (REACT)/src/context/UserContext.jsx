import React, { createContext, useContext, useState } from 'react';

// Create a Context for the user settings
const UserContext = createContext({
  location: null,  // { lat: number, lng: number }
  cloudThreshold: 30,  // Default value (percentage)
  notificationPreferences: {
    method: 'email',  // email or SMS
    leadTime: 10,  // in minutes before satellite passes
  },
  setLocation: () => {},
  setCloudThreshold: () => {},
  setNotificationPreferences: () => {},
});

export const useUserContext = () => {
  return useContext(UserContext);
};

export const UserProvider = ({ children }) => {
  // Global state for user settings
  const [location, setLocation] = useState(null); // Default user location is null
  const [cloudThreshold, setCloudThreshold] = useState(15); // Default cloud coverage threshold
  const [notificationPreferences, setNotificationPreferences] = useState({
    leadTime: 24, // Default lead time is 24 hours
    method: 'Email', // Default notification method
  });

  // Context values that will be passed to consuming components
  const value = {
    location,
    setLocation,
    cloudThreshold,
    setCloudThreshold,
    notificationPreferences,
    setNotificationPreferences,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};