'use client';

import { useEffect } from 'react';
import { useOrderbookStore } from '@/store/orderbook';

export default function OrderbookViewer() {
  const { data, connect, disconnect } = useOrderbookStore();

  useEffect(() => {
    connect();               // mount
    return () => disconnect(); // un‑mount
  }, [connect, disconnect]);

  if (!data) return <p>Loading…</p>;

  return (
    <table className="w-full text-sm">
      <thead><tr><th>Price</th><th>Size</th></tr></thead>
      <tbody>
        {data.asks.map((l) => (
          <tr key={`a-${l.price}`} className="text-red-500">
            <td>{l.price}</td><td>{l.size}</td>
          </tr>
        ))}
        {data.bids.map((l) => (
          <tr key={`b-${l.price}`} className="text-green-500">
            <td>{l.price}</td><td>{l.size}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
