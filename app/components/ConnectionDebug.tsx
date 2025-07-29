'use client';

import { useOrderbookStore } from '@/store/orderbook';

export default function ConnectionDebug() {
  const { venue, symbol, connectionStatus, error, data } = useOrderbookStore();

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
      <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">Connection Debug</h4>
      <div className="text-xs space-y-1">
        <div>Venue: {venue}</div>
        <div>Symbol: {symbol}</div>
        <div>Status: {connectionStatus}</div>
        {error && <div className="text-red-600">Error: {error}</div>}
        {data && (
          <div>
            <div>Bids: {data.bids.length} levels</div>
            <div>Asks: {data.asks.length} levels</div>
            <div>Last Update: {new Date(data.ts).toLocaleTimeString()}</div>
          </div>
        )}
      </div>
    </div>
  );
} 