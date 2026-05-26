import type { Flight } from '../../types';
import { Card, Button } from '../common';
import { Plane, Clock, DollarSign, Users } from 'lucide-react';
import { formatCurrency, formatDate, formatTime, calculateDuration } from '../../utils/formatters';
import { motion } from 'framer-motion';

interface FlightCardProps {
  flight: Flight;
  onBook: (flight: Flight) => void;
}

/**
 * Flight card component that displays flight information including route, schedule, pricing, and seat availability.
 * Shows the lowest available price across all seat classes and availability for each class.
 *
 * @param flight - Flight object containing all flight details
 * @param onBook - Callback function triggered when user clicks "Book Now"
 */
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
  
  const isLowSeats = totalSeats <= 5;
  const isSoldOut = totalSeats === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full flex flex-col">
        {/* Route Header */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cosmic-gradient">
              <Plane className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-star-white">
                {flight.origin} → {flight.destination}
              </h3>
              <p className="text-sm text-star-white/60">
                Flight #{flight.flight_id}
              </p>
            </div>
          </div>
        </div>

        {/* Flight Details */}
        <div className="space-y-3 mb-6 flex-1">
          {/* Departure & Arrival */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-star-white/60 mb-1">Departure</p>
              <p className="text-sm font-medium text-star-white">
                {formatDate(flight.departure_time, 'MMM dd, yyyy')}
              </p>
              <p className="text-lg font-bold text-cosmic-purple">
                {formatTime(flight.departure_time)}
              </p>
            </div>
            <div>
              <p className="text-xs text-star-white/60 mb-1">Arrival</p>
              <p className="text-sm font-medium text-star-white">
                {formatDate(flight.arrival_time, 'MMM dd, yyyy')}
              </p>
              <p className="text-lg font-bold text-cosmic-purple">
                {formatTime(flight.arrival_time)}
              </p>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2 text-star-white/70">
            <Clock size={16} />
            <span className="text-sm">
              Duration: {calculateDuration(flight.departure_time, flight.arrival_time)}
            </span>
          </div>

          {/* Price - Show "From" lowest price */}
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-alien-green" />
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-star-white/60">From</span>
              <span className="text-2xl font-bold text-star-white">
                {formatCurrency(fromPrice)}
              </span>
            </div>
          </div>

          {/* Seat Class Availability Summary */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Users size={16} className={isLowSeats ? 'text-solar-orange' : 'text-star-white/70'} />
              <span className={`text-sm ${isLowSeats ? 'text-solar-orange font-semibold' : 'text-star-white/70'}`}>
                {isSoldOut ? 'Sold Out' : `${totalSeats} seats available`}
              </span>
            </div>
            <div className="flex gap-3 text-xs ml-6">
              <span className={flight.economy_seats_available > 0 ? 'text-alien-green' : 'text-star-white/40'}>
                🪑 Economy: {flight.economy_seats_available}
              </span>
              <span className={flight.business_seats_available > 0 ? 'text-alien-green' : 'text-star-white/40'}>
                💼 Business: {flight.business_seats_available}
              </span>
              <span className={flight.galaxium_seats_available > 0 ? 'text-alien-green' : 'text-star-white/40'}>
                ⭐ Galaxium: {flight.galaxium_seats_available}
              </span>
            </div>
          </div>
        </div>

        {/* Book Button */}
        <Button
          onClick={() => onBook(flight)}
          disabled={isSoldOut}
          className="w-full"
        >
          {isSoldOut ? 'Sold Out' : 'Book Now'}
        </Button>
      </Card>
    </motion.div>
  );
};

// Made with Bob
