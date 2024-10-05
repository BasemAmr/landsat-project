import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

export const analyzeLandsat = async (location, cloudCover, dateRange) => {
    try {
        const response = await axios.post(`${BASE_URL}/analyze_landsat`, {
            location,
            cloud_cover: cloudCover,
            date_range: dateRange
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error("Error response:", error.response.data);
            throw new Error(error.response.data.error || "An error occurred while fetching Landsat data.");
        } else if (error.request) {
            // The request was made but no response was received
            console.error("No response received:", error.request);
            throw new Error("No response received from the server. Please check your network connection.");
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error("Error", error.message);
            throw new Error("An error occurred while setting up the request.");
        }
    }
};