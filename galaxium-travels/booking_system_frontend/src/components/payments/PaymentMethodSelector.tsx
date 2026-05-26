import { CreditCard, Smartphone, Building2, Wallet, Banknote } from 'lucide-react';
import type { PaymentOption, PaymentMethod } from '../../types';
import { Card } from '../common';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
  totalAmount: number;
}

/**
 * Payment method selector component that displays available payment options.
 * Shows payment methods with icons, descriptions, and any applicable surcharges.
 *
 * @param selectedMethod - Currently selected payment method
 * @param onSelectMethod - Callback when a payment method is selected
 * @param totalAmount - Base amount before surcharges
 */
export const PaymentMethodSelector = ({
  selectedMethod,
  onSelectMethod,
  totalAmount
}: PaymentMethodSelectorProps) => {
  const paymentOptions: PaymentOption[] = [
    {
      id: 'credit_card',
      name: 'Credit Card',
      icon: '💳',
      description: 'Visa, Mastercard, Amex'
    },
    {
      id: 'debit_card',
      name: 'Debit Card',
      icon: '💳',
      description: 'All major banks'
    },
    {
      id: 'upi',
      name: 'UPI',
      icon: '📱',
      description: 'Google Pay, PhonePe, Paytm'
    },
    {
      id: 'emi',
      name: 'EMI',
      icon: '💰',
      description: 'Easy monthly installments'
    },
    {
      id: 'net_banking',
      name: 'Net Banking',
      icon: '🏦',
      description: 'All major banks'
    },
    {
      id: 'cash_on_delivery',
      name: 'Cash on Delivery',
      icon: '💵',
      description: 'Pay at the spaceport',
      surcharge: 50 // 50% surcharge
    }
  ];

  const calculateFinalAmount = (option: PaymentOption) => {
    if (option.surcharge) {
      return totalAmount * (1 + option.surcharge / 100);
    }
    return totalAmount;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-star-white">Select Payment Method</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {paymentOptions.map((option) => {
          const isSelected = selectedMethod === option.id;
          const finalAmount = calculateFinalAmount(option);
          const hasSurcharge = option.surcharge && option.surcharge > 0;

          return (
            <Card
              key={option.id}
              className={`cursor-pointer transition-all hover:scale-105 ${
                isSelected
                  ? 'ring-2 ring-cosmic-purple bg-cosmic-purple/20'
                  : 'hover:bg-white/10'
              }`}
              onClick={() => onSelectMethod(option.id)}
            >
              <div className="relative p-4">
                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-cosmic-purple flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                )}

                <div className="space-y-2">
                  {/* Icon and Name */}
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{option.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-star-white">{option.name}</h4>
                      <p className="text-xs text-star-white/70">{option.description}</p>
                    </div>
                  </div>

                  {/* Surcharge Warning */}
                  {hasSurcharge && (
                    <div className="mt-2 p-2 rounded bg-yellow-500/20 border border-yellow-500/30">
                      <p className="text-xs text-yellow-200 font-medium">
                        +{option.surcharge}% surcharge: {formatCurrency(finalAmount)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// Made with Bob