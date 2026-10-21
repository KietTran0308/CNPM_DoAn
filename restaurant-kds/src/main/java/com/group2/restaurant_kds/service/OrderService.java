package com.group2.restaurant_kds.service;
import java.util.List;

import com.group2.restaurant_kds.dto.order.OrderRequestDTO;
import com.group2.restaurant_kds.dto.order.OrderResponseDTO;

public interface  OrderService {
    List<OrderResponseDTO> getAllOrder();
    OrderResponseDTO getOrderById(Long id);
    OrderResponseDTO createOrder(OrderRequestDTO dto);
    OrderResponseDTO updateOrder(Long id, OrderRequestDTO dto);
    void deleteOrder(Long id);
    

    // Lấy danh sách đơn hàng (chỉ lấy các đơn có trạng thái PENDING hoặc PREPARING)
    List<OrderResponseDTO> getOrdersByStatus(String status);
    // Cập nhật trạng thái của cả 1 đơn hàng (VD: Xác nhận làm -> Đang nấu -> Hoàn thành)
    OrderResponseDTO updateOrderStatus(Long orderId, String status);
    //Cập nhật trạng thái cho TỪNG MÓN trong đơn (Bếp làm xong món nào bấm món đó)
    OrderResponseDTO updateOrderItemStatus(Long orderId, Long orderItemId, String itemStatus);

    // ======================
    //  TABLE MANAGEMNET 
    //=======================
    // Lấy đơn hàng hiện tại (chưa thanh toán) của một bàn cụ thể
    OrderResponseDTO getActiveOrderByTableId(Long tableId);
    OrderResponseDTO changeTable(Long orderId, Long newTableId);
    OrderResponseDTO mergeOrders(Long mainOrderId, Long sourceOrderId);


    //====================
    // DISCOUNT
    //===================
    OrderResponseDTO applyVoucher(Long orderId, String voucherCode);
    OrderResponseDTO removeVoucher(Long orderId);
    OrderResponseDTO addItemsToOrder(Long orderId, OrderRequestDTO extraItemsDto);



    OrderResponseDTO cancelOrder(Long orderId, String cancelReason);
}
