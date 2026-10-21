package com.group2.restaurant_kds.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.group2.restaurant_kds.entity.User;

@Repository 
public interface UserRepository extends JpaRepository<User,Long>{
    Optional<User> findByEmail (String email);
}
