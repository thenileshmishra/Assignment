export function createWsClient(
  url: string,
  subscribeMsg: any,
  onMessage: (ev: MessageEvent) => void,
  onError?: (err: any) => void,
) {
  const ws = new WebSocket(url);

  ws.addEventListener('open', () => ws.send(JSON.stringify(subscribeMsg)));
  ws.addEventListener('message', onMessage);
  ws.addEventListener('error', onError ?? console.error);

  return () => {
    ws.close(1000, 'normal‑close');
  };
}
