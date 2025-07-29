import { createWsClient } from './createWsClient';
import { ExchangeAdapter, OrderBookSnapshot } from './types';

export class OkxAdapter implements ExchangeAdapter {
  #close?: () => void;

  connect(symbol: string, onData: (ob: OrderBookSnapshot) => void) {
    const instId = symbol.toUpperCase();          // e.g. BTC-USDT
    const subMsg = {
      op: 'subscribe',
      args: [{ channel: 'books', instId }],      // Changed from 'books5' to 'books' for more levels
    };

    this.#close = createWsClient(
      'wss://ws.okx.com:8443/ws/v5/public',
      subMsg,
      (evt) => {
        try {
          const { data } = JSON.parse(evt.data);
          if (!data?.length) return;

          const [snap] = data;
          if (!snap?.bids || !snap?.asks) return;

          onData({
            bids: snap.bids.slice(0, 15).map(([p, s]: string[]) => ({ price: +p, size: +s })),
            asks: snap.asks.slice(0, 15).map(([p, s]: string[]) => ({ price: +p, size: +s })),
            ts: +snap.ts,
          });
        } catch (error) {
          console.error('OKX WebSocket error:', error);
        }
      },
    );
  }

  disconnect() {
    this.#close?.();
  }
}
