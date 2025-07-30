'use client';

import { useOrderbookStore } from '@/store/orderbook';

export default function VenueSwitcher() {
  const { venue, connectionStatus, error, connectionType, setVenue } = useOrderbookStore();

  const venues = [
    { id: 'OKX', name: 'OKX', color: 'bg-blue-500' },
    { id: 'BYBIT', name: 'Bybit', color: 'bg-green-500' },
    { id: 'DERIBIT', name: 'Deribit', color: 'bg-purple-500' },
  ] as const;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'fallback': return 'bg-yellow-500';
      case 'connecting': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string, connectionType: string | null) => {
    switch (status) {
      case 'connected': return connectionType === 'websocket' ? 'WebSocket' : 'REST API';
      case 'fallback': return 'REST API (Fallback)';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Error';
      default: return 'Disconnected';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Select Venue</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(connectionStatus)}`} />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {getStatusText(connectionStatus, connectionType)}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* {connectionStatus === 'fallback' && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <p className="text-yellow-600 dark:text-yellow-400 text-sm">
             WebSocket connection failed. Using REST API fallback for real-time data.
          </p>
        </div>
      )} */}

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