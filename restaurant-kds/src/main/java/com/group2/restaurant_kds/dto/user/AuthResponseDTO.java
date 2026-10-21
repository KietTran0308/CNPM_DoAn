package com.group2.restaurant_kds.dto.user;

public class AuthResponseDTO {
    private String token;
    private String message;

    public AuthResponseDTO (){}
    
    public AuthResponseDTO(String token, String message) {
        this.token = token;
        this.message = message;
    }

    public String getToken() {
        return token;
    }
    public void setToken(String token) {
        this.token = token;
    }
    public String getMessage() {
        return message;
    }
    public void setMessage(String message) {
        this.message = message;
    }
    
}
