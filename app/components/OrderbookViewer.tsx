'use client';

import { useEffect, useState } from 'react';
import { useOrderbookStore } from '@/store/orderbook';
import SimulationForm from './SimulationForm';
import OrderSimulation from './OrderSimulation';
import MarketDepth from './MarketDepth';
import OrderBookImbalance from './OrderBookImbalance';

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
  const { data, venue, symbol, initialize, isInitialized } = useOrderbookStore();
  const [simulatedOrders, setSimulatedOrders] = useState<SimulatedOrder[]>([]);

  // Initialize the store on component mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  const addSimulatedOrder = (orderData: Omit<SimulatedOrder, 'id' | 'timestamp'>) => {
    const newOrder: SimulatedOrder = {
      ...orderData,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    setSimulatedOrders(prev => [...prev, newOrder]);
  };

  const removeSimulatedOrder = (id: string) => {
    setSimulatedOrders(prev => prev.filter(order => order.id !== id));
  };

  const calculateOrderImpact = (order: SimulatedOrder, orderbook: any) => {
    if (!orderbook || !orderbook.bids || !orderbook.asks) return null;

    const { side, qty, price } = order;
    const levels = side === 'BUY' ? orderbook.asks : orderbook.bids;
    
    let remainingQty = qty;
    let totalCost = 0;
    let filledQty = 0;

    for (const level of levels) {
      if (remainingQty <= 0) break;
      
      const fillQty = Math.min(remainingQty, level.size);
      totalCost += fillQty * level.price;
      filledQty += fillQty;
      remainingQty -= fillQty;
    }

    if (filledQty === 0) return null;

    const avgPrice = totalCost / filledQty;
    const fillPercentage = (filledQty / qty) * 100;
    const slippage = side === 'BUY' 
      ? ((avgPrice - levels[0]?.price) / levels[0]?.price) * 100
      : ((levels[0]?.price - avgPrice) / levels[0]?.price) * 100;

    return {
      fillPercentage,
      avgPrice,
      slippage,
      totalFilled: filledQty, // Changed from filledQty to totalFilled to match interface
      remainingQty
    };
  };

  // Don't render until initialized
  if (!isInitialized) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Initializing orderbook...</p>
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
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {venue} - {symbol} Orderbook
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Real-time orderbook data with 15 levels
              </p>
            </div>
            
            <div className="grid grid-cols-2">
              {/* Asks (Sell Side) */}
              <div>
                <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-red-600 dark:text-red-400">Asks (Sell)</h3>
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
                      {data?.asks?.slice(0, 15).map((level, index) => {
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
                <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-green-600 dark:text-green-400">Bids (Buy)</h3>
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
                      {data?.bids?.slice(0, 15).map((level, index) => {
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
