import { createWsClient } from './createWsClient';
import { ExchangeAdapter, OrderBookSnapshot } from './types';

export class OkxAdapter implements ExchangeAdapter {
  #close?: () => void;

  connect(symbol: string, onData: (ob: OrderBookSnapshot) => void) {
    const instId = symbol.toUpperCase();          // e.g. BTC‑USDT
    const subMsg = {
      op: 'subscribe',
      args: [{ channel: 'books5', instId }],
    };

    this.#close = createWsClient(
      'wss://ws.okx.com:8443/ws/v5/public',
      subMsg,
      (evt) => {
        const { data } = JSON.parse(evt.data);
        if (!data?.length) return;

        const [snap] = data;                      // books5 gives full snapshot
        onData({
          bids: snap.bids.map(([p, s]: string[]) => ({ price: +p, size: +s })),
          asks: snap.asks.map(([p, s]: string[]) => ({ price: +p, size: +s })),
          ts: +snap.ts,
        });
      },
    );
  }

  disconnect() {
    this.#close?.();
  }
}
