'use client';

import { useMemo } from 'react';
import { OrderBookSnapshot } from '@/services/exchange/types';

interface OrderBookImbalanceProps {
  orderbook: OrderBookSnapshot | null;
  levels?: number;
}

export default function OrderBookImbalance({ orderbook, levels = 10 }: OrderBookImbalanceProps) {
  const imbalanceData = useMemo(() => {
    if (!orderbook) return null;

    const topBids = orderbook.bids.slice(0, levels);
    const topAsks = orderbook.asks.slice(0, levels);

    // Calculate total volumes
    const bidVolume = topBids.reduce((sum, level) => sum + level.size, 0);
    const askVolume = topAsks.reduce((sum, level) => sum + level.size, 0);
    const totalVolume = bidVolume + askVolume;

    // Volume imbalance ratio
    const volumeImbalance = totalVolume > 0 ? (bidVolume - askVolume) / totalVolume : 0;

    // Price pressure indicators
    const bidPressure = topBids.reduce((sum, level, index) => {
      return sum + (level.size * (levels - index)); // Weight by position
    }, 0);
    
    const askPressure = topAsks.reduce((sum, level, index) => {
      return sum + (level.size * (index + 1)); // Weight by position
    }, 0);

    const pressureRatio = bidPressure + askPressure > 0 
      ? bidPressure / (bidPressure + askPressure) 
      : 0.5;

    // Spread analysis
    const bestBid = topBids[0]?.price || 0;
    const bestAsk = topAsks[0]?.price || 0;
    const spread = bestAsk - bestBid;
    const spreadPercentage = bestBid > 0 ? (spread / bestBid) * 100 : 0;

    // Depth analysis
    const midPrice = (bestBid + bestAsk) / 2;
    const bidDepth = topBids.filter(level => level.price >= midPrice * 0.99).length;
    const askDepth = topAsks.filter(level => level.price <= midPrice * 1.01).length;

    return {
      volumeImbalance,
      pressureRatio,
      spread,
      spreadPercentage,
      bidDepth,
      askDepth,
      bidVolume,
      askVolume,
      totalVolume,
    };
  }, [orderbook, levels]);

  if (!imbalanceData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Order Book Imbalance</h3>
        <div className="text-center text-gray-500">Loading imbalance data...</div>
      </div>
    );
  }

  const {
    volumeImbalance,
    pressureRatio,
    spread,
    spreadPercentage,
    bidDepth,
    askDepth,
    bidVolume,
    askVolume,
    totalVolume,
  } = imbalanceData;

  const getImbalanceColor = (value: number) => {
    if (value > 0.6) return 'text-green-600';
    if (value < 0.4) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getImbalanceText = (value: number) => {
    if (value > 0.6) return 'Bid Heavy';
    if (value < 0.4) return 'Ask Heavy';
    return 'Balanced';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Order Book Imbalance</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Volume Imbalance */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Volume Imbalance</h4>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Ratio:</span>
              <span className={`font-mono font-semibold w-16 text-right ${getImbalanceColor(volumeImbalance + 0.5)}`}>
                {((volumeImbalance + 0.5) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
              <span className={`text-sm font-medium w-20 text-right ${getImbalanceColor(volumeImbalance + 0.5)}`}>
                {getImbalanceText(volumeImbalance + 0.5)}
              </span>
            </div>
          </div>
        </div>

        {/* Price Pressure */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Price Pressure</h4>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Bid Pressure:</span>
              <span className={`font-mono font-semibold w-16 text-right ${getImbalanceColor(pressureRatio)}`}>
                {(pressureRatio * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
              <span className={`text-sm font-medium w-20 text-right ${getImbalanceColor(pressureRatio)}`}>
                {getImbalanceText(pressureRatio)}
              </span>
            </div>
          </div>
        </div>

        {/* Spread Analysis */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Spread Analysis</h4>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Spread:</span>
              <span className="font-mono w-16 text-right">{spread.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Spread %:</span>
              <span className="font-mono w-16 text-right">{spreadPercentage.toFixed(3)}%</span>
            </div>
          </div>
        </div>

        {/* Depth Analysis */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Market Depth</h4>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Bid Levels:</span>
              <span className="font-mono text-green-600 w-8 text-right">{bidDepth}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Ask Levels:</span>
              <span className="font-mono text-red-600 w-8 text-right">{askDepth}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Volume Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Volume Summary</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-green-600 font-semibold w-20 mx-auto">{bidVolume.toFixed(4)}</div>
            <div className="text-gray-500 text-xs">Bid Volume</div>
          </div>
          <div className="text-center">
            <div className="text-red-600 font-semibold w-20 mx-auto">{askVolume.toFixed(4)}</div>
            <div className="text-gray-500 text-xs">Ask Volume</div>
          </div>
          <div className="text-center">
            <div className="font-semibold w-20 mx-auto">{totalVolume.toFixed(4)}</div>
            <div className="text-gray-500 text-xs">Total Volume</div>
          </div>
        </div>
      </div>
    </div>
  );
} 