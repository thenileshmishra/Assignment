export function createWsClient(
  url: string,
  subscribeMsg: any,
  onMessage: (ev: MessageEvent) => void,
  onError?: (err: Event) => void,      
) {
  let ws: WebSocket;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 2; // Reduced to 2 attempts
  const reconnectDelay = 1000; // Reduced to 1 second
  let hasTriggeredFallback = false;
  let connectionTimeout: NodeJS.Timeout;

  const connect = () => {
    try {
      console.log(`Attempting WebSocket connection to: ${url}`);
      ws = new WebSocket(url);

      // Set a connection timeout
      connectionTimeout = setTimeout(() => {
        if (!hasTriggeredFallback && onError) {
          console.log(`WebSocket connection timeout for ${url}, triggering fallback`);
          hasTriggeredFallback = true;
          onError(new Event('error'));
        }
      }, 5000); // 5 second timeout

      ws.addEventListener('open', () => {
        console.log(`WebSocket connected to ${url}`);
        clearTimeout(connectionTimeout);
        reconnectAttempts = 0;
        hasTriggeredFallback = false;
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
        
        clearTimeout(connectionTimeout);
        
        // Trigger fallback immediately on first error
        if (!hasTriggeredFallback && onError) {
          console.log(`Triggering fallback for ${url} due to WebSocket error`);
          hasTriggeredFallback = true;
          onError(new Event('error'));
        }
      });

      ws.addEventListener('close', (e) => {
        console.log(`WebSocket closed for ${url}:`, {
          code: e.code,
          reason: e.reason,
          wasClean: e.wasClean,
          type: e.type
        });
        
        clearTimeout(connectionTimeout);
        
        // Only attempt to reconnect for unexpected closures and if fallback hasn't been triggered
        if (e.code !== 1000 && e.code !== 1001 && reconnectAttempts < maxReconnectAttempts && !hasTriggeredFallback) {
          reconnectAttempts++;
          console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`);
          
          setTimeout(() => {
            connect();
          }, reconnectDelay * reconnectAttempts);
        } else if (onError && !hasTriggeredFallback) {
          // Call onError if we haven't already triggered fallback
          console.error(`WebSocket connection failed for ${url}, triggering fallback`);
          hasTriggeredFallback = true;
          onError(new Event('error'));
        }
      });

    } catch (error) {
      console.error(`Failed to create WebSocket connection to ${url}:`, error);
      clearTimeout(connectionTimeout);
      if (onError && !hasTriggeredFallback) {
        hasTriggeredFallback = true;
        onError(new Event('error'));
      }
    }
  };

  connect();

  return () => {
    clearTimeout(connectionTimeout);
    if (ws) {
      console.log(`Closing WebSocket connection to ${url}`);
      ws.close(1000, 'normal-close');
    }
  };
}
