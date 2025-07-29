export function createWsClient(
  url: string,
  subscribeMsg: any,
  onMessage: (ev: MessageEvent) => void,
  onError?: (err: Event) => void,      
) {
  let ws: WebSocket;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000;

  const connect = () => {
    try {
      ws = new WebSocket(url);

      ws.addEventListener('open', () => {
        console.log(`WebSocket connected to ${url}`);
        reconnectAttempts = 0;
        ws.send(JSON.stringify(subscribeMsg));
      });

      ws.addEventListener('message', onMessage);

      ws.addEventListener('error', (e) => {
        console.error(`WebSocket error for ${url}:`, e);
        if (onError) onError(e);
      });

      ws.addEventListener('close', (e) => {
        console.log(`WebSocket closed for ${url}:`, e.code, e.reason);
        
        // Attempt to reconnect if not a normal closure
        if (e.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`);
          
          setTimeout(() => {
            connect();
          }, reconnectDelay * reconnectAttempts);
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
      ws.close(1000, 'normal-close');
    }
  };
}
