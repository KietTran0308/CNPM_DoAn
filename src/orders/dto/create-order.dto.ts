import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

export class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  productCode!: string;

  @IsIn(["S", "M", "L"])
  size!: "S" | "M" | "L";

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  toppingCodes?: string[];

  @IsInt()
  @Min(1)
  @Max(20)
  qty!: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];
}

export class StatusDto {
  @IsIn(["PREPARING", "READY", "COMPLETED"])
  status!: "PREPARING" | "READY" | "COMPLETED";
}
