import React from 'react';
import { useUserContext } from '../context/UserContext';

const NotificationSettings = () => {
  const { notificationPreferences, setNotificationPreferences } = useUserContext();

  const handleLeadTimeChange = (e) => {
    setNotificationPreferences({
      ...notificationPreferences,
      leadTime: e.target.value,
    });
  };

  const handleMethodChange = (e) => {
    setNotificationPreferences({
      ...notificationPreferences,
      method: e.target.value,
    });
  };

  return (
    <div>
      <h3>Notification Preferences</h3>
      <label>Lead Time (in hours):</label>
      <input
        type="number"
        value={notificationPreferences.leadTime}
        onChange={handleLeadTimeChange}
      />
      <label>Notification Method:</label>
      <select
        value={notificationPreferences.method}
        onChange={handleMethodChange}
      >
        <option value="Email">Email</option>
        <option value="SMS">SMS</option>
        <option value="Push Notification">Push Notification</option>
      </select>
    </div>
  );
};

export default NotificationSettings;