'use client';

import { useEffect, useState } from 'react';
import { useOrderbookStore } from '@/store/orderbook';
import SimulationForm from './SimulationForm';
import OrderSimulation from './OrderSimulation';
import MarketDepth from './MarketDepth';
import OrderBookImbalance from './OrderBookImbalance';
import { Level } from '@/services/exchange/types';

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
  const [selectedVenue, setSelectedVenue] = useState(venue);

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

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
              <div className="space-y-2">
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
                      {data.asks.slice(0, 15).map((level, index) => {
                        const total = data.asks
                          .slice(0, index + 1)
                          .reduce((sum, l) => sum + l.size, 0);
                        
                        return (
                          <tr key={`ask-${level.price}`} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 orderbook-row">
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
                      {data.bids.slice(0, 15).map((level, index) => {
                        const total = data.bids
                          .slice(0, index + 1)
                          .reduce((sum, l) => sum + l.size, 0);
                        
                        return (
                          <tr key={`bid-${level.price}`} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 orderbook-row">
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
