'use client';

import { useOrderbookStore } from '@/store/orderbook';

export default function VenueSwitcher() {
  const { venue, setVenue } = useOrderbookStore();

  const venues = [
    { id: 'OKX', name: 'OKX', color: 'bg-blue-500' },
    { id: 'BYBIT', name: 'Bybit', color: 'bg-green-500' },
    { id: 'DERIBIT', name: 'Deribit', color: 'bg-purple-500' },
  ] as const;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4">Select Venue</h3>
      <div className="grid grid-cols-3 gap-3">
        {venues.map(({ id, name, color }) => (
          <button
            key={id}
            onClick={() => setVenue(id)}
            className={`p-3 rounded-lg border-2 transition-all duration-200 ${
              venue === id
                ? `${color} text-white border-transparent`
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${color}`} />
              <span className="font-medium">{name}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
} 