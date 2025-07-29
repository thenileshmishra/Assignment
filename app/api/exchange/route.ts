import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const exchange = searchParams.get('exchange');
  const symbol = searchParams.get('symbol');

  if (!exchange || !symbol) {
    return NextResponse.json({ error: 'Missing exchange or symbol parameter' }, { status: 400 });
  }

  try {
    let url: string;
    let response: Response;

    switch (exchange) {
      case 'okx':
        url = `https://www.okx.com/api/v5/market/books?instId=${symbol}&sz=50`;
        break;
      case 'bybit':
        const bybitSymbol = symbol.replace('-', '').toUpperCase();
        url = `https://api.bybit.com/v5/market/orderbook?category=linear&symbol=${bybitSymbol}&limit=50`;
        break;
      case 'deribit':
        const baseSymbol = symbol.split('-')[0];
        const deribitSymbol = `${baseSymbol}-PERPETUAL`;
        url = `https://www.deribit.com/api/v2/public/get_order_book?instrument_name=${deribitSymbol}&depth=25`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid exchange' }, { status: 400 });
    }

    console.log(`Proxying request to: ${url}`);
    response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OrderbookViewer/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`API proxy error for ${exchange}:`, error);
    return NextResponse.json(
      { error: `Failed to fetch data from ${exchange}` },
      { status: 500 }
    );
  }
} 