// Data optimization utilities for reducing internet usage

// Compress data before sending to API
export const compressData = (data) => {
  try {
    const jsonString = JSON.stringify(data);
    // Simple compression by removing unnecessary whitespace and optimizing structure
    return JSON.stringify(data, null, 0);
  } catch (error) {
    console.warn('Data compression failed:', error);
    return data;
  }
};

// Debounce function to reduce API calls
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

// Throttle function to limit API call frequency
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Batch multiple API calls into single request
export class APIBatcher {
  constructor(batchSize = 10, delay = 1000) {
    this.batchSize = batchSize;
    this.delay = delay;
    this.queue = [];
    this.timeoutId = null;
  }

  add(request) {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });
      
      if (this.queue.length >= this.batchSize) {
        this.flush();
      } else if (!this.timeoutId) {
        this.timeoutId = setTimeout(() => this.flush(), this.delay);
      }
    });
  }

  flush() {
    if (this.queue.length === 0) return;
    
    const batch = this.queue.splice(0);
    clearTimeout(this.timeoutId);
    this.timeoutId = null;

    // Process batch (implement based on your API structure)
    this.processBatch(batch);
  }

  processBatch(batch) {
    // Group similar requests
    const grouped = batch.reduce((acc, item) => {
      const key = item.request.type || 'default';
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    // Process each group
    Object.entries(grouped).forEach(([type, items]) => {
      this.processBatchGroup(type, items);
    });
  }

  processBatchGroup(type, items) {
    // Implement batch processing logic based on request type
    items.forEach(({ request, resolve, reject }) => {
      // For now, resolve individually
      // In production, you'd make a single API call for all items
      resolve(request);
    });
  }
}

// Smart caching with expiration
export class SmartCache {
  constructor(maxSize = 100, defaultTTL = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  set(key, value, ttl = this.defaultTTL) {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

// Optimize localStorage usage
export const optimizeLocalStorage = () => {
  const STORAGE_LIMIT = 5 * 1024 * 1024; // 5MB limit
  
  const getCurrentUsage = () => {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  };

  const cleanupOldData = () => {
    const keys = Object.keys(localStorage);
    const dataWithTimestamps = [];

    keys.forEach(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (data && data.timestamp) {
          dataWithTimestamps.push({ key, timestamp: data.timestamp });
        }
      } catch (e) {
        // Skip non-JSON data
      }
    });

    // Sort by timestamp (oldest first)
    dataWithTimestamps.sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest 25% of timestamped data
    const toRemove = Math.floor(dataWithTimestamps.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      localStorage.removeItem(dataWithTimestamps[i].key);
    }
  };

  if (getCurrentUsage() > STORAGE_LIMIT * 0.8) {
    cleanupOldData();
  }
};

// Network-aware data loading
export const loadDataBasedOnConnection = async (highQualityLoader, lowQualityLoader, connectionType) => {
  const slowConnections = ['slow-2g', '2g'];
  
  if (slowConnections.includes(connectionType) || !navigator.onLine) {
    return await lowQualityLoader();
  } else {
    try {
      return await highQualityLoader();
    } catch (error) {
      console.warn('High quality load failed, falling back to low quality:', error);
      return await lowQualityLoader();
    }
  }
};

// Initialize global instances
export const globalCache = new SmartCache();
export const globalBatcher = new APIBatcher();
