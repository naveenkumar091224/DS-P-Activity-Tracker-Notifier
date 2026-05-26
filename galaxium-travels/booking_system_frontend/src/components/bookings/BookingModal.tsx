import { useState } from 'react';
import type { Flight, SeatClass, PaymentMethod } from '../../types';
import { Modal, Button } from '../common';
import { Plane, Calendar, Clock, DollarSign } from 'lucide-react';
import { formatCurrency, formatDate, calculateDuration } from '../../utils/formatters';
import { bookFlight, isErrorResponse } from '../../services/api';
import { useUser } from '../../hooks/useUser';
import { SeatClassSelector } from '../flights/SeatClassSelector';
import { PaymentMethodSelector } from '../payments/PaymentMethodSelector';
import toast from 'react-hot-toast';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  flight: Flight | null;
  onSuccess: () => void;
}

/**
 * Booking modal component that handles flight booking with seat class selection.
 * Displays flight details, allows seat class selection, and processes the booking.
 *
 * @param isOpen - Controls modal visibility
 * @param onClose - Callback to close the modal
 * @param flight - Flight object to book, or null if no flight selected
 * @param onSuccess - Callback triggered after successful booking
 */
export const BookingModal = ({ isOpen, onClose, flight, onSuccess }: BookingModalProps) => {
  const { user } = useUser();
  const [selectedClass, setSelectedClass] = useState<'economy' | 'business' | 'galaxium'>('economy');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('upi');
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

  /**
   * Handles the booking confirmation process.
   * Validates user authentication, seat availability, and submits the booking request.
   */
  const handleConfirmBooking = async () => {
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
        seat_class: selectedClass,
        payment_method: selectedPayment
      });

      if (isErrorResponse(result)) {
        toast.error(result.details || result.error);
        return;
      }

      toast.success(`${selectedClassInfo.displayName} class booked successfully!`);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.details || error.error || 'Failed to book flight');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Book Your Flight"
      size="lg"
    >
      <div className="space-y-6">
        {/* Flight Summary */}
        <div className="glass-card p-4 bg-white/5">
          <div className="flex items-center gap-3 mb-4">
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

          <div className="grid grid-cols-2 gap-4">
            {/* Departure */}
            <div className="flex items-start gap-3">
              <Calendar className="text-cosmic-purple mt-1" size={20} />
              <div>
                <p className="text-xs text-star-white/60">Departure</p>
                <p className="text-star-white font-medium">
                  {formatDate(flight.departure_time)}
                </p>
              </div>
            </div>

            {/* Arrival */}
            <div className="flex items-start gap-3">
              <Calendar className="text-cosmic-purple mt-1" size={20} />
              <div>
                <p className="text-xs text-star-white/60">Arrival</p>
                <p className="text-star-white font-medium">
                  {formatDate(flight.arrival_time)}
                </p>
              </div>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-start gap-3 mt-3">
            <Clock className="text-cosmic-purple mt-1" size={20} />
            <div>
              <p className="text-xs text-star-white/60">Duration</p>
              <p className="text-star-white font-medium">
                {calculateDuration(flight.departure_time, flight.arrival_time)}
              </p>
            </div>
          </div>
        </div>

        {/* Seat Class Selection */}
        <SeatClassSelector
          classes={seatClasses}
          selectedClass={selectedClass}
          onSelectClass={setSelectedClass}
        />

        {/* Payment Method Selection */}
        <PaymentMethodSelector
          selectedMethod={selectedPayment}
          onSelectMethod={setSelectedPayment}
          totalAmount={selectedClassInfo?.price || 0}
        />

        {/* Passenger Info */}
        {user && (
          <div className="glass-card p-4 bg-white/5">
            <h4 className="text-sm font-semibold text-star-white mb-2">
              Passenger Information
            </h4>
            <p className="text-star-white">{user.name}</p>
            <p className="text-star-white/60 text-sm">{user.email}</p>
          </div>
        )}

        {/* Booking Summary */}
        {selectedClassInfo && (
          <div className="glass-card p-4 bg-cosmic-gradient">
            <div className="space-y-2">
              <div className="flex justify-between text-white">
                <span>Class:</span>
                <span className="font-bold">{selectedClassInfo.displayName} {selectedClassInfo.icon}</span>
              </div>
              <div className="flex justify-between text-white">
                <span>Base Price:</span>
                <span className="font-bold">{formatCurrency(selectedClassInfo.price)}</span>
              </div>
              {selectedPayment === 'cash_on_delivery' && (
                <>
                  <div className="flex justify-between text-yellow-200 text-sm">
                    <span>COD Surcharge (50%):</span>
                    <span className="font-bold">+{formatCurrency(selectedClassInfo.price * 0.5)}</span>
                  </div>
                  <div className="border-t border-white/20 pt-2"></div>
                </>
              )}
              <div className="flex justify-between text-white">
                <span className="text-lg">Total Amount:</span>
                <span className="text-2xl font-bold">
                  {formatCurrency(
                    selectedPayment === 'cash_on_delivery'
                      ? selectedClassInfo.price * 1.5
                      : selectedClassInfo.price
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmBooking}
            isLoading={isLoading}
            disabled={!selectedClassInfo || selectedClassInfo.seatsAvailable === 0}
            className="flex-1"
          >
            Confirm Booking
          </Button>
        </div>

        <p className="text-xs text-star-white/60 text-center">
          By confirming, you agree to our terms and conditions
        </p>
      </div>
    </Modal>
  );
};

// Made with Bob
