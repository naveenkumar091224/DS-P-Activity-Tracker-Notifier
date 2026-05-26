// API Data Models matching backend schemas

export interface Flight {
  flight_id: number;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  
  // Per-class pricing and availability
  economy_price: number;
  economy_seats_available: number;
  business_price: number;
  business_seats_available: number;
  galaxium_price: number;
  galaxium_seats_available: number;
}

export interface Booking {
  booking_id: number;
  user_id: number;
  flight_id: number;
  seat_class: 'economy' | 'business' | 'galaxium';
  price_paid: number;
  status: 'booked' | 'cancelled' | 'completed';
  booking_time: string;
}

export interface User {
  user_id: number;
  name: string;
  email: string;
}

// Payment method types
export type PaymentMethod = 'credit_card' | 'debit_card' | 'upi' | 'emi' | 'net_banking' | 'cash_on_delivery';

export interface PaymentOption {
  id: PaymentMethod;
  name: string;
  icon: string;
  description: string;
  surcharge?: number; // Percentage surcharge (e.g., 50 for COD)
}

// Request/Response types
export interface BookingRequest {
  user_id: number;
  name: string;
  flight_id: number;
  seat_class: 'economy' | 'business' | 'galaxium';
  payment_method?: PaymentMethod;
}

export interface UserRegistration {
  name: string;
  email: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  error_code: string;
  details?: string;
}

// Extended types for UI
export interface BookingWithFlight extends Booking {
  flight?: Flight;
}

export interface FlightFilters {
  origin?: string;
  destination?: string;
  minPrice?: number;
  maxPrice?: number;
  searchTerm?: string;
}

// User context type
export interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

// Seat class information type
export interface SeatClass {
  name: 'economy' | 'business' | 'galaxium';
  displayName: string;
  price: number;
  seatsAvailable: number;
  description: string;
  icon: string;
}

// Made with Bob
