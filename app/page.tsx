import OrderbookViewer from './components/OrderbookViewer';
import VenueSwitcher from './components/VenueSwitcher';


export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Real-Time Orderbook Viewer
          </h1>
        </div>
        <VenueSwitcher />
        <OrderbookViewer />
      </div>
    </div>
  );
}
