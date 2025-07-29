import OrderbookViewer from './components/OrderbookViewer';

export default function Home() {
  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold mb-4">Real‑Time Orderbook</h1>
      <OrderbookViewer />
    </main>
  );
}
