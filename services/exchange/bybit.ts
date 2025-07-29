import { createWsClient } from './createWsClient';
import { ExchangeAdapter, OrderBookSnapshot } from './types';

export class BybitAdapter implements ExchangeAdapter {
  #close?: () => void;

  connect(symbol: string, onData: (ob: OrderBookSnapshot) => void) {
    // Bybit uses format like BTCUSDT for linear perpetual
    const pair = symbol.replace('-', '').toUpperCase();   // BTCUSDT
    const subMsg = { op: 'subscribe', args: [`orderbook.50.${pair}`] };

    const buffer: Record<number, [number, number]> = {};

    this.#close = createWsClient(
      'wss://stream.bybit.com/v5/public/linear',
      subMsg,
      (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type !== 'snapshot' && msg.type !== 'delta') return;

          const updateLevels = (side: 'b' | 'a', levels: any[]) => {
            levels.forEach((l: any) => {
              const price = +l[0];
              const size = +l[1];
              if (size === 0) delete buffer[price];
              else buffer[price] = [price, size];
            });
          };

          if (msg.type === 'snapshot') {
            // Clear buffer and populate with snapshot data
            Object.keys(buffer).forEach(key => delete buffer[+key]);
            msg.data.b.forEach((l: any) => buffer[+l[0]] = [+l[0], +l[1]]);
            msg.data.a.forEach((l: any) => buffer[+l[0]] = [+l[0], +l[1]]);
          } else {
            // Update with delta data
            updateLevels('b', msg.data.b || []);
            updateLevels('a', msg.data.a || []);
          }

          // Separate bids and asks
          const bids: [number, number][] = [];
          const asks: [number, number][] = [];

          Object.values(buffer).forEach(([price, size]) => {
            if (size > 0) {
              // Determine if it's a bid or ask based on price relative to mid-price
              const allPrices = Object.keys(buffer).map(p => +p).sort((a, b) => a - b);
              const midPrice = allPrices[Math.floor(allPrices.length / 2)];
              
              if (price <= midPrice) {
                bids.push([price, size]);
              } else {
                asks.push([price, size]);
              }
            }
          });

          // Sort and limit to 15 levels each
          const sortedBids = bids
            .sort(([p1], [p2]) => p2 - p1)
            .slice(0, 15)
            .map(([price, size]) => ({ price, size }));

          const sortedAsks = asks
            .sort(([p1], [p2]) => p1 - p2)
            .slice(0, 15)
            .map(([price, size]) => ({ price, size }));

          onData({ bids: sortedBids, asks: sortedAsks, ts: Date.now() });
        } catch (error) {
          console.error('Bybit WebSocket error:', error);
        }
      },
    );
  }

  disconnect() { 
    this.#close?.(); 
  }
}
