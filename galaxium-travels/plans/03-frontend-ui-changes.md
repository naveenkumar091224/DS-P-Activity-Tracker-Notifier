# Plan 3: Frontend UI Changes for Seat Classes

## Overview
Update the React frontend to display seat class options, allow users to select their preferred class, show pricing differences, and handle the updated API responses. This is the final piece that brings seat classes to the user interface.

## Current State Analysis

### Existing UI Flow
- [`FlightCard`](../booking_system_frontend/src/components/flights/FlightCard.tsx) displays single price
- [`BookingModal`](../booking_system_frontend/src/components/bookings/BookingModal.tsx) shows booking without class info
- No seat class selection UI
- [`api.ts`](../booking_system_frontend/src/services/api.ts) sends booking requests without seat class

### Impact Assessment
- **User Experience**: Major enhancement - users can choose seat class
- **Visual Design**: Needs new UI components for class selection
- **API Integration**: Must handle new request/response formats

## Proposed Changes

### 1. Update TypeScript Types

**File**: [`booking_system_frontend/src/types/index.ts`](../booking_system_frontend/src/types/index.ts:3-11)

**Changes**:
```typescript
export interface Flight {
  flight_id: number;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  
  // Remove single price and seats
  // Add per-class pricing and availability
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
  seat_class: 'economy' | 'business' | 'galaxium';  // NEW
  price_paid: number;  // NEW
  status: 'booked' | 'cancelled' | 'completed';
  booking_time: string;
}

export interface BookingRequest {
  user_id: number;
  name: string;
  flight_id: number;
  seat_class: 'economy' | 'business' | 'galaxium';  // NEW
}

// NEW: Seat class information type
export interface SeatClass {
  name: 'economy' | 'business' | 'galaxium';
  displayName: string;
  price: number;
  seatsAvailable: number;
  description: string;
  icon: string;  // Emoji or icon identifier
}
```

### 2. Create Seat Class Selector Component

**New File**: `booking_system_frontend/src/components/flights/SeatClassSelector.tsx`

**Purpose**: Reusable component for selecting seat class with visual pricing comparison

