import OrderbookViewer from './components/OrderbookViewer';
import VenueSwitcher from './components/VenueSwitcher';
import MarketDepth from './components/MarketDepth';
import { useOrderbookStore } from '@/store/orderbook';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Real-Time Orderbook Viewer
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Multi-venue orderbook visualization with order simulation capabilities
          </p>
        </div>

        {/* Venue Switcher */}
        <VenueSwitcher />

        {/* Main Content */}
        <OrderbookViewer />
      </div>
    </div>
  );
}
