export function createWsClient(
  url: string,
  subscribeMsg: any,
  onMessage: (ev: MessageEvent) => void,
  onError?: (err: Event) => void,      
) {
  let ws: WebSocket;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 3; // Reduced from 5 to 3
  const reconnectDelay = 2000; // Increased from 1000 to 2000ms

  const connect = () => {
    try {
      console.log(`Attempting WebSocket connection to: ${url}`);
      ws = new WebSocket(url);

      ws.addEventListener('open', () => {
        console.log(`WebSocket connected to ${url}`);
        reconnectAttempts = 0;
        console.log('Sending subscription message:', subscribeMsg);
        ws.send(JSON.stringify(subscribeMsg));
      });

      ws.addEventListener('message', (event) => {
        console.log(`WebSocket message received from ${url}:`, event.data);
        onMessage(event);
      });

      ws.addEventListener('error', (e) => {
        console.error(`WebSocket error for ${url}:`, e);
        console.error('Error details:', {
          type: e.type,
          target: e.target,
          isTrusted: e.isTrusted,
          timeStamp: e.timeStamp
        });
        // Don't call onError for connection errors, let the close handler handle reconnection
      });

      ws.addEventListener('close', (e) => {
        console.log(`WebSocket closed for ${url}:`, {
          code: e.code,
          reason: e.reason,
          wasClean: e.wasClean,
          type: e.type
        });
        
        // Only attempt to reconnect for unexpected closures
        if (e.code !== 1000 && e.code !== 1001 && reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`);
          
          setTimeout(() => {
            connect();
          }, reconnectDelay * reconnectAttempts);
        } else if (onError && reconnectAttempts >= maxReconnectAttempts) {
          // Call onError only after all reconnection attempts fail
          console.error(`All reconnection attempts failed for ${url}`);
          onError(new Event('error'));
        }
      });

    } catch (error) {
      console.error(`Failed to create WebSocket connection to ${url}:`, error);
      if (onError) onError(new Event('error'));
    }
  };

  connect();

  return () => {
    if (ws) {
      console.log(`Closing WebSocket connection to ${url}`);
      ws.close(1000, 'normal-close');
    }
  };
}