**Implementation**:
```typescript
import { Check } from 'lucide-react';
import { SeatClass } from '../../types';
import { Card } from '../common';

interface SeatClassSelectorProps {
  classes: SeatClass[];
  selectedClass: 'economy' | 'business' | 'galaxium';
  onSelectClass: (className: 'economy' | 'business' | 'galaxium') => void;
}

export const SeatClassSelector = ({ 
  classes, 
  selectedClass, 
  onSelectClass 
}: SeatClassSelectorProps) => {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-star-white">Select Seat Class</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {classes.map((seatClass) => {
          const isSelected = selectedClass === seatClass.name;
          const isAvailable = seatClass.seatsAvailable > 0;
          
          return (
            <Card
              key={seatClass.name}
              className={`
                cursor-pointer transition-all relative
                ${isSelected ? 'ring-2 ring-cosmic-purple' : ''}
                ${!isAvailable ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
              `}
              onClick={() => isAvailable && onSelectClass(seatClass.name)}
            >
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <Check className="w-5 h-5 text-cosmic-purple" />
                </div>
              )}
              
              <div className="text-center space-y-2">
                <div className="text-3xl">{seatClass.icon}</div>
                <h4 className="font-bold text-star-white">{seatClass.displayName}</h4>
                <p className="text-sm text-star-white/70">{seatClass.description}</p>
                <div className="text-2xl font-bold text-cosmic-purple">
                  ${seatClass.price}
                </div>
                <p className="text-xs text-star-white/60">
                  {isAvailable 
                    ? `${seatClass.seatsAvailable} seats available`
                    : 'Sold out'
                  }
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
```

**Features**:
- Visual card-based selection
- Shows pricing, availability, and description
- Disabled state for sold-out classes
- Selected state with visual indicator
- Responsive grid layout

### 3. Update FlightCard Component

**File**: [`booking_system_frontend/src/components/flights/FlightCard.tsx`](../booking_system_frontend/src/components/flights/FlightCard.tsx)

**Changes**:
```typescript
import { Plane, Calendar, Clock, Users } from 'lucide-react';
import { Flight } from '../../types';
import { Card, Button } from '../common';
import { formatDate, formatTime } from '../../utils/formatters';

interface FlightCardProps {
  flight: Flight;
  onBook: (flight: Flight) => void;
}

export const FlightCard = ({ flight, onBook }: FlightCardProps) => {
  // Calculate total available seats across all classes
  const totalSeats = 
    flight.economy_seats_available + 
    flight.business_seats_available + 
    flight.galaxium_seats_available;
  
  // Get lowest price for display
  const fromPrice = Math.min(
    flight.economy_price,
    flight.business_price,
    flight.galaxium_price
  );
  
  const hasAvailability = totalSeats > 0;

  return (
    <Card className="hover:scale-[1.02] transition-transform">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        {/* Flight Info */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-cosmic-purple" />
            <h3 className="text-xl font-bold text-star-white">
              {flight.origin} → {flight.destination}
            </h3>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-star-white/70">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(flight.departure_time)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatTime(flight.departure_time)} - {formatTime(flight.arrival_time)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{totalSeats} seats available</span>
            </div>
          </div>
          
          {/* Seat Class Availability Summary */}
          <div className="flex gap-3 text-xs">
            <span className={flight.economy_seats_available > 0 ? 'text-alien-green' : 'text-star-white/40'}>
              Economy: {flight.economy_seats_available}
            </span>
            <span className={flight.business_seats_available > 0 ? 'text-alien-green' : 'text-star-white/40'}>
              Business: {flight.business_seats_available}
            </span>
            <span className={flight.galaxium_seats_available > 0 ? 'text-alien-green' : 'text-star-white/40'}>
              Galaxium: {flight.galaxium_seats_available}
            </span>
          </div>
        </div>

        {/* Pricing and Booking */}
        <div className="flex flex-col items-end justify-between">
          <div className="text-right">
            <p className="text-sm text-star-white/70">From</p>
            <p className="text-3xl font-bold text-cosmic-purple">${fromPrice}</p>
          </div>
          
          <Button
            onClick={() => onBook(flight)}
            disabled={!hasAvailability}
            className="w-full md:w-auto"
          >
            {hasAvailability ? 'Book Now' : 'Sold Out'}
          </Button>
        </div>
      </div>
    </Card>
  );
};
```

**Key Changes**:
- Display "From $X" showing lowest price
- Show availability summary for all classes
- Calculate total seats across all classes
- Visual indicators for class availability

### 4. Update BookingModal Component

**File**: [`booking_system_frontend/src/components/bookings/BookingModal.tsx`](../booking_system_frontend/src/components/bookings/BookingModal.tsx)

**Changes**:
```typescript
import { useState } from 'react';
import { Modal, Button } from '../common';
import { SeatClassSelector } from '../flights/SeatClassSelector';
import { Flight, SeatClass } from '../../types';
import { useUser } from '../../hooks/useUser';
import { bookFlight, isErrorResponse } from '../../services/api';
import toast from 'react-hot-toast';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  flight: Flight | null;
  onSuccess: () => void;
}

export const BookingModal = ({ isOpen, onClose, flight, onSuccess }: BookingModalProps) => {
  const { user } = useUser();
  const [selectedClass, setSelectedClass] = useState<'economy' | 'business' | 'galaxium'>('economy');
  const [isLoading, setIsLoading] = useState(false);

  if (!flight) return null;

  // Build seat class options from flight data
  const seatClasses: SeatClass[] = [
    {
      name: 'economy',
      displayName: 'Economy',
      price: flight.economy_price,
      seatsAvailable: flight.economy_seats_available,
      description: 'Comfortable seating with standard amenities',
      icon: '🪑'
    },
    {
      name: 'business',
      displayName: 'Business',
      price: flight.business_price,
      seatsAvailable: flight.business_seats_available,
      description: 'Extra legroom and premium service',
      icon: '💼'
    },
    {
      name: 'galaxium',
      displayName: 'Galaxium',
      price: flight.galaxium_price,
      seatsAvailable: flight.galaxium_seats_available,
      description: 'Luxury experience with exclusive perks',
      icon: '⭐'
    }
  ];

  const selectedClassInfo = seatClasses.find(c => c.name === selectedClass);

  const handleBooking = async () => {
    if (!user) {
      toast.error('Please sign in to book a flight');
      return;
    }

    if (!selectedClassInfo || selectedClassInfo.seatsAvailable === 0) {
      toast.error('Selected class is not available');
      return;
    }

    setIsLoading(true);

    try {
      const result = await bookFlight({
        user_id: user.user_id,
        name: user.name,
        flight_id: flight.flight_id,
        seat_class: selectedClass
      });

      if (isErrorResponse(result)) {
        toast.error(result.details || result.error);
        return;
      }

      toast.success(`${selectedClassInfo.displayName} class booked successfully!`);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.details || error.error || 'Booking failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Book Your Flight" size="lg">
      <div className="space-y-6">
        {/* Flight Summary */}
        <div className="bg-space-blue/30 rounded-lg p-4">
          <h3 className="font-bold text-star-white mb-2">
            {flight.origin} → {flight.destination}
          </h3>
          <p className="text-sm text-star-white/70">
            {flight.departure_time} - {flight.arrival_time}
          </p>
        </div>

        {/* Seat Class Selection */}
        <SeatClassSelector
          classes={seatClasses}
          selectedClass={selectedClass}
          onSelectClass={setSelectedClass}
        />

        {/* Booking Summary */}
        {selectedClassInfo && (
          <div className="bg-cosmic-purple/10 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-star-white">
              <span>Class:</span>
              <span className="font-bold">{selectedClassInfo.displayName}</span>
            </div>
            <div className="flex justify-between text-star-white">
              <span>Price:</span>
              <span className="font-bold text-cosmic-purple">${selectedClassInfo.price}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="secondary"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleBooking}
            isLoading={isLoading}
            disabled={!selectedClassInfo || selectedClassInfo.seatsAvailable === 0}
            className="flex-1"
          >
            Confirm Booking
          </Button>
        </div>
      </div>
    </Modal>
  );
};
```

**Key Features**:
- Integrated seat class selector
- Flight summary at top
- Booking summary showing selected class and price
- Disabled state when class unavailable
- Success message includes class name

### 5. Update BookingCard Component

**File**: [`booking_system_frontend/src/components/bookings/BookingCard.tsx`](../booking_system_frontend/src/components/bookings/BookingCard.tsx)

**Changes**:
```typescript
// Add seat class badge display
const getClassBadge = (seatClass: string) => {
  const badges = {
    economy: { label: 'Economy', color: 'bg-blue-500/20 text-blue-300', icon: '🪑' },
    business: { label: 'Business', color: 'bg-purple-500/20 text-purple-300', icon: '💼' },
    galaxium: { label: 'Galaxium', color: 'bg-yellow-500/20 text-yellow-300', icon: '⭐' }
  };
  
  return badges[seatClass as keyof typeof badges] || badges.economy;
};

// In the component JSX, add:
<div className="flex items-center gap-2">
  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getClassBadge(booking.seat_class).color}`}>
    {getClassBadge(booking.seat_class).icon} {getClassBadge(booking.seat_class).label}
  </span>
  <span className="text-star-white font-bold">${booking.price_paid}</span>
