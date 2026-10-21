package com.group2.restaurant_kds.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.group2.restaurant_kds.dto.order.DeliveryInfoDTO;
import com.group2.restaurant_kds.dto.order.OrderRequestDTO;
import com.group2.restaurant_kds.dto.order.OrderResponseDTO;
import com.group2.restaurant_kds.dto.orderItem.OrderItemRequestDTO;
import com.group2.restaurant_kds.dto.orderItem.OrderItemResponseDTO;
import com.group2.restaurant_kds.entity.Food;
import com.group2.restaurant_kds.entity.Order;
import com.group2.restaurant_kds.entity.OrderItem;
import com.group2.restaurant_kds.entity.OrderItem.OrderItemStatus;
import com.group2.restaurant_kds.entity.RestaurantTable;
import com.group2.restaurant_kds.entity.Voucher;
import com.group2.restaurant_kds.repository.FoodRepository;
import com.group2.restaurant_kds.repository.OrderRepository;
import com.group2.restaurant_kds.repository.OrderitemRepository;
import com.group2.restaurant_kds.repository.RestaurantTableRepository;
import com.group2.restaurant_kds.repository.VoucherRepository;

import jakarta.transaction.Transactional;

@Service 
@Transactional 
public class OrderServiceImpl implements OrderService{

    private final OrderRepository orderRepository;
    private final RestaurantTableRepository tableRepository;
    private final OrderitemRepository orderItemRepository;
    private final VoucherRepository voucherRepository;
    private final FoodRepository foodRepository;
    public OrderServiceImpl (OrderRepository orderRepository, RestaurantTableRepository tableRepository, OrderitemRepository orderItemRepository, VoucherRepository voucherRepository, FoodRepository foodRepository){
        this.orderRepository = orderRepository;
        this.tableRepository = tableRepository;
        this.orderItemRepository = orderItemRepository;
        this.voucherRepository = voucherRepository;
        this.foodRepository = foodRepository;
    }


    private OrderItemResponseDTO mapToOrderItemDTO(OrderItem orderItem) {
        OrderItemResponseDTO dto = new OrderItemResponseDTO();
        
        dto.setId(orderItem.getId());
        dto.setFoodName(orderItem.getFoodsName());
        dto.setUnitPrice(orderItem.getUnitPrice());
        dto.setQuantity(orderItem.getQuantity());

        if (orderItem.getStatus() != null) {
            // Lấy Enum, dùng .name() để chuyển thành chữ (VD: Enum PENDING -> String "PENDING")
            dto.setStatus(orderItem.getStatus().name()); 
        }
        
        // Kiểm tra null an toàn trước khi lấy ID của Food và Order
        if (orderItem.getFood() != null) {
            dto.setFoodId(orderItem.getFood().getId());
        }
        if (orderItem.getOrder() != null) {
            dto.setOrderId(orderItem.getOrder().getId());
        }
        
        // Tự động tính lineTotal nếu đơn giá và số lượng không bị null
        if (orderItem.getUnitPrice() != null && orderItem.getQuantity() != null) {
            BigDecimal total = orderItem.getUnitPrice().multiply(new BigDecimal(orderItem.getQuantity()));
            dto.setLineTotal(total);
        }
        
        return dto;
    }

