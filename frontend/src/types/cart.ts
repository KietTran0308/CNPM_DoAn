/** Tất cả component và store dùng cùng một CartItem chuẩn. */
export type { CartItem, SizeOption, ToppingOption } from './index';
export type IceLevel = '0%' | '30%' | '50%' | '100%';
export type SugarLevel = IceLevel;
import type { CartItem, SizeOption, ToppingOption } from './index';
export type AddToCartInput = Omit<CartItem, 'cartItemId' | 'totalPrice'>;
export interface UpdateCartItemInput {
  size: SizeOption;
  toppings: ToppingOption[];
  iceLevel: IceLevel;
  sugarLevel: SugarLevel;
  note: string;
  quantity: number;
  unitPrice: number;
}
