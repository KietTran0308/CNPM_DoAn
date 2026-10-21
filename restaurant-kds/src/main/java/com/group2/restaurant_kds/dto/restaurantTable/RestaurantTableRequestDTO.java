package com.group2.restaurant_kds.dto.restaurantTable;

public class RestaurantTableRequestDTO {
    private String tableName;
    private Integer capacity;
    private boolean status;
    public String getTableName() {
        return tableName;
    }
    public boolean GetStatus() {
        return status;
    }
    public void setStatus(boolean status) {
        this.status = status;
    }
    public void setTableName(String tableName) {
        this.tableName = tableName;
    }
    public Integer getCapacity() {
        return capacity;
    }
    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    
}
