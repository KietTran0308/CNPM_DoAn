package com.group2.restaurant_kds.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.group2.restaurant_kds.dto.order.OrderRequestDTO;
import com.group2.restaurant_kds.dto.order.OrderResponseDTO;
import com.group2.restaurant_kds.service.OrderService;

@RestController 
@RequestMapping ("/api/orders")
public class OrderController {
    private final OrderService orderService;
    public OrderController (OrderService orderService){
        this.orderService = orderService;
    }
    @GetMapping
    public List<OrderResponseDTO> getAllOrders() {
        return orderService.getAllOrder();
    }

    @GetMapping("/{id}")
    public OrderResponseDTO getOrderById(@PathVariable Long id) {
        return orderService.getOrderById(id);
    }

    @PostMapping
    public OrderResponseDTO createOrder(@RequestBody OrderRequestDTO dto) {
        return orderService.createOrder(dto);
        
    }

    @PutMapping("/{id}")
    public OrderResponseDTO updateOrder(@PathVariable Long id, @RequestBody OrderRequestDTO dto) {
        return orderService.updateOrder(id, dto);
    }

    @DeleteMapping("/{id}")
    public void deleteOrder(@PathVariable Long id) {
        orderService.deleteOrder(id);
    }

    // ==========================================
    // 2. QUẢN LÝ TRẠNG THÁI (STATUS)
    // ==========================================

    // VD: GET /api/orders/status/PENDING
    @GetMapping("/status/{status}")
    public List<OrderResponseDTO> getOrdersByStatus(@PathVariable String status) {
        return orderService.getOrdersByStatus(status);
    }

    // VD: PATCH /api/orders/1/status?status=COOKING
    @PatchMapping("/{id}/status")
    public OrderResponseDTO updateOrderStatus(
            @PathVariable Long id, 
            @RequestParam String status) {
        return orderService.updateOrderStatus(id, status);
    }

    // VD: PATCH /api/orders/1/items/5/status?itemStatus=DONE
    @PatchMapping("/{id}/items/{orderItemId}/status")
    public OrderResponseDTO updateOrderItemStatus(
            @PathVariable Long id, 
            @PathVariable Long orderItemId, 
            @RequestParam String itemStatus) {
        return orderService.updateOrderItemStatus(id, orderItemId, itemStatus);
    }

    // ==========================================
    // 3. QUẢN LÝ BÀN (TABLE MANAGEMENT)
    // ==========================================

    // VD: GET /api/orders/table/10/active
    @GetMapping("/table/{tableId}/active")
    public OrderResponseDTO getActiveOrderByTableId(@PathVariable Long tableId) {
        return orderService.getActiveOrderByTableId(tableId);
    }

    // VD: PATCH /api/orders/1/change-table/15 (Đổi từ bàn hiện tại sang bàn 15)
    @PatchMapping("/{id}/change-table/{newTableId}")
    public OrderResponseDTO changeTable(
            @PathVariable Long id, 
            @PathVariable Long newTableId) {
        return orderService.changeTable(id, newTableId);
    }

    // VD: PATCH /api/orders/1/merge/2 (Gộp đơn số 2 vào đơn số 1)
    @PatchMapping("/{mainOrderId}/merge/{sourceOrderId}")
    public OrderResponseDTO mergeOrders(
            @PathVariable Long mainOrderId, 
            @PathVariable Long sourceOrderId) {
        return orderService.mergeOrders(mainOrderId, sourceOrderId);
    }

    // ==========================================
    // 4. MÃ GIẢM GIÁ (DISCOUNT) & HỦY ĐƠN
    // ==========================================

    // VD: PATCH /api/orders/1/voucher/TET2024
    @PatchMapping("/{id}/voucher/{voucherCode}")
    public OrderResponseDTO applyVoucher(
            @PathVariable Long id, 
            @PathVariable String voucherCode) {
        return orderService.applyVoucher(id, voucherCode);
    }

    // VD: DELETE /api/orders/1/voucher
    @DeleteMapping("/{id}/voucher")
    public OrderResponseDTO removeVoucher(@PathVariable Long id) {
        return orderService.removeVoucher(id);
    }

    // VD: PATCH /api/orders/1/cancel?reason=Khach_doi_y
    @PatchMapping("/{id}/cancel")
    public OrderResponseDTO cancelOrder(
            @PathVariable Long id, 
            @RequestParam String reason) {
        return orderService.cancelOrder(id, reason);
    }

    @PostMapping("/{id}/items")
    public OrderResponseDTO addItemsToOrder(
            @PathVariable Long id, 
            @RequestBody OrderRequestDTO extraItemsDto) {
        return orderService.addItemsToOrder(id, extraItemsDto);
    }

}
