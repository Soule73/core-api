const http = require('http');
const fs = require('fs');

const PORT = 3002;
const DATA_FILE = '/app/orders-data.json';

let ordersData = [];

try {
  const rawData = fs.readFileSync(DATA_FILE, 'utf8');
  ordersData = JSON.parse(rawData);
  console.log(`Loaded ${ordersData.length} orders from ${DATA_FILE}`);
} catch (error) {
  console.error('Error loading orders data:', error.message);
  process.exit(1);
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  if (pathname === '/orders' || pathname === '/api/orders') {
    const region = url.searchParams.get('region');
    const category = url.searchParams.get('category');
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit')) || ordersData.length;

    let filtered = [...ordersData];

    if (region) {
      filtered = filtered.filter(
        (o) => o.region.toLowerCase() === region.toLowerCase(),
      );
    }
    if (category) {
      filtered = filtered.filter(
        (o) => o.category.toLowerCase() === category.toLowerCase(),
      );
    }
    if (status) {
      filtered = filtered.filter(
        (o) => o.status.toLowerCase() === status.toLowerCase(),
      );
    }

    filtered = filtered.slice(0, limit);

    res.writeHead(200);
    res.end(JSON.stringify(filtered));
    return;
  }

  if (pathname === '/stats' || pathname === '/api/stats') {
    const stats = {
      totalOrders: ordersData.length,
      totalRevenue: ordersData.reduce((sum, o) => sum + o.total, 0),
      averageOrderValue:
        ordersData.reduce((sum, o) => sum + o.total, 0) / ordersData.length,
      totalItems: ordersData.reduce((sum, o) => sum + o.quantity, 0),
      byStatus: {},
      byCategory: {},
      byRegion: {},
      byPaymentMethod: {},
    };

    ordersData.forEach((order) => {
      stats.byStatus[order.status] = (stats.byStatus[order.status] || 0) + 1;
      stats.byCategory[order.category] =
        (stats.byCategory[order.category] || 0) + order.total;
      stats.byRegion[order.region] =
        (stats.byRegion[order.region] || 0) + order.total;
      stats.byPaymentMethod[order.paymentMethod] =
        (stats.byPaymentMethod[order.paymentMethod] || 0) + 1;
    });

    res.writeHead(200);
    res.end(JSON.stringify(stats));
    return;
  }

  if (pathname === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', orders: ordersData.length }));
    return;
  }

  res.writeHead(404);
  res.end(
    JSON.stringify({
      error: 'Not found',
      availableEndpoints: [
        'GET /orders - List all orders (supports ?region=, ?category=, ?status=, ?limit=)',
        'GET /stats - Aggregated statistics',
        'GET /health - Health check',
      ],
    }),
  );
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Orders API running on http://0.0.0.0:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET /orders - List all orders');
  console.log(
    '  GET /orders?region=Paris&category=Electronics&status=delivered&limit=10',
  );
  console.log('  GET /stats - Aggregated statistics');
  console.log('  GET /health - Health check');
});
