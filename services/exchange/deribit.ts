import { createWsClient } from './createWsClient';
import { ExchangeAdapter, OrderBookSnapshot } from './types';

export class DeribitAdapter implements ExchangeAdapter {
  #close?: () => void;

  connect(symbol: string, onData: (ob: OrderBookSnapshot) => void) {
    const channel = `book.${symbol.toUpperCase()}.25`;
    const subMsg = {
      jsonrpc: '2.0',
      id: 42,
      method: 'public/subscribe',
      params: { channels: [channel] },
    };

    this.#close = createWsClient(
      'wss://www.deribit.com/ws/api/v2',
      subMsg,
      (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.method !== 'subscription') return;

        const book = msg.params?.data;
        if (!book) return;

        onData({
          bids: book.bids.slice(0, 15).map(([p, s]: any[]) => ({ price: p, size: s })),
          asks: book.asks.slice(0, 15).map(([p, s]: any[]) => ({ price: p, size: s })),
          ts: book.timestamp,
        });
      },
    );
  }

  disconnect() { this.#close?.(); }
}
