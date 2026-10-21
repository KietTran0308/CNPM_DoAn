package com.group2.restaurant_kds.dto.orderItem;


public class OrderItemRequestDTO {
    private Long foodId;
    private Integer quantity;
    public Long getFoodId() {
        return foodId;
    }
    public void setFoodId(Long foodId) {
        this.foodId = foodId;
    }
    public Integer getQuantity() {
        return quantity;
    }
    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}
