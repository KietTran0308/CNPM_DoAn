package com.group2.restaurant_kds.controller;


import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.group2.restaurant_kds.dto.food.FoodRequestDTO;
import com.group2.restaurant_kds.dto.food.FoodResponseDTO;

import com.group2.restaurant_kds.service.FoodService;

@RestController 
@RequestMapping("/api/foods")
public class FoodController {
    @Autowired
    private final FoodService foodService;
    public FoodController (FoodService foodService){
        this.foodService = foodService;
    }

    @GetMapping 
    public List<FoodResponseDTO> getAllFoods(){
        return foodService.getAllFoods();
    }

    @GetMapping("/{id}")
    public FoodResponseDTO getFoodById(@PathVariable Long id){
        return foodService.getFoodById(id);
    }

    @PostMapping
    public FoodResponseDTO createFood (@RequestBody  FoodRequestDTO dto){
        return foodService.createFood(dto);
    }

    @PutMapping("/{id}") 
    public FoodResponseDTO updateFood (@PathVariable Long id,@RequestBody FoodRequestDTO dto){
        return foodService.updateFood(id, dto);
    }

    @DeleteMapping("/{id}")
    public void deleteFood (@PathVariable Long id){
        foodService.deleteFood(id);
    }

    @GetMapping("/search")
    public List<FoodResponseDTO> searchFoods (@RequestParam String keyword){
        return foodService.searchFoods(keyword);
    }
    
    @GetMapping("/category/{categoryId}")
    public List<FoodResponseDTO> getFoodsByCategory(@PathVariable Long categoryId){
        return foodService.getFoodsByCategory(categoryId);
    }
}
