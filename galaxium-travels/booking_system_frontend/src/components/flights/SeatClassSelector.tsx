import { Check } from 'lucide-react';
import type { SeatClass } from '../../types';
import { Card } from '../common';

interface SeatClassSelectorProps {
  classes: SeatClass[];
  selectedClass: 'economy' | 'business' | 'galaxium';
  onSelectClass: (className: 'economy' | 'business' | 'galaxium') => void;
}

/**
 * Seat class selector component that displays available seat classes with pricing and availability.
 * Allows users to select between Economy, Business, and Galaxium classes.
 *
 * @param classes - Array of available seat classes with pricing and availability info
 * @param selectedClass - Currently selected seat class
 * @param onSelectClass - Callback function when a seat class is selected
 */
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
                  ${seatClass.price.toLocaleString()}
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

// Made with Bob