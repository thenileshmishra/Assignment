import { createWsClient } from './createWsClient';
import { ExchangeAdapter, OrderBookSnapshot } from './types';

export class BybitAdapter implements ExchangeAdapter {
  #close?: () => void;

  connect(symbol: string, onData: (ob: OrderBookSnapshot) => void) {
    const pair = symbol.replace('-', '').toUpperCase();   // BTCUSDT
    const subMsg = { op: 'subscribe', args: [`orderbook.50.${pair}`] };

    const buffer: Record<number, [number, number]> = {};

    this.#close = createWsClient(
      'wss://stream.bybit.com/v5/public/linear',
      subMsg,
      (evt) => {
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
          msg.data.b.forEach((l: any) => buffer[+l[0]] = [+l[0], +l[1]]);
          msg.data.a.forEach((l: any) => buffer[+l[0]] = [+l[0], +l[1]]);
        } else {
          updateLevels('b', msg.data.b);
          updateLevels('a', msg.data.a);
        }

        const bids = Object.values(buffer)
          .filter(([p]) => p <= +pair) // crude filter, adjust as needed
          .sort(([p1], [p2]) => p2 - p1)
          .slice(0, 15)
          .map(([price, size]) => ({ price, size }));

        const asks = Object.values(buffer)
          .filter(([p]) => p >= +pair)
          .sort(([p1], [p2]) => p1 - p2)
          .slice(0, 15)
          .map(([price, size]) => ({ price, size }));

        onData({ bids, asks, ts: Date.now() });
      },
    );
  }
  disconnect() { this.#close?.(); }
}
