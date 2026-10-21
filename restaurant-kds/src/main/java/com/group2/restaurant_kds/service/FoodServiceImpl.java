package com.group2.restaurant_kds.service;

import java.util.ArrayList;
import java.util.List;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.group2.restaurant_kds.entity.Category;
import com.group2.restaurant_kds.entity.Food;
import com.group2.restaurant_kds.dto.food.FoodResponseDTO;
import com.group2.restaurant_kds.dto.food.FoodRequestDTO;
import com.group2.restaurant_kds.repository.FoodRepository;

import jakarta.transaction.Transactional;
@Service 
@Transactional
public class FoodServiceImpl implements FoodService{
    private final FoodRepository foodRepository;
    @Autowired
    private CategoryService categoryService;
    public FoodServiceImpl (FoodRepository foodRepository){
        this.foodRepository = foodRepository;
    }
    private FoodResponseDTO mapToDto(Food food){
        return new FoodResponseDTO(food.getId(),
        // Nếu Category khác null thì lấy ID, nếu null thì trả về null
            food.getCategory() != null ? food.getCategory().getId() : null,
            food.getName(),
            food.getPrice(),
            food.getStockQuantity());
    }
    
    @Override 
    public List<FoodResponseDTO> getAllFoods(){
        List<Food> foods = foodRepository.findAll();
        return foods.stream()
                .map(this::mapToDto)
                .toList();
    }

    @Override 
    public FoodResponseDTO getFoodById(Long id){
        Food food = foodRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy Food với id: " + id));
        return mapToDto(food);
    }
    @Override 
    public FoodResponseDTO createFood (FoodRequestDTO dto){
        Food food = new Food();
        food.setName(dto.getName());
        food.setPrice(dto.getPrice());
        food.setDescription(dto.getDescription());
        food.setStockQuantity(dto.getStockQuantity());
        if (dto.getCategoryId() != null){
            Category category = categoryService.getCategoryEntityById(dto.getCategoryId());
            food.setCategory(category);
        }
        food.setSlug(dto.getName().toLowerCase().replaceAll(" ", "-"));
        food.setSku("FOOD-" + System.currentTimeMillis());
        return mapToDto(foodRepository.save(food));
    }

    @Override 
    public FoodResponseDTO updateFood (Long id, FoodRequestDTO dto){
        Food food = foodRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy Food với id: " + id));
        if (dto.getName()!= null) food.setName(dto.getName());
        if (dto.getPrice()!= null) food.setPrice(dto.getPrice());
        if (dto.getDescription()!= null) food.setDescription(dto.getDescription());
        if (dto.getStockQuantity()!= null) food.setStockQuantity(dto.getStockQuantity());
        if (dto.getCategoryId() != null){
            Category category = categoryService.getCategoryEntityById(dto.getCategoryId());
            food.setCategory(category);
        }
        return mapToDto(foodRepository.save(food));
    }
    @Override 
    public  void deleteFood (Long id){
        Food food = foodRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy Food với id: " + id));
        foodRepository.delete(food);
    }
    @Override 
    public List<FoodResponseDTO> searchFoods (String keyword){
        List<Food> listfoods = foodRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(keyword, keyword);
        List<FoodResponseDTO> result = new ArrayList<>();
        for (Food food : listfoods){
            FoodResponseDTO dto = mapToDto(food);
            result.add(dto);
        }
        return result;
    }
    @Override 
    // Lấy danh sách món ăn theo categoryId
    public List<FoodResponseDTO> getFoodsByCategory(Long categoryId){
        List <Food> listfoods = foodRepository.findByCategoryId(categoryId);
        List<FoodResponseDTO> result = new ArrayList<>();
        for (Food  food : listfoods){
            FoodResponseDTO dto = mapToDto(food);
            result.add(dto);
        }
        return result;
    }
}
