package com.group2.restaurant_kds.controller;

import com.group2.restaurant_kds.dto.bill.BillRequestDTO;
import com.group2.restaurant_kds.dto.bill.BillResponseDTO;
import com.group2.restaurant_kds.service.BillService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bills")
public class BillController {

    private final BillService billService;

    public BillController(BillService billService) {
        this.billService = billService;
    }

    @PostMapping
    public BillResponseDTO createBill(@RequestBody BillRequestDTO dto) {
        return billService.createBill(dto);
    }

    @GetMapping
    public List<BillResponseDTO> getAllBills() {
        return billService.getAllBills();
    }

    @GetMapping("/{id}")
    public BillResponseDTO getBillById(@PathVariable Long id) {
        return billService.getBillById(id);
    }

    @GetMapping("/order/{orderId}")
    public BillResponseDTO getBillByOrderId(@PathVariable Long orderId) {
        return billService.getBillByOrderId(orderId);
    }
}