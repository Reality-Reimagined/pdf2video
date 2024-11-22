import React from 'react';
import { useAuthStore } from '../../lib/store';
import { Check, Crown } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: 0,
    features: ['5 videos per month', 'Basic quality', 'Community support'],
  },
  {
    name: 'Pro',
    price: 29,
    features: [
      'Unlimited videos',
      'HD quality',
      'Priority support',
      'Custom branding',
      'API access',
    ],
  },
  {
    name: 'Enterprise',
    price: 99,
    features: [
      'Everything in Pro',
      '4K quality',
      'Dedicated support',
      'Custom integrations',
      'Team collaboration',
    ],
  },
];

export const SubscriptionManager = () => {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Current Plan</h3>
            <p className="text-sm text-gray-500 mt-1">
              Your subscription renews on{' '}
              {new Date(user.subscription.validUntil).toLocaleDateString()}
            </p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {user.subscription.plan.charAt(0).toUpperCase() +
              user.subscription.plan.slice(1)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`bg-white rounded-lg shadow-md p-6 border-2 ${
              user.subscription.plan.toLowerCase() === plan.name.toLowerCase()
                ? 'border-blue-500'
                : 'border-transparent'
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
              {plan.name !== 'Free' && <Crown className="w-5 h-5 text-blue-500" />}
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-6">
              ${plan.price}
              <span className="text-sm font-normal text-gray-500">/month</span>
            </p>
            <ul className="space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              disabled={user.subscription.plan.toLowerCase() === plan.name.toLowerCase()}
              className="mt-6 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {user.subscription.plan.toLowerCase() === plan.name.toLowerCase()
                ? 'Current Plan'
                : 'Upgrade'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};