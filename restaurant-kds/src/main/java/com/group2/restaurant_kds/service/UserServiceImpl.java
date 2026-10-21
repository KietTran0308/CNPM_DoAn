package com.group2.restaurant_kds.service;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.group2.restaurant_kds.dto.user.UserChangePasswordDTO;
import com.group2.restaurant_kds.dto.user.UserRequestDTO;
import com.group2.restaurant_kds.dto.user.UserResponseDTO;
import com.group2.restaurant_kds.entity.User;
import com.group2.restaurant_kds.repository.UserRepository;

import jakarta.transaction.Transactional;

@Service
@Transactional // Tự động lưu mọi thay đổi xuống database cho tất cả các hàm
public class UserServiceImpl implements UserService {
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    public UserServiceImpl (UserRepository userRepository, PasswordEncoder passwordEncoder){
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }
    public UserResponseDTO mapToDto (User user){
        return  new UserResponseDTO(user.getId(), user.getEmail(), user.getfullName(),user.getPhone(), user.getRole());
    }
    @Override 
    public List<UserResponseDTO> getAllUsers(){
        List<User> users = userRepository.findAll();
        return users.stream().map(this :: mapToDto).toList();
    }
    @Override 
    public UserResponseDTO getUserById(Long id){
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy User với id: " + id));
        return mapToDto(user);
    }
    @Override 
    public void disableUser(Long id){
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy User với id: " + id));
        user.setisActive(false);
    }
    @Override 
    public UserResponseDTO createUser(UserRequestDTO dto){
        User user = new User();
        user.setEmail(dto.getEmail());
        user.setfullName(dto.getFullName());
        user.setPhone(dto.getPhone());
        user.setpasswordHash(passwordEncoder.encode(dto.getPassword()));
        User userSave = userRepository.save(user);
        return mapToDto(userSave);
    }
    @Override 
    public UserResponseDTO updateUser (Long id, UserRequestDTO dto){
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy User với id: " + id));
        if (dto.getEmail()!= null) user.setEmail(dto.getEmail());
        if (dto.getFullName()!= null) user.setfullName(dto.getFullName());
        if (dto.getPhone()!= null) user.setPhone(dto.getPhone());
        return mapToDto(userRepository.save(user));
    }
    @Override 
    public void changePassword(Long id, UserChangePasswordDTO dto){
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy User với id: " + id));
        if (user.getpasswordHash().equals(dto.getOldPassword())) user.setpasswordHash(dto.getNewPassword()); 
    }
    @Override 
    public void resetPasswordToDefault(Long id){
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy User với id: " + id));
        user.setpasswordHash("123456");
    }
}
