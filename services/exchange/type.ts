export type Side = 'bid' | 'ask';

export interface Level {
  price: number;
  size: number;
}

export interface OrderBookSnapshot {
  bids: Level[];        // sorted DESC by price
  asks: Level[];        // sorted ASC
  ts: number;           // epoch‑ms
}

export interface ExchangeAdapter {
  connect(symbol: string, onData: (ob: OrderBookSnapshot) => void): void;
  disconnect(): void;
}
