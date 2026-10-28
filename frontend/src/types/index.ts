/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrderItem, Product, User, Order, Payment, OrderStatus } from '../api';

export type { Product, User, Order, OrderItem, Payment, OrderStatus };

export type Screen =
  | 'auth'
  | 'menu'
  | 'product-detail'
  | 'cart'
  | 'checkout'
  | 'success'
  | 'history';

export type SizeType = 'S' | 'M' | 'L';
export type ToppingType = 'Trân châu' | 'Kem';
export type SugarType = '100%' | '70%' | '50%' | '30%' | 'Ít đường';
export type IceType = '100%' | '70%' | '50%' | 'Ít đá' | 'Đá riêng';

export interface CartLine {
  item: OrderItem;
  productName: string;
  toppings: ToppingType[];
  sugar: SugarType;
  ice: IceType;
  note?: string;
  unitPrice: number;
  stock: number;
}
