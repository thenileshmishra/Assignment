# Real-Time Orderbook Viewer with Order Simulation

A Next.js application that displays real-time orderbook data from multiple cryptocurrency exchanges with advanced order simulation capabilities.

## Features

### Core Functionality
- **Multi-Venue Orderbook Display**: Real-time orderbooks from OKX, Bybit, and Deribit
- **Order Simulation**: Simulate order placement with timing controls (immediate, 5s, 10s, 30s delay)
- **Order Impact Analysis**: Calculate fill percentage, market impact, slippage, and time to fill
- **Order Position Visualization**: Show where simulated orders would sit in the orderbook
- **Venue Switching**: Seamless switching between different exchanges

### Advanced Features
- **Market Depth Visualization**: Cumulative volume charts for better market analysis
- **Order Book Imbalance Indicators**: Volume imbalance, price pressure, and spread analysis
- **Real-time Updates**: WebSocket connections for live data streaming
- **Responsive Design**: Optimized for desktop and mobile trading scenarios
- **Connection Status**: Real-time connection status and error handling

### Order Simulation Capabilities
- **Market Orders**: Immediate execution simulation
- **Limit Orders**: Price-based order placement
- **Timing Controls**: Simulate different execution delays
- **Impact Metrics**: 
  - Fill percentage calculation
  - Average execution price
  - Slippage estimation
  - Market impact analysis

## Technology Stack

- **Framework**: Next.js 15.4.4 with TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **Form Handling**: React Hook Form with Zod validation
- **WebSocket**: Native WebSocket API
- **Real-time Data**: Direct exchange WebSocket APIs

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/thenileshmishra/Assignment
   cd goquant-orderbook
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
npm start
```

## API Integration

### Supported Exchanges

#### OKX
- **WebSocket URL**: `wss://ws.okx.com:8443/ws/v5/public`
- **Channel**: `books5` (5-level orderbook)
- **Documentation**: [OKX API Docs](https://www.okx.com/docs-v5/)

#### Bybit
- **WebSocket URL**: `wss://stream.bybit.com/v5/public/linear`
- **Channel**: `orderbook.50.{symbol}` (50-level orderbook)
- **Documentation**: [Bybit API Docs](https://bybit-exchange.github.io/docs/v5/intro)

#### Deribit
- **WebSocket URL**: `wss://www.deribit.com/ws/api/v2`
- **Channel**: `book.{symbol}.25` (25-level orderbook)
- **Documentation**: [Deribit API Docs](https://docs.deribit.com/)

### Rate Limiting Considerations

- **OKX**: No rate limits for public WebSocket connections
- **Bybit**: 120 requests per minute for REST API, no limits for WebSocket
- **Deribit**: 20 requests per second for REST API, no limits for WebSocket

## Project Structure

```
├── app/
│   ├── components/
│   │   ├── OrderbookViewer.tsx      # Main orderbook display
│   │   ├── SimulationForm.tsx       # Order simulation form
│   │   ├── OrderSimulation.tsx      # Order simulation visualization
│   │   ├── MarketDepth.tsx          # Market depth charts
│   │   ├── OrderBookImbalance.tsx   # Imbalance indicators
│   │   └── VenueSwitcher.tsx        # Venue selection
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Main page
│   └── globals.css                  # Global styles
├── services/
│   └── exchange/
│       ├── okx.ts                   # OKX WebSocket adapter
│       ├── bybit.ts                 # Bybit WebSocket adapter
│       ├── deribit.ts               # Deribit WebSocket adapter
│       ├── createWsClient.ts        # WebSocket client factory
│       └── types.ts                 # TypeScript interfaces
├── store/
│   └── orderbook.ts                 # Zustand store for state management
└── package.json
```

## Key Components

### OrderbookViewer
Main component that orchestrates the entire application, managing:
- Real-time data connections
- Order simulation state
- Layout and responsive design

### SimulationForm
Handles order simulation with features:
- Form validation with Zod
- Timing simulation controls
- Real-time form state management
- Error handling and user feedback

### OrderSimulation
Visualizes simulated orders with:
- Order position in orderbook
- Impact metrics display
- Color-coded status indicators
- Expandable details view

<!-- ### MarketDepth
Advanced market analysis with:
- Cumulative volume visualization
- Spread analysis
- Market depth indicators
- Real-time updates -->

### OrderBookImbalance
Trading indicators including:
- Volume imbalance ratios
- Price pressure analysis
- Spread percentage calculations
- Market depth analysis

## Assumptions Made

1. **Free API Usage**: All exchange APIs used are free/public endpoints
2. **WebSocket Reliability**: Implemented basic error handling and reconnection logic
3. **Data Format**: Standardized orderbook format across all exchanges
4. **Symbol Compatibility**: Using common symbols like BTC-USDT across venues
5. **Real-time Updates**: WebSocket connections provide live data updates

## Libraries Used

- **Next.js**: React framework for production
- **TypeScript**: Type safety and better development experience
- **Tailwind CSS**: Utility-first CSS framework
- **Zustand**: Lightweight state management
- **React Hook Form**: Form handling with validation
- **Zod**: Schema validation
- **WebSocket**: Native browser WebSocket API

## Error Handling

The application includes comprehensive error handling:
- WebSocket connection failures
- API rate limiting
- Data validation errors
- Network connectivity issues
- User input validation

## Performance Considerations

- **WebSocket Management**: Proper cleanup of connections
- **State Updates**: Efficient re-rendering with Zustand
- **Memory Management**: Component unmounting cleanup
- **Real-time Updates**: Optimized for live data streaming

