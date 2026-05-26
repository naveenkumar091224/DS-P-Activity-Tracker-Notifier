import type { Booking, Flight } from '../../types';
import { Card, Button } from '../common';
import { Plane, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { motion } from 'framer-motion';

interface BookingCardProps {
  booking: Booking;
  flight?: Flight;
  onCancel: (bookingId: number) => void;
  isCancelling?: boolean;
}

/**
 * Booking card component that displays booking details with seat class information.
 * Shows flight route, schedule, booking status, seat class badge, and cancellation option.
 *
 * @param booking - Booking object with booking details and seat class
 * @param flight - Optional flight object for additional flight information
 * @param onCancel - Callback function to cancel the booking
 * @param isCancelling - Loading state for cancellation process
 */
export const BookingCard = ({ booking, flight, onCancel, isCancelling }: BookingCardProps) => {
  /**
   * Returns the appropriate status icon based on booking status.
   */
  const getStatusIcon = () => {
    switch (booking.status) {
      case 'booked':
        return <CheckCircle className="text-alien-green" size={20} />;
      case 'cancelled':
        return <XCircle className="text-red-500" size={20} />;
      case 'completed':
        return <CheckCircle className="text-blue-500" size={20} />;
      default:
        return <Clock className="text-star-white/50" size={20} />;
    }
  };

  /**
   * Returns the appropriate color class based on booking status.
   */
  const getStatusColor = () => {
    switch (booking.status) {
      case 'booked':
        return 'text-alien-green';
      case 'cancelled':
        return 'text-red-500';
      case 'completed':
        return 'text-blue-500';
      default:
        return 'text-star-white/50';
    }
  };

  const getClassBadge = (seatClass: string) => {
    const badges = {
      economy: { label: 'Economy', color: 'bg-blue-500/20 text-blue-300', icon: '🪑' },
      business: { label: 'Business', color: 'bg-purple-500/20 text-purple-300', icon: '💼' },
      galaxium: { label: 'Galaxium', color: 'bg-yellow-500/20 text-yellow-300', icon: '⭐' }
    };
    
    return badges[seatClass as keyof typeof badges] || badges.economy;
  };

  const canCancel = booking.status === 'booked';
  const classBadge = getClassBadge(booking.seat_class);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card>
        {/* Header */}
        <div className="flex items-start justify-between mb-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cosmic-gradient">
              <Plane className="text-white" size={20} />
            </div>
            <div>
              <p className="text-sm text-star-white/60">Booking #{booking.booking_id}</p>
              <div className="flex items-center gap-2 mt-1">
                {getStatusIcon()}
                <span className={`text-sm font-semibold capitalize ${getStatusColor()}`}>
                  {booking.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Flight Details */}
        {flight ? (
          <div className="space-y-3 mb-4">
            <div>
              <h3 className="text-xl font-bold text-star-white mb-1">
                {flight.origin} → {flight.destination}
              </h3>
              <p className="text-sm text-star-white/60">Flight #{flight.flight_id}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-star-white/60 mb-1">Departure</p>
                <p className="text-sm text-star-white font-medium">
                  {formatDate(flight.departure_time)}
                </p>
              </div>
              <div>
                <p className="text-xs text-star-white/60 mb-1">Arrival</p>
                <p className="text-sm text-star-white font-medium">
                  {formatDate(flight.arrival_time)}
                </p>
              </div>
            </div>

            {/* Seat Class and Price */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${classBadge.color}`}>
                  {classBadge.icon} {classBadge.label}
                </span>
              </div>
              <span className="text-lg font-bold text-star-white">
                {formatCurrency(booking.price_paid)}
              </span>
            </div>
          </div>
        ) : (
          <div className="mb-4 space-y-2">
            <p className="text-sm text-star-white/60">Flight ID: {booking.flight_id}</p>
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${classBadge.color}`}>
                {classBadge.icon} {classBadge.label}
              </span>
              <span className="text-lg font-bold text-star-white">
                {formatCurrency(booking.price_paid)}
              </span>
            </div>
          </div>
        )}

        {/* Booking Time */}
        <div className="flex items-center gap-2 text-sm text-star-white/60 mb-4">
          <Calendar size={16} />
          <span>Booked on {formatDate(booking.booking_time)}</span>
        </div>

        {/* Cancel Button */}
        {canCancel && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => onCancel(booking.booking_id)}
            isLoading={isCancelling}
            className="w-full"
          >
            Cancel Booking
          </Button>
        )}
      </Card>
    </motion.div>
  );
};

// Made with Bob