    private OrderResponseDTO mapToDTO(Order order) {
        OrderResponseDTO dto = new OrderResponseDTO();
        
        // 1. Map các trường cơ bản
        dto.setId(order.getId());
        dto.setOrderCode(order.getOrderCode());
        dto.setOrderType(order.getOrderType());
        dto.setStatus(order.getStatus());
        dto.setSubtotal(order.getSubtotal()); 
        dto.setTotalAmount(order.getTotalAmount());
        dto.setNote(order.getNote());
        dto.setCancelReason(order.getCancelReason());
        
        // 2. Kiểm tra null an toàn cho User và Table
        if (order.getUser() != null) {
            dto.setUserId(order.getUser().getId());
        }
        if (order.getTable() != null) {
            // Lưu ý: Nếu trong OrderResponseDTO biến tableId là String thì thêm .toString()
            // Nếu đã đổi thành Long như thống nhất ở trên thì chỉ cần getId()
            dto.setTableId(order.getTable().getId()); 
        }
        if (order.getVoucher() != null) {
            dto.setVoucherCode(order.getVoucher().getCode()); // Lấy mã code (VD: "GIAM20K")
            
            // Lấy số tiền giảm. Lưu ý đổi tên hàm getDiscountValue() cho khớp với Entity Voucher của bạn
            dto.setDiscountAmount(order.getVoucher().getDiscountValue()); 
        }
        // 3. Map DeliveryInfoDTO
        if (order.getReceiverName() != null) {
            DeliveryInfoDTO deliveryInfoDTO = new DeliveryInfoDTO(
                    order.getReceiverName(),
                    order.getReceiverPhone(),
                    order.getShippingAddress(),
                    order.getShippingFee()
            );
            dto.setDeliveryInfo(deliveryInfoDTO);
        }
        
        // 4. Map danh sách OrderItem sang OrderItemResponseDTO
        List<OrderItemResponseDTO> itemDTOs = new ArrayList<>();
        // Lưu ý: Đổi .getItems() thành tên hàm Get tương ứng trong Entity Order của bạn (vd: getOrderItems)
        if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
            for (OrderItem item : order.getOrderItems()) {
                itemDTOs.add(mapToOrderItemDTO(item));
            }
        }
        dto.setItems(itemDTOs);
        
