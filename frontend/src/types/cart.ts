// frontend/src/types/cart.ts

export type IceLevel = '0%' | '30%' | '50%' | '70%' | '100%';
export type SugarLevel = '0%' | '30%' | '50%' | '70%' | '100%';

export interface SizeOption {
  id: string;
  name: string;          // Ví dụ: 'S', 'M', 'L'
  extraPrice: number;    // Giá cộng thêm so với giá gốc
}

export interface ToppingOption {
  id: string;
  name: string;          // Ví dụ: 'Trân châu đen', 'Thạch dừa'
  price: number;         // Đơn giá của từng topping
}

export interface CartItem {
  /**
   * Định danh duy nhất cho từng dòng trong giỏ hàng.
   * Giúp phân biệt các item cùng productId nhưng khác size, topping hoặc mức đường/đá.
   */
  cartItemId: string;

  /** ID của sản phẩm gốc */
  productId: string;

  /** Tên hiển thị của sản phẩm */
  name: string;

  /** Đường dẫn ảnh sản phẩm */
  image: string;

  /** Kích thước được chọn */
  size: SizeOption;

  /** Danh sách các topping kèm theo */
  toppings: ToppingOption[];

  /** Mức đá */
  iceLevel: IceLevel;

  /** Mức đường */
  sugarLevel: SugarLevel;

  /** Ghi chú thêm cho barista / bếp */
  note?: string;

  /** Số lượng món này */
  quantity: number;

  /** 
   * Đơn giá cơ sở của sản phẩm (chưa bao gồm size/topping)
   * hoặc đơn giá đã tính size + topping cho 1 đơn vị
   */
  unitPrice: number;

  /** 
   * Tổng tiền = (unitPrice + size.extraPrice + tổng giá toppings) * quantity
   */
  totalPrice: number;
}

/**
 * Payload khi thêm mới vào giỏ hàng (cartItemId và totalPrice sẽ được tính toán tự động trong store)
 */
export type AddToCartInput = Omit<CartItem, 'cartItemId' | 'totalPrice'>;

/**
 * Payload dùng khi người dùng chỉnh sửa options của món đã có trong giỏ
 */
export interface UpdateCartItemInput {
  size: SizeOption;
  toppings: ToppingOption[];
  iceLevel: IceLevel;
  sugarLevel: SugarLevel;
  note?: string;
  quantity: number;
  unitPrice: number;
}