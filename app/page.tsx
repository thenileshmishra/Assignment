import OrderbookViewer from './components/OrderbookViewer';
import VenueSwitcher from './components/VenueSwitcher';
import MarketDepth from './components/MarketDepth';
import ClientOnly from './components/ClientOnly';

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

        {/* Real-time components wrapped in ClientOnly */}
        <ClientOnly
          fallback={
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading orderbook data...</p>
            </div>
          }
        >
          {/* Venue Switcher */}
          <VenueSwitcher />

          {/* Main Content */}
          <OrderbookViewer />
        </ClientOnly>
      </div>
    </div>
  );
}
