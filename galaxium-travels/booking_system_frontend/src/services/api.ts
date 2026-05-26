import axios from 'axios';
import type {
  Flight,
  Booking,
  User,
  BookingRequest,
  UserRegistration,
  ErrorResponse,
} from '../types';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data) {
      // Backend returned an error response
      return Promise.reject(error.response.data);
    }
    // Network or other error
    return Promise.reject({
      success: false,
      error: 'Network error',
      error_code: 'NETWORK_ERROR',
      details: error.message,
    } as ErrorResponse);
  }
);

// ==================== Retry Logic ====================

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param maxRetries Maximum number of retry attempts (default: 3)
 * @param delayMs Initial delay in milliseconds (default: 1000)
 */
const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on business logic errors (4xx status codes)
      if (error.error_code && error.error_code !== 'NETWORK_ERROR') {
        throw error;
      }
      
      // Don't retry if we've exhausted all attempts
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying with exponential backoff
      const waitTime = delayMs * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError;
};

// ==================== Flight Endpoints ====================

/**
 * Get all available flights (with retry logic)
 */
export const getFlights = async (): Promise<Flight[]> => {
  return withRetry(async () => {
    const response = await api.get<Flight[]>('/flights');
    return response.data;
  });
};

// ==================== User Endpoints ====================

/**
 * Register a new user (with retry logic)
 */
export const registerUser = async (
  data: UserRegistration
): Promise<User | ErrorResponse> => {
  return withRetry(async () => {
    const response = await api.post<User | ErrorResponse>('/register', data);
    return response.data;
  });
};

/**
 * Get user by name and email (with retry logic)
 */
export const getUserByCredentials = async (
  name: string,
  email: string
): Promise<User | ErrorResponse> => {
  return withRetry(async () => {
    const response = await api.get<User | ErrorResponse>('/user', {
      params: { name, email },
    });
    return response.data;
  });
};

// ==================== Booking Endpoints ====================

/**
 * Book a flight (with retry logic)
 */
export const bookFlight = async (
  data: BookingRequest
): Promise<Booking | ErrorResponse> => {
  return withRetry(async () => {
    const response = await api.post<Booking | ErrorResponse>('/book', data);
    return response.data;
  });
};

/**
 * Get all bookings for a user (with retry logic)
 */
export const getUserBookings = async (userId: number): Promise<Booking[]> => {
  return withRetry(async () => {
    const response = await api.get<Booking[]>(`/bookings/${userId}`);
    return response.data;
  });
};

/**
 * Cancel a booking (with retry logic)
 */
export const cancelBooking = async (
  bookingId: number
): Promise<Booking | ErrorResponse> => {
  return withRetry(async () => {
    const response = await api.post<Booking | ErrorResponse>(
      `/cancel/${bookingId}`
    );
    return response.data;
  });
};

// ==================== Helper Functions ====================

/**
 * Check if response is an error
 */
export const isErrorResponse = (
  response: any
): response is ErrorResponse => {
  return response && response.success === false;
};

/**
 * Health check
 */
export const healthCheck = async (): Promise<{ status: string }> => {
  const response = await api.get<{ status: string }>('/');
  return response.data;
};

export default api;

// Made with Bob