        return dto;
    }
    public List<OrderResponseDTO> getAllOrder(){
        List<Order> orders  = orderRepository.findAll();
        return orders.stream()
                     .map(this:: mapToDTO)
                     .toList();
    }
    @Override
    public OrderResponseDTO getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với ID: " + id));
        return mapToDTO(order);
    }

    @Override
    public OrderResponseDTO createOrder(OrderRequestDTO dto) {
        Order order = new Order();
        order.setOrderType(dto.getOrderType());
        order.setNote(dto.getNote());
        order.setStatus("PENDING"); 
        
        if (dto.getTableId() != null) {
            RestaurantTable table = tableRepository.findById(dto.getTableId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy bàn"));
            order.setTable(table);
        }
        
        if (dto.getDeliveryInfo() != null) {
            order.setReceiverName(dto.getDeliveryInfo().getReceiverName());
            order.setReceiverPhone(dto.getDeliveryInfo().getReceiverPhone());
            order.setShippingAddress(dto.getDeliveryInfo().getShippingAddress());
            order.setShippingFee(dto.getDeliveryInfo().getShippingFee());
        }

        // --- LOGIC BỔ SUNG: XỬ LÝ DANH SÁCH MÓN ĂN ---
        List<OrderItem> items = new ArrayList<>();
        if (dto.getItems() != null) {
            for (OrderItemRequestDTO itemDto : dto.getItems()) {
                // Chọc xuống database lấy giá gốc và tên món ăn
                Food food = foodRepository.findById(itemDto.getFoodId())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy món ăn với ID: " + itemDto.getFoodId()));
                
                OrderItem orderItem = new OrderItem();
                orderItem.setOrder(order);
                orderItem.setFood(food);
                orderItem.setFoodsName(food.getName()); // Lưu lại tên món
                orderItem.setUnitPrice(food.getPrice()); // Tuyệt đối dùng giá từ DB
                orderItem.setQuantity(itemDto.getQuantity());
                
                items.add(orderItem);
            }
        }
        order.setOrderItems(items);
        
        // MỞ COMMENT: Bắt buộc gọi hàm này để tính thành tiền từng món và tổng đơn
        recalculateTotals(order); 
        
        return mapToDTO(orderRepository.save(order));
    }
    @Override
    public OrderResponseDTO updateOrder(Long id, OrderRequestDTO dto) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));
        
        // Thường chỉ update note, loại đơn. (Item sẽ update qua hàm addItemsToOrder)
        order.setNote(dto.getNote());
        order.setOrderType(dto.getOrderType());
        
        return mapToDTO(orderRepository.save(order));
    }
    @Override
    public void deleteOrder(Long id) {
        if (!orderRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy đơn hàng để xóa");
        }
        orderRepository.deleteById(id);
    }

    @Override
    public List<OrderResponseDTO> getOrdersByStatus(String status) {
        // Cần tạo hàm findByStatus trong OrderRepository
        return orderRepository.findByStatus(status).stream().map(this::mapToDTO).toList();
    }

    @Override
    public OrderResponseDTO updateOrderStatus(Long orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));
        order.setStatus(status);
        return mapToDTO(orderRepository.save(order));
    }

    @Override
    public OrderResponseDTO updateOrderItemStatus(Long orderId, Long orderItemId, String itemStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));
        
        OrderItem item = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy món ăn trong đơn"));

        // Kiểm tra xem item này có thuộc về order này không
        if (!item.getOrder().getId().equals(orderId)) {
            throw new RuntimeException("Món ăn không thuộc về đơn hàng này");
        }

        // Giả sử Entity OrderItem có trường status (VD: PENDING, COOKING, DONE)
        try {
            OrderItemStatus enumStatus = OrderItemStatus.valueOf(itemStatus.toUpperCase());
            
            // 3. Set vào entity
            item.setStatus(enumStatus); 
            
        } catch (IllegalArgumentException e) {
            // Nếu Frontend gửi lên một chữ tào lao (VD: "DANG_LAM") không có trong Enum, nó sẽ nhảy vào đây
            throw new RuntimeException("Trạng thái món ăn không hợp lệ: " + itemStatus);
        }

        // 4. Lưu vào DB
        orderItemRepository.save(item);

        return mapToDTO(order);
    }


    // ==========================================
    // 3. TABLE MANAGEMENT (Quản lý Bàn)
    // ==========================================

    @Override
    public OrderResponseDTO getActiveOrderByTableId(Long tableId) {
        // Cần tạo hàm này trong Repository: Lấy đơn hàng của bàn đó mà trạng thái CHƯA THANH TOÁN
        Order order = orderRepository.findTopByTableIdAndStatusNotIn(tableId, List.of("COMPLETED", "CANCELLED"))
                .orElseThrow(() -> new RuntimeException("Bàn này hiện không có đơn hàng nào đang hoạt động"));
        return mapToDTO(order);
    }

    @Override
    public OrderResponseDTO changeTable(Long orderId, Long newTableId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));
                
        RestaurantTable newTable = tableRepository.findById(newTableId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bàn mới"));

        order.setTable(newTable);
        return mapToDTO(orderRepository.save(order));
    }

    @Override
    public OrderResponseDTO mergeOrders(Long mainOrderId, Long sourceOrderId) {
        Order mainOrder = orderRepository.findById(mainOrderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng chính"));
        Order sourceOrder = orderRepository.findById(sourceOrderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng cần gộp"));

        // Chuyển toàn bộ Item từ source sang main
        for (OrderItem item : sourceOrder.getOrderItems()) {
            item.setOrder(mainOrder); // Đổi reference
            mainOrder.getOrderItems().add(item);
        }

        // Hủy đơn hàng cũ (Gắn mác đã gộp)
        sourceOrder.setStatus("MERGED_TO_" + mainOrderId);
        sourceOrder.getOrderItems().clear(); // Xóa list để không bị dính logic cascade nếu có
        orderRepository.save(sourceOrder);

        recalculateTotals(mainOrder);
        return mapToDTO(orderRepository.save(mainOrder));
    }

    // ==========================================
    // 4. DISCOUNT & ITEMS
    // ==========================================

    @Override
    public OrderResponseDTO applyVoucher(Long orderId, String voucherCode) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));
        
        Voucher voucher = voucherRepository.findByCode(voucherCode)
                .orElseThrow(() -> new RuntimeException("Mã giảm giá không tồn tại"));

        if (!voucher.getIsActive()) {
            throw new RuntimeException("Mã giảm giá đã bị khóa hoặc hết hạn");
        }
        
        // Cần tính lại Subtotal trước để lấy số liệu chuẩn nhất kiểm tra điều kiện
        recalculateTotals(order);
        
        // Kiểm tra điều kiện đơn tối thiểu
        if (voucher.getMinOrderAmount() != null && order.getSubtotal().compareTo(voucher.getMinOrderAmount()) < 0) {
            throw new RuntimeException("Đơn hàng chưa đạt giá trị tối thiểu (" + voucher.getMinOrderAmount() + "đ) để áp dụng mã này");
        }

        // Nếu hợp lệ -> Gắn voucher vào order
        order.setVoucher(voucher);
        
        // Gọi hàm tính tiền lần nữa để nó trừ tiền dựa trên Voucher vừa gắn vào
        recalculateTotals(order); 
        
        return mapToDTO(orderRepository.save(order));
    }

    @Override
    public OrderResponseDTO removeVoucher(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));
        
        order.setVoucher(null);
        recalculateTotals(order);
        
        return mapToDTO(orderRepository.save(order));
    }

    @Override
    public OrderResponseDTO addItemsToOrder(Long orderId, OrderRequestDTO extraItemsDto) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (extraItemsDto.getItems() != null) {
            // Đổi ItemRequest thành OrderItemRequestDTO
            for (OrderItemRequestDTO itemDto : extraItemsDto.getItems()) {
                
                // Xóa dấu ... và hoàn thiện lệnh tìm món ăn
                Food food = foodRepository.findById(itemDto.getFoodId())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy món ăn với ID: " + itemDto.getFoodId()));
                
                OrderItem newItem = new OrderItem();
                newItem.setFood(food);
                newItem.setFoodsName(food.getName()); // Bổ sung tên món
                newItem.setQuantity(itemDto.getQuantity());
                newItem.setUnitPrice(food.getPrice());
                newItem.setOrder(order);
                
                order.getOrderItems().add(newItem);
            }
        }
        
        // Gọi tính lại tổng tiền vì vừa có thêm món
        recalculateTotals(order);
        return mapToDTO(orderRepository.save(order));
    }


    @Override
    public OrderResponseDTO cancelOrder(Long orderId, String cancelReason) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));
        
        order.setStatus("CANCELLED");
        // Giả sử Order entity có trường lưu lý do hủy
        order.setCancelReason(cancelReason); 
        
        return mapToDTO(orderRepository.save(order));
    }

    // ==========================================
    // HÀM HELPER HỖ TRỢ DÙNG CHUNG
    // ==========================================
    
    /**
     * Hàm tự động tính toán lại SubTotal và TotalAmount cho đơn hàng
     */
    /**
     * Hàm tự động tính toán lại SubTotal, Discount và TotalAmount cho đơn hàng
     */
    private void recalculateTotals(Order order) {
        BigDecimal subtotal = BigDecimal.ZERO;
        
        // 1. Tính tổng tiền các món ăn (Subtotal)
        if (order.getOrderItems() != null) {
            for (OrderItem item : order.getOrderItems()) {
                if (item.getUnitPrice() != null && item.getQuantity() != null) {
                    BigDecimal lineTotal = item.getUnitPrice().multiply(new BigDecimal(item.getQuantity()));
                    item.setLineTotal(lineTotal); // Cập nhật luôn lineTotal cho từng món
                    subtotal = subtotal.add(lineTotal);
                }
            }
        }
        order.setSubtotal(subtotal);

        // 2. Tính số tiền được giảm giá (Discount) dựa trên loại Voucher
        BigDecimal discount = BigDecimal.ZERO;
        if (order.getVoucher() != null) {
            Voucher v = order.getVoucher();
            
            if ("FIXED".equalsIgnoreCase(v.getDiscountType())) {
                // Nếu giảm số tiền cố định (VD: Giảm 50k)
                discount = v.getDiscountValue();
                
            } else if ("PERCENT".equalsIgnoreCase(v.getDiscountType())) {
                // Nếu giảm theo phần trăm (VD: Giảm 10%)
                // Công thức: discount = subtotal * (discountValue / 100)
                discount = subtotal.multiply(v.getDiscountValue()).divide(new BigDecimal("100"));
                
                // Kiểm tra giới hạn mức giảm tối đa (VD: Giảm 10% nhưng tối đa 30k)
                if (v.getMaxDiscountAmount() != null && discount.compareTo(v.getMaxDiscountAmount()) > 0) {
                    discount = v.getMaxDiscountAmount();
                }
            }
        }
        
        // Đảm bảo tiền giảm giá không được lớn hơn tổng tiền món ăn
        if (discount.compareTo(subtotal) > 0) {
            discount = subtotal;
        }
        
        // Lưu số tiền được giảm vào Order
        order.setDiscountAmount(discount);

        // 3. Tính Tổng tiền cuối cùng (Total Amount)
        BigDecimal total = subtotal.subtract(discount);

        // Cộng thêm phí ship (nếu có)
        if (order.getShippingFee() != null) {
            total = total.add(order.getShippingFee());
        }

        // Tránh trường hợp total bị âm
        if (total.compareTo(BigDecimal.ZERO) < 0) {
            total = BigDecimal.ZERO;
        }

        order.setTotalAmount(total);
    }
}

