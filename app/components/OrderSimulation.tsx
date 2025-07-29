'use client';

import { useState } from 'react';
import { OrderBookSnapshot } from '@/services/exchange/types';
import clsx from 'clsx';

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
  orderbook: OrderBookSnapshot;
  onRemove: () => void;
  impact: OrderImpact | null;
}

export default function OrderSimulation({ order, orderbook, onRemove, impact }: OrderSimulationProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getOrderPosition = () => {
    if (!order.price) return null; // Market orders don't have a specific position

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
    <div className={clsx(
      'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4',
      impact && impact.fillPercentage < 100 ? 'border-yellow-400' : ''
    )}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">
            {order.side} {order.qty} {order.symbol} ({order.orderType})
          </div>
          {order.orderType === 'LIMIT' && (
            <div className="text-xs text-gray-500">Limit Price: {order.price}</div>
          )}
        </div>
        <button
          className="text-xs text-red-500 hover:underline"
          onClick={onRemove}
        >
          Remove
        </button>
      </div>

      {/* Slippage Warning */}
      {impact && impact.slippage > 0.5 && (
        <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 rounded text-yellow-800 dark:text-yellow-200 text-xs font-semibold">
          Warning: High slippage ({impact.slippage.toFixed(2)}%)
        </div>
      )}

      {/* Time to Fill Estimate */}
      {impact && (
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          Time to Fill: <span className="font-semibold">
            {impact.fillPercentage === 100 ? 'Immediate' : impact.totalFilled > 0 ? 'Partial Fill' : 'Unfilled'}
          </span>
        </div>
      )}

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
      {!isMarketOrder && position !== null && (
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