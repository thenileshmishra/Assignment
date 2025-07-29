import { createWsClient } from './createWsClient';
import { ExchangeAdapter, OrderBookSnapshot } from './types';

export class OkxAdapter implements ExchangeAdapter {
  #close?: () => void;
  #pollingInterval?: NodeJS.Timeout;
  #useRestApi = false;

  connect(symbol: string, onData: (ob: OrderBookSnapshot) => void) {
    const instId = symbol.toUpperCase();          // e.g. BTC-USDT
    const subMsg = {
      op: 'subscribe',
      args: [{ channel: 'books', instId }],      // Changed from 'books5' to 'books' for more levels
    };

    console.log('OKX: Subscription message:', subMsg);

    // Try WebSocket first
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
      (error) => {
        console.error(`OKX WebSocket connection failed, falling back to REST API:`, error);
        this.#useRestApi = true;
        this.startRestApiPolling(instId, onData);
      },
    );
  }

  private async startRestApiPolling(symbol: string, onData: (ob: OrderBookSnapshot) => void) {
    console.log(`OKX: Starting REST API polling for ${symbol}`);
    
    const fetchOrderbook = async () => {
      try {
        console.log(`OKX: Fetching orderbook from REST API for ${symbol}`);
        const response = await fetch(`/api/exchange?exchange=okx&symbol=${encodeURIComponent(symbol)}`);
        const data = await response.json();
        
        console.log(`OKX: REST API response:`, data);
        
        if (data.code === '0' && data.data && data.data[0]) {
          const { bids, asks } = data.data[0];
          
          const formattedBids = bids.slice(0, 15).map(([price, size]: string[]) => ({ 
            price: parseFloat(price), 
            size: parseFloat(size) 
          }));
          
          const formattedAsks = asks.slice(0, 15).map(([price, size]: string[]) => ({ 
            price: parseFloat(price), 
            size: parseFloat(size) 
          }));

          console.log(`OKX: REST API sending orderbook data:`, { bids: formattedBids.length, asks: formattedAsks.length });
          onData({ bids: formattedBids, asks: formattedAsks, ts: Date.now() });
        } else {
          console.error(`OKX: REST API error - code: ${data.code}, message: ${data.msg}`);
        }
      } catch (error) {
        console.error('OKX REST API error:', error);
      }
    };

    // Initial fetch
    console.log(`OKX: Performing initial REST API fetch`);
    await fetchOrderbook();
    
    // Poll every 2 seconds
    console.log(`OKX: Starting REST API polling interval`);
    this.#pollingInterval = setInterval(fetchOrderbook, 2000);
  }

  disconnect() {
    this.#close?.();
    if (this.#pollingInterval) {
      clearInterval(this.#pollingInterval);
      this.#pollingInterval = undefined;
    }
  }
}
