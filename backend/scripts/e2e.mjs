// Chạy trên database TEST: tạo tài khoản và đơn hàng thật.
import {randomUUID} from 'node:crypto';
const root = (process.env.API_URL || 'http://localhost:4000').replace(/\/$/, '');
async function request(path, method='GET', payload, token, key) {
  const response = await fetch(root + path, {
    method, headers: {'Content-Type':'application/json',
      ...(token ? {Authorization:`Bearer ${token}`} : {}),
      ...(key ? {'Idempotency-Key':key} : {})},
    ...(payload !== undefined ? {body:JSON.stringify(payload)} : {}),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`${path}: ${JSON.stringify(data)}`);
  return data;
}
try {
  const menu = await request('/products');
  if (!menu.length || !menu[0].sizePrices.some(p => p.size==='M')) throw new Error('Menu/giá sai');
  const name = 'E2E BrewLite';
  const auth = await request('/auth/register','POST',{
    fullName:name, email:`e2e-${randomUUID()}@example.com`, password:'Passw0rd!'
  });
  const token = auth.token;
  const dto = {items:[{productId:menu[0].id,size:'M',qty:1,toppings:[]}]};
  const key = randomUUID();
  const order = await request('/orders','POST',dto,token,key);
  if (order.status !== 'PENDING') throw new Error('Không tạo PENDING');
  const replay = await request('/orders','POST',dto,token,key);
  if (replay.id !== order.id) throw new Error('Tạo đơn bị trùng');
  const paymentKey = randomUUID();
  const payment = await request('/payments','POST',{orderId:order.id,method:'WALLET'},token,paymentKey);
  if (payment.order.status !== 'PAID') throw new Error('Thanh toán không PAID');
  const orders = await request('/orders/me','GET',undefined,token);
  if (!orders.some(x => x.id === order.id && x.orderItems.length)) throw new Error('Lịch sử đơn thiếu items');
  const cancelled = await request(`/orders/${order.id}/cancel`,'POST',{},token);
  if (cancelled.status !== 'CANCELLED') throw new Error('Hủy đơn thất bại');
  console.log('E2E PASS: menu → register → create/idempotency → pay → history → cancel');
} catch (e) {
  console.error('E2E FAIL:',e.message);
  process.exitCode=1;
}
