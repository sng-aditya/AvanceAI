// Simple API connection test for mobile debugging
export const testConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      mode: 'cors',
      credentials: 'include',
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('API Connection Test Success:', data);
      return { success: true, data };
    } else {
      console.error('API Connection Test Failed:', response.status, response.statusText);
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.error('API Connection Test Error:', error);
    return { success: false, error: error.message };
  }
};

// Add to window for debugging in mobile browser console
if (typeof window !== 'undefined') {
  (window as any).testApiConnection = testConnection;
}