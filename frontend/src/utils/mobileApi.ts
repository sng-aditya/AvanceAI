// Mobile-specific API utilities
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const createMobileHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Add mobile-specific headers
  if (isMobile()) {
    headers['X-Requested-With'] = 'XMLHttpRequest';
    headers['Cache-Control'] = 'no-cache';
    headers['Pragma'] = 'no-cache';
  }

  return headers;
};

export const createFetchOptions = (method: string, body?: any): RequestInit => {
  const options: RequestInit = {
    method,
    headers: createMobileHeaders(),
    credentials: 'include',
    mode: 'cors',
    cache: 'no-cache',
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  // Mobile-specific timeout
  if (isMobile()) {
    // Add timeout for mobile requests
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 30000); // 30 second timeout
    options.signal = controller.signal;
  }

  return options;
};

export const handleFetchError = (error: any, context: string) => {
  console.error(`${context} error:`, error);
  
  if (error.name === 'AbortError') {
    throw new Error('Request timeout. Please check your connection and try again.');
  }
  
  if (error instanceof TypeError && error.message.includes('fetch')) {
    if (isMobile()) {
      throw new Error('Network connection failed. Please ensure you have a stable internet connection and try again.');
    } else {
      throw new Error('Network connection failed. Please check your internet connection.');
    }
  }
  
  throw error;
};