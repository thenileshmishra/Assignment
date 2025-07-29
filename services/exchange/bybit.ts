import { createWsClient } from './createWsClient';
import { ExchangeAdapter, OrderBookSnapshot } from './types';

export class BybitAdapter implements ExchangeAdapter {
  #close?: () => void;
  #pollingInterval?: NodeJS.Timeout;
  #useRestApi = false;

  connect(symbol: string, onData: (ob: OrderBookSnapshot) => void) {
    // Use the most common symbol format for Bybit
    const pair = symbol.replace('-', '').toUpperCase();   // BTCUSDT
    
    console.log(`Bybit: Connecting with symbol: ${pair}`);
    
    const subMsg = { 
      op: 'subscribe', 
      args: [`orderbook.50.${pair}`] 
    };

    console.log('Bybit: Subscription message:', subMsg);

    const buffer: Record<number, [number, number]> = {};

    // Try WebSocket first
    this.#close = createWsClient(
      'wss://stream.bybit.com/v5/public/linear',
      subMsg,
      (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          console.log('Bybit: Received message:', msg);
          
          // Handle subscription confirmation
          if (msg.op === 'subscribe' && msg.success === true) {
            console.log('Bybit subscription confirmed');
            return;
          }
          
          // Handle connection success
          if (msg.success === true) {
            console.log('Bybit connection successful');
            return;
          }
          
          if (msg.type !== 'snapshot' && msg.type !== 'delta') {
            console.log('Bybit: Ignoring message type:', msg.type);
            return;
          }

          console.log('Bybit: Processing orderbook data');

          const updateLevels = (levels: any[]) => {
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
            if (msg.data?.b) updateLevels(msg.data.b);
            if (msg.data?.a) updateLevels(msg.data.a);
          } else {
            // Update with delta data
            if (msg.data?.b) updateLevels(msg.data.b);
            if (msg.data?.a) updateLevels(msg.data.a);
          }

          // Separate bids and asks based on price
          const allPrices = Object.keys(buffer).map(p => +p).sort((a, b) => a - b);
          const midPrice = allPrices.length > 0 ? allPrices[Math.floor(allPrices.length / 2)] : 0;
          
          const bids: [number, number][] = [];
          const asks: [number, number][] = [];

          Object.values(buffer).forEach(([price, size]) => {
            if (size > 0) {
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

          console.log('Bybit: Sending orderbook data:', { bids: sortedBids.length, asks: sortedAsks.length });
          onData({ bids: sortedBids, asks: sortedAsks, ts: Date.now() });
        } catch (error) {
          console.error('Bybit WebSocket error:', error);
        }
      },
      (error) => {
        console.error(`Bybit WebSocket connection failed, falling back to REST API:`, error);
        this.#useRestApi = true;
        this.startRestApiPolling(symbol, onData);
      }
    );
  }

  private async startRestApiPolling(symbol: string, onData: (ob: OrderBookSnapshot) => void) {
    const pair = symbol.replace('-', '').toUpperCase();
    
    const fetchOrderbook = async () => {
      try {
        const response = await fetch(`https://api.bybit.com/v5/market/orderbook?category=linear&symbol=${pair}&limit=50`);
        const data = await response.json();
        
        if (data.retCode === 0 && data.result) {
          const { b, a } = data.result;
          
          const bids = b.slice(0, 15).map(([price, size]: any[]) => ({ 
            price: parseFloat(price), 
            size: parseFloat(size) 
          }));
          
          const asks = a.slice(0, 15).map(([price, size]: any[]) => ({ 
            price: parseFloat(price), 
            size: parseFloat(size) 
          }));

          onData({ bids, asks, ts: Date.now() });
        }
      } catch (error) {
        console.error('Bybit REST API error:', error);
      }
    };

    // Initial fetch
    await fetchOrderbook();
    
    // Poll every 2 seconds
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
