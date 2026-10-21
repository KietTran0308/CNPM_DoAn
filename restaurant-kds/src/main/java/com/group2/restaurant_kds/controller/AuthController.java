package com.group2.restaurant_kds.controller;

import com.group2.restaurant_kds.dto.user.AuthRequestDTO;
import com.group2.restaurant_kds.dto.user.AuthResponseDTO;
import com.group2.restaurant_kds.security.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")

public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    public AuthController (AuthenticationManager authenticationManager, JwtUtil jwtUtil){
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
    }
    @PostMapping("/login")
    public AuthResponseDTO login(@RequestBody AuthRequestDTO request) {
        // 1. Kích hoạt cỗ máy xác thực đối chiếu email và password thô với database
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // 2. Nếu mật khẩu đúng (không văng lỗi), tiến hành in thẻ JWT
        String jwtToken = jwtUtil.generateToken(request.getEmail());

        // 3. Trả thẻ về cho React
        return new AuthResponseDTO(jwtToken, "Đăng nhập thành công!");
    }
}