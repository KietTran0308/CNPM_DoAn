package com.group2.restaurant_kds.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.group2.restaurant_kds.dto.restaurantTable.RestaurantTableRequestDTO;
import com.group2.restaurant_kds.dto.restaurantTable.RestaurantTableResponseDTO;
import com.group2.restaurant_kds.service.RestaurantTableService;

@RestController
@RequestMapping ("/api/tables")
public class RestaurantTableController {
    private final RestaurantTableService service;
    public RestaurantTableController (RestaurantTableService service){
        this.service = service;
    }

    @GetMapping 
    public List<RestaurantTableResponseDTO> getAllTables(){
        return service.getAllTables();
    }
    
    @GetMapping ("/{id}")
    public RestaurantTableResponseDTO getTableById(@PathVariable Long id){
        return service.getTableById(id);
    }

    @PostMapping 
    public RestaurantTableResponseDTO createTable(@RequestBody RestaurantTableRequestDTO dto){
        return service.createTable(dto);
    }

    @PutMapping ("/{id}")
    public RestaurantTableResponseDTO updateTable(@PathVariable Long id,@RequestBody  RestaurantTableRequestDTO dto){
        return service.updateTable(id, dto);
    }

    @DeleteMapping ("/{id}")
    public void deleteTable (@PathVariable Long id){
        service.deleteTable(id);
    }

    @PutMapping ("/{id}/status")
    public RestaurantTableResponseDTO updateTableStatus(@PathVariable Long id,@RequestParam Boolean status){
        return service.updateTableStatus(id, status);
    }
}
