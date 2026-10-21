package com.group2.restaurant_kds.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.group2.restaurant_kds.dto.voucher.VoucherRequestDTO;
import com.group2.restaurant_kds.dto.voucher.VoucherResponseDTO;
import com.group2.restaurant_kds.entity.Voucher;
import com.group2.restaurant_kds.repository.VoucherRepository;

import jakarta.transaction.Transactional;

@Service 
@Transactional
public class VoucherServiceImpl implements VoucherService {
    private final VoucherRepository voucherRepository;
    public VoucherServiceImpl(VoucherRepository voucherRepository){
        this.voucherRepository = voucherRepository;
    }
    private VoucherResponseDTO mapToDto (Voucher voucher){
        return new VoucherResponseDTO(voucher.getId(),voucher.getCode(),voucher.getName(),voucher.getDescription(),voucher.getDiscountType(),voucher.getDiscountValue(),voucher.getMinOrderAmount(),voucher.getMaxDiscountAmount(),voucher.getStartAt(),voucher.getEndAt(),voucher.getUsageLimit(),voucher.getUsedCount(),voucher.getIsActive());
    }
    public VoucherResponseDTO createVoucher(VoucherRequestDTO dto){
        Voucher voucher = new Voucher();
        voucher.setCode(dto.getCode());
        voucher.setName(dto.getName());
        voucher.setDescription(dto.getDescription());
        voucher.setDiscountType(dto.getDiscountType());
        voucher.setDiscountValue(dto.getDiscountValue());
        voucher.setMinOrderAmount(dto.getMinOrderAmount());
        voucher.setMaxDiscountAmount(dto.getMaxDiscountAmount());
        voucher.setStartAt(dto.getStartAt());
        voucher.setEndAt(dto.getEndAt());
        voucher.setUsageLimit(dto.getUsageLimit());
        Voucher voucherSave = voucherRepository.save(voucher);
        return mapToDto(voucherSave);
    }
    
    public List<VoucherResponseDTO> getAllVouchers(){
        List<Voucher> vouchers = voucherRepository.findAll();
        return vouchers.stream().map(this::mapToDto).toList();
    }
    
    public VoucherResponseDTO getVoucherById(Long id){
        Voucher voucher = voucherRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy voucher với id: " + id));
        return mapToDto(voucher);
    }
    
    public VoucherResponseDTO updateVoucher(Long id, VoucherRequestDTO dto){
        Voucher voucher = voucherRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy voucher với id: " + id));
        if (dto.getCode()!= null) voucher.setCode(dto.getCode());
        if (dto.getDescription()!= null) voucher.setDescription(dto.getDescription());
        if (dto.getDiscountType()!= null) voucher.setDiscountType(dto.getDiscountType());
        if (dto.getDiscountValue()!= null) voucher.setDiscountValue(dto.getDiscountValue());
        if (dto.getMinOrderAmount()!= null) voucher.setMinOrderAmount(dto.getMinOrderAmount());
        if (dto.getMaxDiscountAmount()!= null) voucher.setMaxDiscountAmount(dto.getMaxDiscountAmount());
        if (dto.getStartAt()!= null) voucher.setStartAt(dto.getStartAt());
        if (dto.getEndAt()!= null) voucher.setEndAt(dto.getEndAt());
        if (dto.getUsageLimit()!= null) voucher.setUsedCount(dto.getUsageLimit());

        Voucher vouchersave = voucherRepository.save(voucher);
        return mapToDto(vouchersave);
    }
    // Đổi trạng thái isActive thành false thay vì xóa hẳn khỏi database
    public void disableVoucher(Long id){
        Voucher voucher = voucherRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy voucher với id: " + id));
        voucher.setIsActive(false);
        voucherRepository.save(voucher);
    }

    // Tính toán số tiền được giảm dựa trên mã code và tổng tiền hóa đơn hiện tại
    public BigDecimal calculateDiscount(String code, BigDecimal currentOrderTotal){
        Voucher voucher = voucherRepository.findByCode(code).orElseThrow(() -> new RuntimeException("Mã giảm giá không tồn tại!"));
        // 1. Khóa trạng thái
        if (!voucher.getIsActive()) {
            throw new RuntimeException("Mã giảm giá đã bị khóa hoặc không còn hiệu lực.");
        }

        // 2. Thời hạn sử dụng
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(voucher.getStartAt()) || now.isAfter(voucher.getEndAt())) {
            throw new RuntimeException("Mã giảm giá không nằm trong thời gian áp dụng.");
        }

        // 3. Giới hạn lượt dùng (nếu có set usageLimit)
        if (voucher.getUsageLimit() != null && voucher.getUsedCount() >= voucher.getUsageLimit()) {
            throw new RuntimeException("Mã giảm giá đã đạt giới hạn số lượt sử dụng.");
        }

        // 4. Giá trị đơn hàng tối thiểu
        if (voucher.getMinOrderAmount() != null && currentOrderTotal.compareTo(voucher.getMinOrderAmount()) < 0) {
            throw new RuntimeException("Đơn hàng chưa đạt mức tối thiểu để áp dụng mã này.");
        }
        BigDecimal discountAmount = BigDecimal.ZERO;

        if ("FIXED".equals(voucher.getDiscountType())) {
            // Nếu giảm tiền mặt trực tiếp
            discountAmount = voucher.getDiscountValue();
            
        } else if ("PERCENT".equals(voucher.getDiscountType())) {
            // Tính tiền giảm theo phần trăm: (currentOrderTotal * discountValue) / 100
            BigDecimal percentage = voucher.getDiscountValue().divide(BigDecimal.valueOf(100));
            discountAmount = currentOrderTotal.multiply(percentage);
            
            // Cắt ngọn nếu số tiền giảm vượt quá giới hạn tối đa cho phép
            if (voucher.getMaxDiscountAmount() != null && discountAmount.compareTo(voucher.getMaxDiscountAmount()) > 0) {
                discountAmount = voucher.getMaxDiscountAmount();
            }
        }

        // Bảo vệ cuối cùng: Tiền giảm không được phép lớn hơn tổng tiền hóa đơn hiện tại
        return discountAmount.compareTo(currentOrderTotal) > 0 ? currentOrderTotal : discountAmount;
    }
    
    // Tăng số lượt đã sử dụng (usedCount) lên 1 sau khi đơn hàng thanh toán thành công
    public void incrementUsageCount(String code){
        Voucher voucher = voucherRepository.findByCode(code).orElseThrow(() -> new RuntimeException("Mã giảm giá không tồn tại!"));
        voucher.setUsedCount(voucher.getUsedCount()+1);
        voucherRepository.save(voucher);
    }
}
