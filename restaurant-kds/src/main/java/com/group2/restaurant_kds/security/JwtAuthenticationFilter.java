package com.group2.restaurant_kds.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService customUserDetailsService;
    public JwtAuthenticationFilter (JwtUtil jwtUtil, CustomUserDetailsService customUserDetailsService){
        this.jwtUtil = jwtUtil;
        this.customUserDetailsService = customUserDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        
        // 1. Lấy chuỗi token từ Header mang tên "Authorization" của Request
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // 2. Kiểm tra xem có thẻ không và thẻ có đúng chuẩn (bắt đầu bằng "Bearer ") không
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response); // Không có thẻ thì cho đi tiếp (Lát nữa SecurityConfig sẽ chặn lại)
            return;
        }

        // 3. Cắt bỏ chữ "Bearer " (7 ký tự) để lấy phần mã token thật sự
        jwt = authHeader.substring(7);
        userEmail = jwtUtil.extractEmail(jwt); // Nhờ JwtUtil giải mã để lấy email

        // 4. Nếu có email và luồng hiện tại chưa được xác thực
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            
            // Tìm thông tin người dùng trong Database thông qua cầu nối CustomUserDetailsService
            UserDetails userDetails = this.customUserDetailsService.loadUserByUsername(userEmail);

            // 5. Kiểm tra xem token có hợp lệ không (chưa hết hạn, đúng chữ ký)
            if (jwtUtil.isTokenValid(jwt)) {
                // Tạo một thẻ thông hành chính thức cho Spring Security
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                
                // Đặt thẻ thông hành vào SecurityContext (Xác nhận Đăng nhập thành công cho Request này)
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }
        
        // 6. Cho phép Request đi tiếp tới tầng Controller
        filterChain.doFilter(request, response);
    }
}