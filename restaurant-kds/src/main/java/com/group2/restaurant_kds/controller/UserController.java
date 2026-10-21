package com.group2.restaurant_kds.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.group2.restaurant_kds.dto.user.UserChangePasswordDTO;
import com.group2.restaurant_kds.dto.user.UserRequestDTO;
import com.group2.restaurant_kds.dto.user.UserResponseDTO;
import com.group2.restaurant_kds.service.RequiredArgsConstructor;
import com.group2.restaurant_kds.service.UserService; // Lưu ý import đúng tên Interface


@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    public UserController (UserService userService){
        this.userService = userService;
    }
    // 1. Lấy danh sách toàn bộ user
    @GetMapping
    public List<UserResponseDTO> getAllUsers() {
        return userService.getAllUsers();
    }

    // 2. Lấy thông tin 1 user cụ thể
    @GetMapping("/{id}")
    public UserResponseDTO getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    // 3. Tạo user mới
    @PostMapping
    public UserResponseDTO createUser(@RequestBody UserRequestDTO dto) {
        return userService.createUser(dto);
    }

    // 4. Cập nhật thông tin user
    @PutMapping("/{id}")
    public UserResponseDTO updateUser(@PathVariable Long id, @RequestBody UserRequestDTO dto) {
        return userService.updateUser(id, dto);
    }

    // 5. Khóa tài khoản
    @PutMapping("/{id}/disable")
    public void disableUser(@PathVariable Long id) {
        userService.disableUser(id);
    }

    // 6. Đổi mật khẩu (Cần pass cũ)
    @PutMapping("/{id}/change-password")
    public void changePassword(@PathVariable Long id, @RequestBody UserChangePasswordDTO dto) {
        userService.changePassword(id, dto);
    }

    // 7. Admin reset mật khẩu về mặc định
    @PutMapping("/{id}/reset-password")
    public void resetPasswordToDefault(@PathVariable Long id) {
        userService.resetPasswordToDefault(id);
    }
}