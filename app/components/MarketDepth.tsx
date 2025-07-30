'use client';

import { useEffect, useRef } from 'react';
import { OrderBookSnapshot } from '@/services/exchange/types';

interface MarketDepthProps {
  orderbook: OrderBookSnapshot;
  maxLevels?: number;
}

export default function MarketDepth({ orderbook, maxLevels = 15 }: MarketDepthProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !orderbook) return;
    let chart: any;

    (async () => {
      const { createChart } = await import('lightweight-charts');

      chart = createChart(containerRef.current, {
        width: 600,
        height: 300,
        layout: { backgroundColor: '#fff', textColor: '#333' },
        timeScale: { visible: false },
        priceScale: { position: 'right' },
      });

      // --- series styling (area = filled line) ---
      const bidSeries = chart.addAreaSeries({
        lineColor:   'rgba(34,197,94,1)',
        topColor:    'rgba(34,197,94,0.4)',
        bottomColor: 'rgba(34,197,94,0.0)',
        lineWidth: 2,
      });
      const askSeries = chart.addAreaSeries({
        lineColor:   'rgba(239,68,68,1)',
        topColor:    'rgba(239,68,68,0.4)',
        bottomColor: 'rgba(239,68,68,0.0)',
        lineWidth: 2,
      });

      // --- build cumulative depth arrays ---
      const bids = orderbook.bids.slice(0, maxLevels).map((lvl, i) => ({
        price: lvl.price,
        cumulative: orderbook.bids.slice(0, i + 1).reduce((s, l) => s + l.size, 0),
      }));
      const asks = orderbook.asks.slice(0, maxLevels).map((lvl, i) => ({
        price: lvl.price,
        cumulative: orderbook.asks.slice(0, i + 1).reduce((s, l) => s + l.size, 0),
      }));

      // lightweight‑charts’ X axis must be strictly increasing.
      // Use an integer index for X (time) and show price via tooltip if needed.
      bidSeries.setData(bids.map((p, idx) => ({ time: idx,   value: p.cumulative })));
      askSeries.setData(asks.map((p, idx) => ({ time: bids.length + idx, value: p.cumulative })));
    })();

    return () => chart?.remove();
  }, [orderbook, maxLevels]);

  return <div ref={containerRef} style={{ width: 600, height: 300 }} />;
}
