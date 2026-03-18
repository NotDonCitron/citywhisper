const API_BASE_URL = 'http://localhost:8000';

export const api = {
  fetchPois: async () => {
    const response = await fetch(`${API_BASE_URL}/pois`);
    if (!response.ok) {
      throw new Error(`Error fetching POIs: ${response.statusText}`);
    }
    return response.json();
  },

  fetchRoute: async (poiIds) => {
    const response = await fetch(`${API_BASE_URL}/route`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ poi_ids: poiIds }),
    });
    if (!response.ok) {
      throw new Error(`Error fetching route: ${response.statusText}`);
    }
    return response.json();
  },

  fetchAudio: async (poiId) => {
    const response = await fetch(`${API_BASE_URL}/poi/${poiId}/audio`);
    if (!response.ok) {
      throw new Error(`Error fetching audio: ${response.statusText}`);
    }
    return response.json();
  }
};