</div>
```

**Key Changes**:
- Display seat class badge with icon
- Show price paid (historical pricing)
- Color-coded class indicators

### 6. Update API Service

**File**: [`booking_system_frontend/src/services/api.ts`](../booking_system_frontend/src/services/api.ts:77-82)

**Changes**:
```typescript
/**
 * Book a flight (with retry logic)
 */
export const bookFlight = async (
  data: BookingRequest  // Now includes seat_class
): Promise<Booking | ErrorResponse> => {
  return withRetry(async () => {
    const response = await api.post<Booking | ErrorResponse>('/book', data);
    return response.data;
  });
};
```

**Note**: No changes needed - TypeScript types handle the new field

## Visual Design Enhancements

### Color Scheme for Classes
- **Economy**: Blue tones (`#3B82F6`)
- **Business**: Purple tones (`#8B5CF6`)
- **Galaxium**: Gold/Yellow tones (`#F59E0B`)

### Icons/Emojis
- Economy: 🪑 (chair)
- Business: 💼 (briefcase)
- Galaxium: ⭐ (star)

### Responsive Design
- Mobile: Stacked seat class cards
- Tablet/Desktop: 3-column grid for class selection

## Testing Checklist

- [ ] Flight cards display all three class prices and availability
- [ ] Seat class selector shows correct pricing
- [ ] Sold-out classes are disabled
- [ ] Selected class is visually indicated
- [ ] Booking includes selected class in request
- [ ] Booking confirmation shows correct class and price
- [ ] My Bookings page displays seat class badges
- [ ] Responsive design works on mobile
- [ ] Error handling for invalid class selection
- [ ] Price updates when switching classes

## Dependencies

**Requires**:
- Plan 1: Database Schema Changes (completed)
- Plan 2: Backend Service Layer Changes (completed)

**Blocks**:
- None (final implementation step)

## Estimated Effort

- TypeScript types update: 20 minutes
- SeatClassSelector component: 1 hour
- FlightCard updates: 45 minutes
- BookingModal updates: 1.5 hours
- BookingCard updates: 30 minutes
- Testing and refinement: 1 hour
- **Total**: ~5 hours

## Rollout Strategy

1. Update TypeScript types first
2. Create SeatClassSelector component
3. Update FlightCard to show class availability
4. Update BookingModal with class selection
5. Update BookingCard to display class info
6. Test complete booking flow
7. Verify responsive design
8. Deploy to production

## Future Enhancements

- Class upgrade options during booking
- Price comparison chart
- Seat map visualization
- Class-specific amenities list
- Loyalty program integration
- Dynamic pricing based on demand