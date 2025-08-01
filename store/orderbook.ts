'use client';                              // makes the file usable in client comps

import { create } from 'zustand';
import { OkxAdapter } from '@/services/exchange/okx';
import { BybitAdapter } from '@/services/exchange/bybit';
import { DeribitAdapter } from '@/services/exchange/deribit';
import type { OrderBookSnapshot } from '@/services/exchange/types';

type Venue = 'OKX' | 'BYBIT' | 'DERIBIT';
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'fallback';

interface State {
  venue: Venue;
  symbol: string;
  data: OrderBookSnapshot | null;
  connectionStatus: ConnectionStatus;
  error: string | null;
  connectionType: 'websocket' | 'rest' | null;
  connect: () => void;
  disconnect: () => void;
  setVenue: (v: Venue) => void;
  setSymbol: (s: string) => void;
}

// singletons – create once, reuse
const adapters = {
  OKX: new OkxAdapter(),
  BYBIT: new BybitAdapter(),
  DERIBIT: new DeribitAdapter(),
};

// Default symbols for each venue
const defaultSymbols = {
  OKX: 'BTC-USDT', // Will be converted to BTCUSDT
  BYBIT: 'BTC-USDT', // Will be converted to BTCUSDT
  DERIBIT: 'BTC-USDT', // Will be converted to BTC-PERPETUAL
};

// Debounce function to limit update frequency
let updateTimeout: NodeJS.Timeout | null = null;
const DEBOUNCE_DELAY = 100; // 100ms debounce

export const useOrderbookStore = create<State>((set, get) => ({
  venue: 'OKX',
  symbol: 'BTC-USDT',
  data: null,
  connectionStatus: 'disconnected',
  error: null,
  connectionType: null,

  connect() {
    const { venue, symbol } = get();
    set({ connectionStatus: 'connecting', error: null, connectionType: null });
    
    try {
      adapters[venue].connect(symbol, (ob) => {
        // Debounce updates to prevent excessive re-renders
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }
        
        updateTimeout = setTimeout(() => {
          const currentStatus = get().connectionStatus;
          const newStatus = currentStatus === 'connecting' ? 'connected' : 'fallback';
          const connectionType = currentStatus === 'connecting' ? 'websocket' : 'rest';
          
          set({ 
            data: ob, 
            connectionStatus: newStatus, 
            error: null,
            connectionType 
          });
        }, DEBOUNCE_DELAY);
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      set({ 
        connectionStatus: 'error', 
        error: `${venue} connection error: ${errorMessage}`,
        connectionType: null
      });
    }
  },

  disconnect() {
    const { venue } = get();
    adapters[venue].disconnect();
    if (updateTimeout) {
      clearTimeout(updateTimeout);
      updateTimeout = null;
    }
    set({ connectionStatus: 'disconnected', error: null, connectionType: null });
  },

  setVenue(v) {
    get().disconnect();
    set({ venue: v, symbol: defaultSymbols[v] }, false);   // Update symbol for new venue
    get().connect();
  },

  setSymbol(s) {
    get().disconnect();
    set({ symbol: s }, false);
    get().connect();
  },
}));
