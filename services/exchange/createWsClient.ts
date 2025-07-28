export function createWsClient(
  url: string,
  subscribeMsg: any,
  onMessage: (ev: MessageEvent) => void,
  onError?: (err: Event) => void,      
) {
  const ws = new WebSocket(url);

  ws.addEventListener('open', () => ws.send(JSON.stringify(subscribeMsg)));
  ws.addEventListener('message', onMessage);

  ws.addEventListener('error', (e) => {
    if (onError) onError(e);
    
  });

  return () => ws.close(1000, 'normal-close');
}
