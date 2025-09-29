import React, { createContext, useContext } from 'react';
import axios from 'axios';
import cacheService, { CacheService } from '../services/cacheService';

const ApiContext = createContext();

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 180000, // 3 minutes timeout for post generation
});

// Enhanced API client with caching
const enhancedApiClient = {
  ...apiClient,
  
  async get(url, config = {}) {
    const cacheKey = `GET_${url}`;
    const cached = cacheService.get(cacheKey);
    
    if (cached && !config.forceRefresh) {
      return { data: cached };
    }
    
    try {
      const response = await apiClient.get(url, config);
      cacheService.set(cacheKey, response.data);
      return response;
    } catch (error) {
      // Return cached data if available on error
      if (cached) {
        console.warn('API error, returning cached data:', error.message);
        return { data: cached };
      }
      throw error;
    }
  },
  
  async post(url, data, config = {}) {
    const response = await apiClient.post(url, data, config);
    
    // Invalidate related cache entries
    this.invalidateCache(url);
    
    return response;
  },
  
  async put(url, data, config = {}) {
    const response = await apiClient.put(url, data, config);
    this.invalidateCache(url);
    return response;
  },
  
  async delete(url, config = {}) {
    const response = await apiClient.delete(url, config);
    this.invalidateCache(url);
    return response;
  },
  
  invalidateCache(url) {
    // Clear cache for related endpoints
    if (url.includes('/improve/profiles')) {
      cacheService.delete(CacheService.KEYS.PROFILES);
    }
    if (url.includes('/improve/progress/')) {
      const matches = url.match(/\/improve\/progress\/([^/]+)\/([^/]+)/);
      if (matches) {
        cacheService.delete(CacheService.KEYS.PROGRESS(matches[1], matches[2]));
      }
    }
    if (url.includes('/improve/questions/')) {
      const matches = url.match(/\/improve\/questions\/([^/]+)\/([^/]+)/);
      if (matches) {
        cacheService.delete(CacheService.KEYS.QUESTIONS(matches[1], matches[2]));
      }
    }
    
    // Clear cache for companies and persons endpoints
    if (url.includes('/companies')) {
      cacheService.delete('GET_/companies');
      cacheService.delete(CacheService.KEYS.COMPANIES);
      // Clear any cached individual company data
      const companyMatches = url.match(/\/companies\/([^/]+)/);
      if (companyMatches) {
        cacheService.delete(`GET_/companies/${companyMatches[1]}`);
      }
    }
    if (url.includes('/persons')) {
      cacheService.delete('GET_/persons');
      cacheService.delete(CacheService.KEYS.PERSONS);
      // Clear any cached individual person data
      const personMatches = url.match(/\/persons\/([^/]+)/);
      if (personMatches) {
        cacheService.delete(`GET_/persons/${personMatches[1]}`);
      }
    }
    
    // Clear posts cache when profiles change
    if (url.includes('/companies') || url.includes('/persons')) {
      cacheService.delete(CacheService.KEYS.POSTS);
      cacheService.delete('GET_/posts');
    }
  }
};

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.error('Unauthorized access');
    }
    return Promise.reject(error);
  }
);

export const ApiProvider = ({ children }) => {
  return (
    <ApiContext.Provider value={{ apiClient: enhancedApiClient }}>
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};
