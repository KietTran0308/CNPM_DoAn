
import { Type } from 'class-transformer';
import {
  IsArray,
  ArrayMinSize,
  ArrayUnique,
  IsUUID,
  IsEnum,
  IsInt,
  Min,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

// Các size đồ uống
export enum ProductSize {
  S = 'S',
  M = 'M',
  L = 'L',
}

// Thông tin của một món trong giỏ hàng
export class OrderItemDto {
  @IsUUID('4')
  productId!: string;

  @IsEnum(ProductSize)
  size!: ProductSize;

  @IsInt()
  @Min(1)
  qty!: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  toppingIds?: string[];
}

// Dữ liệu tạo đơn hàng
export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(50)
  couponCode?: string;
}
