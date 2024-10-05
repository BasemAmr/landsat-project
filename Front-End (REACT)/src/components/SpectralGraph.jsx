import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const SpectralGraph = ({ data }) => {
  const chartData = {
    labels: data.bands,
    datasets: [
      {
        label: 'Surface Reflectance',
        data: data.values,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Spectral Reflectance',
      },
    },
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-2">Spectral Reflectance</h2>
      <Line data={chartData} options={options} />
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Spectral Data</h3>
        <ul className="space-y-2">
          {data.bands.map((band, index) => (
            <li key={band}>
              <strong>{band}:</strong> {data.values[index]}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SpectralGraph;