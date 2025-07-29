import { createWsClient } from './createWsClient';
import { ExchangeAdapter, OrderBookSnapshot } from './types';

export class DeribitAdapter implements ExchangeAdapter {
  #close?: () => void;
  #pollingInterval?: NodeJS.Timeout;
  #useRestApi = false;

  connect(symbol: string, onData: (ob: OrderBookSnapshot) => void) {
    // Deribit uses format like BTC-PERPETUAL for perpetual futures
    // Convert BTC-USDT to BTC-PERPETUAL format
    const baseSymbol = symbol.split('-')[0]; // Get BTC from BTC-USDT
    const deribitSymbol = `${baseSymbol}-PERPETUAL`;
    
    console.log(`Deribit: Connecting with symbol: ${deribitSymbol}`);
    
    const subMsg = {
      jsonrpc: '2.0',
      id: 42,
      method: 'public/subscribe',
      params: { 
        channels: [`book.${deribitSymbol}.25`] 
      },
    };

    console.log('Deribit: Subscription message:', subMsg);

    // Try WebSocket first
    this.#close = createWsClient(
      'wss://www.deribit.com/ws/api/v2',
      subMsg,
      (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          console.log('Deribit: Received message:', msg);
          
          // Handle subscription confirmation
          if (msg.id === 42) {
            console.log('Deribit subscription confirmed');
            return;
          }
          
          if (msg.method !== 'subscription') {
            console.log('Deribit: Ignoring message method:', msg.method);
            return;
          }

          const book = msg.params?.data;
          if (!book || !book.bids || !book.asks) {
            console.log('Deribit: Invalid book data');
            return;
          }

          console.log('Deribit: Processing orderbook data');

          onData({
            bids: book.bids.slice(0, 15).map(([p, s]: any[]) => ({ 
              price: typeof p === 'string' ? parseFloat(p) : p, 
              size: typeof s === 'string' ? parseFloat(s) : s 
            })),
            asks: book.asks.slice(0, 15).map(([p, s]: any[]) => ({ 
              price: typeof p === 'string' ? parseFloat(p) : p, 
              size: typeof s === 'string' ? parseFloat(s) : s 
            })),
            ts: book.timestamp || Date.now(),
          });
        } catch (error) {
          console.error('Deribit WebSocket error:', error);
        }
      },
      (error) => {
        console.error(`Deribit WebSocket connection failed, falling back to REST API:`, error);
        this.#useRestApi = true;
        this.startRestApiPolling(deribitSymbol, onData);
      }
    );
  }

  private async startRestApiPolling(symbol: string, onData: (ob: OrderBookSnapshot) => void) {
    console.log(`Deribit: Starting REST API polling for ${symbol}`);
    
    const fetchOrderbook = async () => {
      try {
        console.log(`Deribit: Fetching orderbook from REST API for ${symbol}`);
        const response = await fetch(`/api/exchange?exchange=deribit&symbol=${encodeURIComponent(symbol)}`);
        const data = await response.json();
        
        console.log(`Deribit: REST API response:`, data);
        
        if (data.result) {
          const { bids, asks } = data.result;
          
          const formattedBids = bids.slice(0, 15).map(([price, size]: any[]) => ({ 
            price: parseFloat(price), 
            size: parseFloat(size) 
          }));
          
          const formattedAsks = asks.slice(0, 15).map(([price, size]: any[]) => ({ 
            price: parseFloat(price), 
            size: parseFloat(size) 
          }));

          console.log(`Deribit: REST API sending orderbook data:`, { bids: formattedBids.length, asks: formattedAsks.length });
          onData({ bids: formattedBids, asks: formattedAsks, ts: Date.now() });
        } else {
          console.error(`Deribit: REST API error - no result in response`);
        }
      } catch (error) {
        console.error('Deribit REST API error:', error);
      }
    };

    // Initial fetch
    console.log(`Deribit: Performing initial REST API fetch`);
    await fetchOrderbook();
    
    // Poll every 2 seconds
    console.log(`Deribit: Starting REST API polling interval`);
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
