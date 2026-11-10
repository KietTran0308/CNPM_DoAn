import {mapProduct, mapOrder, mapOrderItem, DEFAULT_PRODUCTS, tinhGiaTopping, DEFAULT_TOPPINGS} from '../src/api';

describe('Frontend mapping với PostgreSQL BrewLite', () => {
  test('UUID được giữ nguyên và giá size lấy từ API', () => {
    const uuid = 'c2109f91-894f-5836-872b-fc4c0f04ca5d';
    const product = mapProduct({id: uuid, code:'BL001',name:'Cà phê sữa',sizePrices:[
      {size:'S',price:'30000'}, {size:'M',price:'35000'}, {size:'L',price:'40000'}
    ]});
    expect(product.id).toBe(uuid);
    expect(product.sizePrices).toEqual({S:30000,M:35000,L:40000});
    expect(product.price).toBe(35000);
  });
  test('Đơn lịch sử đọc orderItems, productId UUID và orderCode', () => {
    const item = {id:'one',productId:DEFAULT_PRODUCTS[0].id,size:'M',qty:2,lineTotal:'70000'};
    const order = mapOrder({id:'order-id', orderCode:1042, status:'PAID',total:'70000',orderItems:[item]});
    expect(order.orderCode).toBe(1042);
    expect(order.items?.[0].productId).toBe(DEFAULT_PRODUCTS[0].id);
  });
  test('Giá topping theo catalog', () => {
    expect(tinhGiaTopping([DEFAULT_TOPPINGS[0].name], DEFAULT_TOPPINGS)).toBe(DEFAULT_TOPPINGS[0].price);
  });
});
