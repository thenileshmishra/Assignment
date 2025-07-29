'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useOrderbookStore } from '@/store/orderbook';

const schema = z.object({
  symbol:     z.string().min(3, 'Required').toUpperCase(),
  orderType:  z.enum(['MARKET', 'LIMIT']),
  side:       z.enum(['BUY', 'SELL']),
  price:      z.number().positive().optional(),        // only for LIMIT
  qty:        z.number().positive('Qty > 0'),
  delay:      z.enum(['0', '5', '10', '30']),          // seconds
}).refine(d => d.orderType === 'MARKET' || d.price !== undefined, {
  message: 'Price required for limit order',
  path: ['price'],
});

type FormData = z.infer<typeof schema>;

interface SimulationFormProps {
  onSimulateOrder: (order: Omit<FormData, 'delay'> & { venue: string }) => void;
}

export default function SimulationForm({ onSimulateOrder }: SimulationFormProps) {
  const { venue, symbol, setSymbol } = useOrderbookStore();
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState<string>('');

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        symbol,
        orderType: 'MARKET',
        side: 'BUY',
        qty: 1,
        delay: '0',
      },
    });

  /* sync symbol changes back to global store */
  useEffect(() => {
    const sub = watch(({ symbol }) => {
      if (symbol) setSymbol(symbol);
    });
    return () => sub.unsubscribe();
  }, [watch, setSymbol]);

  const onSubmit = async (data: FormData) => {
    setIsSimulating(true);
    setSimulationStatus(`Preparing to simulate ${data.delay === '0' ? 'immediate' : `${data.delay}s delayed`} order...`);

    const delayMs = Number(data.delay) * 1000;
    
    setTimeout(() => {
      setSimulationStatus('Executing order simulation...');
      
      // Simulate the order with current venue
      const { delay, ...orderData } = data;
      onSimulateOrder({ ...orderData, venue });
      
      setSimulationStatus('Order simulation completed!');
      setIsSimulating(false);
      
      // Reset form after successful simulation
      setTimeout(() => {
        setSimulationStatus('');
        reset();
      }, 2000);
    }, delayMs);
  };

  const isLimit = watch('orderType') === 'LIMIT';

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Order Simulation</h3>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Symbol Selection */}
        <div>
          <label className="block text-sm font-medium mb-1">Symbol</label>
          <select
            {...register('symbol')}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
          >
            <option value="BTC-USDT">BTC-USDT</option>
            <option value="ETH-USDT">ETH-USDT</option>
            <option value="SOL-USDT">SOL-USDT</option>
            <option value="ADA-USDT">ADA-USDT</option>
            <option value="DOT-USDT">DOT-USDT</option>
          </select>
        </div>

        {/* Order Type and Side */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Order Type</label>
            <select 
              {...register('orderType')} 
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="MARKET">Market</option>
              <option value="LIMIT">Limit</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Side</label>
            <select 
              {...register('side')} 
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="BUY">Buy</option>
              <option value="SELL">Sell</option>
            </select>
          </div>
        </div>

        {/* Price and Quantity */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Price</label>
            <input
              type="number"
              step="0.01"
              {...register('price', { valueAsNumber: true })}
              disabled={!isLimit}
              placeholder="Price"
              className={`w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                !isLimit && 'opacity-50 cursor-not-allowed'
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Quantity</label>
            <input
              type="number"
              step="0.0001"
              {...register('qty', { valueAsNumber: true })}
              placeholder="Qty"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Timing Simulation */}
        <div>
          <label className="block text-sm font-medium mb-2">Timing Simulation</label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: '0', label: 'Immediate' },
              { value: '5', label: '5s Delay' },
              { value: '10', label: '10s Delay' },
              { value: '30', label: '30s Delay' }
            ].map(({ value, label }) => (
              <label key={value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value={value}
                  {...register('delay')}
                  defaultChecked={value === '0'}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Current Venue Display */}
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Current Venue: <span className="font-semibold text-gray-900 dark:text-white">{venue}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Switch venue using the selector above
          </div>
        </div>

        {/* Validation errors */}
        {Object.values(errors).length > 0 && (
          <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
            {Object.values(errors)[0]?.message?.toString()}
          </div>
        )}

        {/* Simulation Status */}
        {simulationStatus && (
          <div className="text-blue-600 text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
            {simulationStatus}
          </div>
        )}

        <button
          type="submit"
          disabled={isSimulating}
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
            isSimulating
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isSimulating ? 'Simulating...' : 'Simulate Order'}
        </button>
      </form>
    </div>
  );
}
