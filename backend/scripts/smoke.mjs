const base = process.env.API_URL || 'http://localhost:4000';
try {
  const health = await fetch(`${base}/health`);
  if (!health.ok) throw new Error(`Health HTTP ${health.status}`);
  const products = await fetch(`${base}/products`);
  if (!products.ok) throw new Error(`Products HTTP ${products.status}`);
  const items = await products.json();
  if (!Array.isArray(items) || !items.length) throw new Error('Menu trống');
  console.log(`OK: health + ${items.length} sản phẩm`);
} catch (error) {
  console.error('Smoke test thất bại:', error.message);
  process.exitCode = 1;
}
