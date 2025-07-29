import { createWsClient } from './createWsClient';
import { ExchangeAdapter, OrderBookSnapshot } from './types';

export class DeribitAdapter implements ExchangeAdapter {
  #close?: () => void;

  connect(symbol: string, onData: (ob: OrderBookSnapshot) => void) {
    // Deribit uses format like BTC-PERPETUAL for perpetual futures
    // Convert BTC-USDT to BTC-PERPETUAL format
    const baseSymbol = symbol.split('-')[0]; // Get BTC from BTC-USDT
    const deribitSymbol = `${baseSymbol}-PERPETUAL`;
    
    const subMsg = {
      jsonrpc: '2.0',
      id: 42,
      method: 'public/subscribe',
      params: { 
        channels: [`book.${deribitSymbol}.25`] 
      },
    };

    this.#close = createWsClient(
      'wss://www.deribit.com/ws/api/v2',
      subMsg,
      (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          
          // Handle subscription confirmation
          if (msg.id === 42) {
            console.log('Deribit subscription confirmed');
            return;
          }
          
          if (msg.method !== 'subscription') return;

          const book = msg.params?.data;
          if (!book || !book.bids || !book.asks) return;

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
    );
  }

  disconnect() { 
    this.#close?.(); 
  }
}
