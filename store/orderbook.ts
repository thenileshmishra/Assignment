'use client';                              // makes the file usable in client comps

import { create } from 'zustand';
import { OkxAdapter } from '@/services/exchange/okx';
import { BybitAdapter } from '@/services/exchange/bybit';
import { DeribitAdapter } from '@/services/exchange/deribit';
import type { OrderBookSnapshot } from '@/services/exchange/types';

type Venue = 'OKX' | 'BYBIT' | 'DERIBIT';

interface State {
  venue: Venue;
  symbol: string;
  data: OrderBookSnapshot | null;
  connect: () => void;
  disconnect: () => void;
  setVenue: (v: Venue) => void;
  setSymbol: (s: string) => void;
}

// singletons – create once, reuse
const adapters = {
  OKX: new OkxAdapter(),
  BYBIT: new BybitAdapter(),
  DERIBIT: new DeribitAdapter(),
};

export const useOrderbookStore = create<State>((set, get) => ({
  venue: 'OKX',
  symbol: 'BTC-USDT',
  data: null,

  connect() {
    const { venue, symbol } = get();
    adapters[venue].connect(symbol, (ob) => set({ data: ob }));
  },

  disconnect() {
    const { venue } = get();
    adapters[venue].disconnect();
  },

  setVenue(v) {
    get().disconnect();
    set({ venue: v }, false);   // shallow
    get().connect();
  },

  setSymbol(s) {
    get().disconnect();
    set({ symbol: s }, false);
    get().connect();
  },
}));
