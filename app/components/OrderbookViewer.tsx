'use client';

import { useEffect, useState, useRef } from 'react';
import { useOrderbookStore } from '@/store/orderbook';
import SimulationForm from './SimulationForm';
import OrderSimulation from './OrderSimulation';
import MarketDepth from './MarketDepth';
import OrderBookImbalance from './OrderBookImbalance';
import { Level } from '@/services/exchange/types';
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

export default function OrderbookViewer() {
  const { data, venue, symbol, connect, disconnect } = useOrderbookStore();
  const [simulatedOrders, setSimulatedOrders] = useState<SimulatedOrder[]>([]);
  const prevBids = useRef<Level[]>([]);
  const prevAsks = useRef<Level[]>([]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [venue, symbol, connect, disconnect]);

  const addSimulatedOrder = (order: Omit<SimulatedOrder, 'id' | 'timestamp'>) => {
    const newOrder: SimulatedOrder = {
      ...order,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    setSimulatedOrders(prev => [...prev, newOrder]);
  };

  const removeSimulatedOrder = (id: string) => {
    setSimulatedOrders(prev => prev.filter(order => order.id !== id));
  };

  const calculateOrderImpact = (order: SimulatedOrder, orderbook: any) => {
    if (!orderbook) return null;

    const { side, price, qty } = order;
    let totalFilled = 0;
    let totalCost = 0;
    let remainingQty = qty;

    if (side === 'BUY') {
      // For buy orders, we look at asks (selling side)
      for (const level of orderbook.asks) {
        if (price && level.price > price) break; // Limit order price check
        
        const fillQty = Math.min(remainingQty, level.size);
        totalFilled += fillQty;
        totalCost += fillQty * level.price;
        remainingQty -= fillQty;
        
        if (remainingQty <= 0) break;
      }
    } else {
      // For sell orders, we look at bids (buying side)
      for (const level of orderbook.bids) {
        if (price && level.price < price) break; // Limit order price check
        
        const fillQty = Math.min(remainingQty, level.size);
        totalFilled += fillQty;
        totalCost += fillQty * level.price;
        remainingQty -= fillQty;
        
        if (remainingQty <= 0) break;
      }
    }

    const fillPercentage = (totalFilled / qty) * 100;
    const avgPrice = totalFilled > 0 ? totalCost / totalFilled : 0;
    const slippage = price ? Math.abs(avgPrice - price) / price * 100 : 0;

    return {
      fillPercentage,
      avgPrice,
      slippage,
      totalFilled,
      remainingQty,
    };
  };

  // Find the price levels for simulated orders
  const simulatedOrderPrices = simulatedOrders.map(o => o.price).filter(Boolean);

  // Always keep 15 levels, fill with previous data if needed
  const getStableLevels = (levels: Level[], prev: React.MutableRefObject<Level[]>) => {
    let stable = levels.slice(0, 15);
    if (stable.length < 15) {
      // Fill with previous data (skip duplicates by price)
      const prevToAdd = prev.current.filter(
        l => !stable.some(s => s.price === l.price)
      ).slice(0, 15 - stable.length);
      stable = [...stable, ...prevToAdd];
    }
    // Update previous
    prev.current = stable;
    return stable;
  };

  //  If data is not loaded from the API, show a loading spinner
  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stableAsks = getStableLevels(data.asks, prevAsks);
  const stableBids = getStableLevels(data.bids, prevBids);


  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Simulation Form */}
        <div className="lg:col-span-1">
          <SimulationForm onSimulateOrder={addSimulatedOrder} />
          
          {/* Simulated Orders List */}
          {simulatedOrders.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Simulated Orders</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {simulatedOrders.map(order => (
                  <OrderSimulation
                    key={order.id}
                    order={order}
                    orderbook={data}
                    onRemove={() => removeSimulatedOrder(order.id)}
                    impact={calculateOrderImpact(order, data)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Orderbook Display */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {venue} - {symbol}
                </h2>
                <div className="text-sm text-gray-500">
                  Last Update: {new Date(data.ts).toLocaleTimeString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2">
              {/* Asks (Sell Side) */}
              <div>
                <div className="bg-red-50 dark:bg-red-900/20 px-4 py-2 border-b">
                  <h3 className="text-red-600 font-semibold">Asks</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm orderbook-table">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left w-1/3 table-cell">Price</th>
                        <th className="px-4 py-2 text-right w-1/3 table-cell">Size</th>
                        <th className="px-4 py-2 text-right w-1/3 table-cell">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stableAsks.map((level, index) => {
                        const total = stableAsks.slice(0, index + 1).reduce((sum, l) => sum + l.size, 0);
                        const isSimOrder = simulatedOrderPrices.includes(level.price);
                        return (
                          <tr key={`ask-${level.price}`} className={clsx(
                            'border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 orderbook-row',
                            isSimOrder ? 'bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-400' : ''
                          )}>
                            <td className="px-4 py-2 text-red-600 font-mono text-sm orderbook-cell number-display">
                              {level.price.toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-right font-mono text-sm orderbook-cell number-display">
                              {level.size.toFixed(4)}
                            </td>
                            <td className="px-4 py-2 text-right text-gray-500 font-mono text-sm orderbook-cell number-display">
                              {total.toFixed(4)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bids (Buy Side) */}
              <div>
                <div className="bg-green-50 dark:bg-green-900/20 px-4 py-2 border-b">
                  <h3 className="text-green-600 font-semibold">Bids</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm orderbook-table">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left w-1/3 table-cell">Price</th>
                        <th className="px-4 py-2 text-right w-1/3 table-cell">Size</th>
                        <th className="px-4 py-2 text-right w-1/3 table-cell">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stableBids.map((level, index) => {
                        const total = stableBids.slice(0, index + 1).reduce((sum, l) => sum + l.size, 0);
                        const isSimOrder = simulatedOrderPrices.includes(level.price);
                        return (
                          <tr key={`bid-${level.price}`} className={clsx(
                            'border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 orderbook-row',
                            isSimOrder ? 'bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-400' : ''
                          )}>
                            <td className="px-4 py-2 text-green-600 font-mono text-sm orderbook-cell number-display">
                              {level.price.toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-right font-mono text-sm orderbook-cell number-display">
                              {level.size.toFixed(4)}
                            </td>
                            <td className="px-4 py-2 text-right text-gray-500 font-mono text-sm orderbook-cell number-display">
                              {total.toFixed(4)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Market Depth Visualization */}
      <div className="mt-6">
        <MarketDepth orderbook={data} />
      </div>

      {/* Order Book Imbalance */}
      <div className="mt-6">
        <OrderBookImbalance orderbook={data} />
      </div>
    </div>
  );
}
