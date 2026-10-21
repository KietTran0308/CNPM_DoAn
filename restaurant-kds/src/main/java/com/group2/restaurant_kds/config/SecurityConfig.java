package com.group2.restaurant_kds.config;

import com.group2.restaurant_kds.security.CustomUserDetailsService;
import com.group2.restaurant_kds.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final CustomUserDetailsService customUserDetailsService;

    public SecurityConfig (JwtAuthenticationFilter jwtAuthFilter, CustomUserDetailsService customUserDetailsService){
        this.jwtAuthFilter = jwtAuthFilter;
        this.customUserDetailsService = customUserDetailsService;
    }
    // 1. Công cụ băm và đối chiếu mật khẩu
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // 2. Cỗ máy xác thực (Kết nối Database và Công cụ băm mật khẩu)

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider =
                new DaoAuthenticationProvider(customUserDetailsService);  // // Chỉ cho Spring biết chỗ lấy User từ MySQL

        authProvider.setPasswordEncoder(passwordEncoder());  // // Chỉ cho Spring biết cách giải mã mật khẩu

        return authProvider;
    }

    // 3. Quản lý luồng đăng nhập tổng (Sẽ dùng ở AuthController để kích hoạt kiểm tra mật khẩu)
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    // 4. Nội quy an ninh (Bộ lọc Request)
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Tắt chống giả mạo request vì hệ thống dùng JWT
            
            // Phân luồng API
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/users", "/api/auth/**").permitAll() // Vào cửa tự do cho Đăng ký và Đăng nhập
                .anyRequest().authenticated() // Tất cả các API còn lại (Đặt món, Bàn...) đều phải quét thẻ JWT
            )
            
            // Tắt Session lưu trạng thái trên Server (Vì REST API chỉ dựa vào Token)
            .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            
            // Cắm cỗ máy xác thực vào hệ thống
            .authenticationProvider(authenticationProvider())
            
            // Xếp "Chú bảo vệ JWT" đứng chặn ngay trước cổng mặc định của Spring
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}