package com.group2.restaurant_kds.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    // Khóa bí mật dùng để ký và giải mã token (Bắt buộc phải dài ít nhất 32 ký tự)
    // Trong dự án thực tế, chuỗi này thường được giấu trong file application.yml
    private final String SECRET_STRING = "KhoaBiMatCuaNhaHangRestaurantKDS2026!!!";
    
    // Thuật toán sinh khóa HMAC-SHA
    private final SecretKey SECRET_KEY = Keys.hmacShaKeyFor(SECRET_STRING.getBytes(StandardCharsets.UTF_8));

    // Thời gian sống của thẻ (Ví dụ: 24 giờ = 86,400,000 milliseconds)
    private final long EXPIRATION_TIME = 86400000L;

    // 1. Chức năng IN THẺ (Sinh JWT Token khi đăng nhập thành công)
    public String generateToken(String email) {
        return Jwts.builder()
                .subject(email) // Lưu email vào thân của thẻ
                .issuedAt(new Date(System.currentTimeMillis())) // Thời điểm phát hành
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME)) // Thời điểm hết hạn
                .signWith(SECRET_KEY) // Đóng dấu bảo mật bằng khóa bí mật
                .compact(); // Nén thành chuỗi JWT
    }

    // 2. Chức năng QUÉT THẺ (Giải mã token để lấy email người dùng)
    public String extractEmail(String token) {
        return Jwts.parser()
                .verifyWith(SECRET_KEY) // Dùng khóa bí mật để xác thực chữ ký
                .build()
                .parseSignedClaims(token) // Đọc dữ liệu
                .getPayload()
                .getSubject(); // Lấy ra biến subject (chính là email)
    }

    // 3. Chức năng KIỂM TRA THẺ (Xác minh token có bị sửa đổi hay hết hạn không)
    public boolean isTokenValid(String token) {
        try {
            Jwts.parser().verifyWith(SECRET_KEY).build().parseSignedClaims(token);
            return true; // Nếu không văng lỗi nghĩa là thẻ hợp lệ
        } catch (Exception e) {
            return false; // Thẻ giả, thẻ hết hạn, hoặc bị chỉnh sửa
        }
    }
} 