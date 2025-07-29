'use client';

import { useMemo, useState, useEffect } from 'react';
import { OrderBookSnapshot } from '@/services/exchange/types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface MarketDepthProps {
  orderbook: OrderBookSnapshot;
  maxLevels?: number;
}

function useIsClient() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  return isClient;
}

export default function MarketDepth({ orderbook, maxLevels = 15 }: MarketDepthProps) {
  const isClient = useIsClient();

  const depthData = useMemo(() => {
    if (!orderbook) return null;
    const asks = orderbook.asks.slice(0, maxLevels).map((level, index) => {
      const cumulativeVolume = orderbook.asks.slice(0, index + 1).reduce((sum, l) => sum + l.size, 0);
      return { price: level.price, cumulativeVolume };
    });
    const bids = orderbook.bids.slice(0, maxLevels).map((level, index) => {
      const cumulativeVolume = orderbook.bids.slice(0, index + 1).reduce((sum, l) => sum + l.size, 0);
      return { price: level.price, cumulativeVolume };
    });
    return { asks, bids };
  }, [orderbook, maxLevels]);

  if (!depthData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Market Depth</h3>
        <div className="text-center text-gray-500">Loading depth data...</div>
      </div>
    );
  }

  const { asks, bids } = depthData;

  const chartData = useMemo(() => {
    if (!asks.length && !bids.length) return null;
    const askPrices = asks.map(a => a.price);
    const askVolumes = asks.map(a => a.cumulativeVolume);
    const bidPrices = bids.map(b => b.price);
    const bidVolumes = bids.map(b => b.cumulativeVolume);
    return {
      labels: [...bidPrices.reverse(), ...askPrices],
      datasets: [
        {
          label: 'Bids',
          data: [...bidVolumes.reverse(), ...Array(askVolumes.length).fill(null)],
          borderColor: 'rgb(34,197,94)',
          backgroundColor: 'rgba(34,197,94,0.2)',
          stepped: true,
          pointRadius: 0,
          borderWidth: 2,
          fill: true,
        },
        {
          label: 'Asks',
          data: [...Array(bidVolumes.length).fill(null), ...askVolumes],
          borderColor: 'rgb(239,68,68)',
          backgroundColor: 'rgba(239,68,68,0.2)',
          stepped: true,
          pointRadius: 0,
          borderWidth: 2,
          fill: true,
        },
      ],
    };
  }, [asks, bids]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: { color: '#374151' },
      },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      x: {
        title: { display: true, text: 'Price', color: '#6B7280' },
        ticks: { color: '#6B7280' },
        grid: { color: '#E5E7EB' },
      },
      y: {
        title: { display: true, text: 'Cumulative Volume', color: '#6B7280' },
        ticks: { color: '#6B7280' },
        grid: { color: '#E5E7EB' },
      },
    },
    elements: { line: { tension: 0 } },
  }), []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Market Depth</h3>
      {isClient && chartData ? (
        <div className="w-full flex justify-center">
          <div className="w-full max-w-xl">
            <div className="text-center text-xs mb-1 font-semibold">Area Chart</div>
            <Line data={chartData} options={chartOptions} height={220} />
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500">Loading chart...</div>
      )}
    </div>
  );
} 