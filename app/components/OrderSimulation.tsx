'use client';

import { useState } from 'react';
import { OrderBookSnapshot } from '@/services/exchange/types';

interface SimulatedOrder {
  id: string;
  venue: string;
  symbol: string;
  orderType: 'MARKET' | 'LIMIT';
  side: 'BUY' | 'SELL';
  price?: number;
  qty: number;
  timestamp: number;
}

interface OrderImpact {
  fillPercentage: number;
  avgPrice: number;
  slippage: number;
  totalFilled: number;
  remainingQty: number;
}

interface OrderSimulationProps {
  order: SimulatedOrder;
  orderbook: OrderBookSnapshot | null;
  onRemove: () => void;
  impact: OrderImpact | null;
}

export default function OrderSimulation({ order, orderbook, onRemove, impact }: OrderSimulationProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getOrderPosition = () => {
    if (!order.price || !orderbook) return null; // Market orders don't have a specific position

    const { side, price } = order;
    
    if (side === 'BUY') {
      // For buy orders, find position in asks
      const askIndex = orderbook.asks.findIndex(level => level.price >= price);
      return askIndex >= 0 ? askIndex : orderbook.asks.length;
    } else {
      // For sell orders, find position in bids
      const bidIndex = orderbook.bids.findIndex(level => level.price <= price);
      return bidIndex >= 0 ? bidIndex : orderbook.bids.length;
    }
  };

  const position = getOrderPosition();
  const isMarketOrder = order.orderType === 'MARKET';

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-3">
      {/* Order Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            order.side === 'BUY' ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="font-semibold text-sm">
            {order.side} {order.qty} {order.symbol}
          </span>
          <span className={`text-xs px-2 py-1 rounded ${
            order.orderType === 'MARKET' 
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
          }`}>
            {order.orderType}
          </span>
        </div>
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500 text-sm"
        >
          ×
        </button>
      </div>

      {/* Order Details */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Venue:</span>
          <span>{order.venue}</span>
        </div>
        {order.price && (
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Price:</span>
            <span className="font-mono">{order.price.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
          <span className="font-mono">{order.qty.toFixed(4)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Time:</span>
          <span>{new Date(order.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Impact Metrics */}
      {impact && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Fill %:</span>
              <span className={`ml-1 font-semibold ${
                impact.fillPercentage > 80 ? 'text-green-600' : 
                impact.fillPercentage > 50 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {impact.fillPercentage.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Avg Price:</span>
              <span className="ml-1 font-mono">{impact.avgPrice.toFixed(2)}</span>
            </div>
            {order.price && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Slippage:</span>
                <span className={`ml-1 font-semibold ${
                  impact.slippage < 0.1 ? 'text-green-600' : 
                  impact.slippage < 0.5 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {impact.slippage.toFixed(2)}%
                </span>
              </div>
            )}
            <div>
              <span className="text-gray-600 dark:text-gray-400">Filled:</span>
              <span className="ml-1 font-mono">{impact.totalFilled.toFixed(4)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Order Position Visualization */}
      {!isMarketOrder && position !== null && orderbook && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {isExpanded ? 'Hide' : 'Show'} Order Position
          </button>
          
          {isExpanded && (
            <div className="mt-2 text-xs">
              <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                <div className="text-gray-600 dark:text-gray-400 mb-1">
                  Your order would be at position {position + 1} in the {order.side === 'BUY' ? 'ask' : 'bid'} queue
                </div>
                <div className="space-y-1">
                  {order.side === 'BUY' ? (
                    orderbook.asks.slice(0, Math.min(position + 3, orderbook.asks.length)).map((level, idx) => (
                      <div key={idx} className={`flex justify-between ${
                        idx === position ? 'bg-blue-100 dark:bg-blue-900 border-l-2 border-blue-500 px-1' : ''
                      }`}>
                        <span className={idx === position ? 'font-semibold' : ''}>
                          {level.price.toFixed(2)}
                        </span>
                        <span>{level.size.toFixed(4)}</span>
                      </div>
                    ))
                  ) : (
                    orderbook.bids.slice(0, Math.min(position + 3, orderbook.bids.length)).map((level, idx) => (
                      <div key={idx} className={`flex justify-between ${
                        idx === position ? 'bg-blue-100 dark:bg-blue-900 border-l-2 border-blue-500 px-1' : ''
                      }`}>
                        <span className={idx === position ? 'font-semibold' : ''}>
                          {level.price.toFixed(2)}
                        </span>
                        <span>{level.size.toFixed(4)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 