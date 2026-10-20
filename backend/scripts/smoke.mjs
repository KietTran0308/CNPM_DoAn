// Chạy sau khi backend + PostgreSQL đang hoạt động: cd backend && npm run smoke
const base = process.env.API_URL || 'http://localhost:4000';
async function request(path, method = 'GET', body, token, key) {
  const res = await fetch(base + path, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(key ? { 'Idempotency-Key': key } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(`${method} ${path}: HTTP ${res.status}, ${JSON.stringify(result)}`);
  return result;
}
const run = async () => {
  const health = await request('/health');
  if (!health.ok) throw new Error('Health không OK');
  const menu = await request('/products');
  if (!Array.isArray(menu) || menu.length < 30) throw new Error('Seed chưa có đủ món');
  console.log('1. GET /health và 32 món: OK');
  const email = `test.${Date.now()}.${Math.random().toString(36).slice(2)}@example.com`;
  const {token,user} = await request('/auth/register','POST',{ fullName:'Tester BrewLite', email, password:'test123456' });
  if (!token || !user.id) throw new Error('JWT lỗi');
  console.log('2. Đăng ký JWT: OK');
  const first = menu.find(p => p.stock>=2);
  if (!first) throw new Error('Không có sản phẩm còn kho');
  const o = await request('/orders','POST',{ items:[{ productId:first.id, size:'M', toppings:['Trân châu'], qty:1 }] },token);
  if (o.status !== 'PENDING') throw new Error('Đơn không PENDING');
  console.log('3. Tạo đơn PENDING, giá backend tính:',o.total);
  const key = `smoke-${Date.now()}-${Math.random()}`;
  const pay = await request('/payments','POST',{orderId:o.id,method:'CARD'},token,key);
  const replay = await request('/payments','POST',{orderId:o.id,method:'CARD'},token,key);
  if (pay.order.status!=='PAID' || !replay.replay) throw new Error('Idempotency lỗi');
  console.log('4. PAID + lặp payment không trùng: OK');
  const orders=await request('/orders/me','GET',undefined,token);
  if (!orders.some(x=>x.id===o.id)) throw new Error('Lịch sử đơn không có order');
  console.log('5. Lịch sử đơn lưu PostgreSQL: OK');
  console.log('SMOKE TEST PASSED!');
};
run().catch(e=>{ console.error('SMOKE TEST FAILED:',e.message);process.exitCode=1; });
