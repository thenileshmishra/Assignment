'use client';

import { useMemo } from 'react';
import { OrderBookSnapshot } from '@/services/exchange/types';

interface MarketDepthProps {
  orderbook: OrderBookSnapshot;
  maxLevels?: number;
}

export default function MarketDepth({ orderbook, maxLevels = 15 }: MarketDepthProps) {
  const depthData = useMemo(() => {
    if (!orderbook) return null;

    // Calculate cumulative volumes
    const asks = orderbook.asks.slice(0, maxLevels).map((level, index) => {
      const cumulativeVolume = orderbook.asks
        .slice(0, index + 1)
        .reduce((sum, l) => sum + l.size, 0);
      return {
        price: level.price,
        size: level.size,
        cumulativeVolume,
        side: 'ask' as const,
      };
    });

    const bids = orderbook.bids.slice(0, maxLevels).map((level, index) => {
      const cumulativeVolume = orderbook.bids
        .slice(0, index + 1)
        .reduce((sum, l) => sum + l.size, 0);
      return {
        price: level.price,
        size: level.size,
        cumulativeVolume,
        side: 'bid' as const,
      };
    });

    // Find the range for scaling
    const maxVolume = Math.max(
      ...asks.map(a => a.cumulativeVolume),
      ...bids.map(b => b.cumulativeVolume)
    );

    return { asks, bids, maxVolume };
  }, [orderbook, maxLevels]);

  if (!depthData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Market Depth</h3>
        <div className="text-center text-gray-500">Loading depth data...</div>
      </div>
    );
  }

  const { asks, bids, maxVolume } = depthData;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Market Depth</h3>
      
      <div className="space-y-4">
        {/* Asks Depth */}
        <div>
          <h4 className="text-sm font-medium text-red-600 mb-2">Asks (Sell Side)</h4>
          <div className="space-y-1">
            {asks.map((level, index) => {
              const widthPercentage = (level.cumulativeVolume / maxVolume) * 100;
              return (
                <div key={`ask-${index}`} className="flex items-center space-x-2">
                  <div className="w-16 text-xs font-mono text-red-600">
                    {level.price.toFixed(2)}
                  </div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative">
                    <div
                      className="bg-red-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${widthPercentage}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-2 text-xs text-white font-medium">
                      <span>{level.size.toFixed(4)}</span>
                      <span>{level.cumulativeVolume.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bids Depth */}
        <div>
          <h4 className="text-sm font-medium text-green-600 mb-2">Bids (Buy Side)</h4>
          <div className="space-y-1">
            {bids.map((level, index) => {
              const widthPercentage = (level.cumulativeVolume / maxVolume) * 100;
              return (
                <div key={`bid-${index}`} className="flex items-center space-x-2">
                  <div className="w-16 text-xs font-mono text-green-600">
                    {level.price.toFixed(2)}
                  </div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative">
                    <div
                      className="bg-green-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${widthPercentage}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-2 text-xs text-white font-medium">
                      <span>{level.size.toFixed(4)}</span>
                      <span>{level.cumulativeVolume.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Spread Information */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Best Ask:</span>
              <span className="ml-2 font-mono text-red-600">
                {asks[0]?.price.toFixed(2) || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Best Bid:</span>
              <span className="ml-2 font-mono text-green-600">
                {bids[0]?.price.toFixed(2) || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Spread:</span>
              <span className="ml-2 font-mono">
                {asks[0] && bids[0] 
                  ? (asks[0].price - bids[0].price).toFixed(2)
                  : 'N/A'
                }
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Spread %:</span>
              <span className="ml-2 font-mono">
                {asks[0] && bids[0] 
                  ? (((asks[0].price - bids[0].price) / bids[0].price) * 100).toFixed(3) + '%'
                  : 'N/A'
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 