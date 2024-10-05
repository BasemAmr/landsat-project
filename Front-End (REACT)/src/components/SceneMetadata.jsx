import React from 'react';

const SceneMetadata = ({ metadata }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-2">Scene Metadata</h2>
      <ul className="space-y-2">
        <li><strong>Acquisition Date:</strong> {metadata.acquisition_date}</li>
        <li><strong>Cloud Cover:</strong> {metadata.cloud_cover}%</li>
        <li><strong>Satellite:</strong> {metadata.satellite}</li>
        <li><strong>Path:</strong> {metadata.path}</li>
        <li><strong>Row:</strong> {metadata.row}</li>
        <li><strong>Quality:</strong> {metadata.quality}</li>
      </ul>
    </div>
  );
};

export default SceneMetadata;