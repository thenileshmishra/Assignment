'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useOrderbookStore } from '@/store/orderbook';

const schema = z.object({
  venue:      z.enum(['OKX', 'BYBIT', 'DERIBIT']),
  symbol:     z.string().min(3, 'Required').toUpperCase(),
  orderType:  z.enum(['MARKET', 'LIMIT']),
  side:       z.enum(['BUY', 'SELL']),
  price:      z.number().positive().optional(),        // only for LIMIT
  qty:        z.number().positive('Qty > 0'),
  delay:      z.enum(['0', '5', '10', '30']),          // seconds
}).refine(d => d.orderType === 'MARKET' || d.price !== undefined, {
  message: 'Price required for limit order',
  path: ['price'],
});

type FormData = z.infer<typeof schema>;

export default function SimulationForm() {
  const { venue, symbol, setVenue, setSymbol } = useOrderbookStore();

  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        venue,
        symbol,
        orderType: 'MARKET',
        side: 'BUY',
        qty: 1,
        delay: '0',
      },
    });

  /* sync dropdown changes back to global store */
  useEffect(() => {
    const sub = watch(({ venue, symbol }) => {
      if (venue)  setVenue(venue);
      if (symbol) setSymbol(symbol);
    });
    return () => sub.unsubscribe();
  }, [watch, setVenue, setSymbol]);

  const onSubmit = (data: FormData) => {
    // ↓ replace with your simulateOrder() util
    console.log('simulate', data);
    const delayMs = Number(data.delay) * 1000;
    setTimeout(() => {
      // dispatch to simulation slice / overlay marker here
    }, delayMs);
  };

  const isLimit = watch('orderType') === 'LIMIT';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 p-4 border rounded">
      {/* line‑1: venue / symbol */}
      <div className="flex gap-2">
        <select {...register('venue')} className="border p-1 rounded">
          <option value="OKX">OKX</option>
          <option value="BYBIT">Bybit</option>
          <option value="DERIBIT">Deribit</option>
        </select>

        <input
          {...register('symbol')}
          placeholder="BTC-USDT"
          className="border p-1 rounded w-32 uppercase"
        />
      </div>

      {/* line‑2: type / side */}
      <div className="flex gap-2">
        <select {...register('orderType')} className="border p-1 rounded">
          <option value="MARKET">Market</option>
          <option value="LIMIT">Limit</option>
        </select>

        <select {...register('side')} className="border p-1 rounded">
          <option value="BUY">Buy</option>
          <option value="SELL">Sell</option>
        </select>
      </div>

      {/* line‑3: price / qty */}
      <div className="flex gap-2">
        <input
          type="number"
          step="0.01"
          {...register('price', { valueAsNumber: true })}
          disabled={!isLimit}
          placeholder="Price"
          className={`border p-1 rounded w-28 ${!isLimit && 'opacity-40'}`}
        />
        <input
          type="number"
          step="0.0001"
          {...register('qty', { valueAsNumber: true })}
          placeholder="Qty"
          className="border p-1 rounded w-24"
        />
      </div>

      {/* line‑4: timing */}
      <div className="flex gap-2">
        {['0','5','10','30'].map(s => (
          <label key={s} className="flex items-center gap-1">
            <input
              type="radio"
              value={s}
              {...register('delay')}
              defaultChecked={s==='0'}
            />
            {s === '0' ? 'Immediate' : `${s}s`}
          </label>
        ))}
      </div>

      {/* validation errors */}
      {Object.values(errors).length > 0 && (
        <p className="text-red-600 text-xs">
          {Object.values(errors)[0]?.message?.toString()}
        </p>
      )}

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-1 rounded"
      >
        Simulate
      </button>
    </form>
  );
}
