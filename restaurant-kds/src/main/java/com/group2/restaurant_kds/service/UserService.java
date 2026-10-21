package com.group2.restaurant_kds.service;

import java.util.List;

import com.group2.restaurant_kds.dto.user.UserResponseDTO;
import com.group2.restaurant_kds.dto.user.UserChangePasswordDTO;
import com.group2.restaurant_kds.dto.user.UserRequestDTO;
public interface UserService {
    List<UserResponseDTO> getAllUsers();
    UserResponseDTO getUserById(Long id);
    void disableUser(Long id);
    UserResponseDTO createUser(UserRequestDTO dto);
    UserResponseDTO updateUser (Long id, UserRequestDTO dto);
    void changePassword(Long id, UserChangePasswordDTO dto);
    void resetPasswordToDefault(Long id);
}
