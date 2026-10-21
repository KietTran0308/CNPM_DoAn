package com.group2.restaurant_kds.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.group2.restaurant_kds.dto.restaurantTable.RestaurantTableRequestDTO;
import com.group2.restaurant_kds.dto.restaurantTable.RestaurantTableResponseDTO;
import com.group2.restaurant_kds.entity.RestaurantTable;
import com.group2.restaurant_kds.repository.RestaurantTableRepository;

import jakarta.transaction.Transactional;

@Service 
@Transactional
public class RestaurantTableServiceImpl implements RestaurantTableService {
    private final RestaurantTableRepository repository;
    public RestaurantTableServiceImpl (RestaurantTableRepository repository){
        this.repository = repository;
    }
    private RestaurantTableResponseDTO mapToDto (RestaurantTable restaurantTable){
        return new RestaurantTableResponseDTO(
            restaurantTable.getId(),
            restaurantTable.getTableName(),
            restaurantTable.getCapacity(),
            restaurantTable.getStatus()
        );
    }

    @Override 
    public List<RestaurantTableResponseDTO> getAllTables(){
        List<RestaurantTable> tables = repository.findAll();
        return tables.stream().map(this ::mapToDto).toList();
    }

    @Override 
    public RestaurantTableResponseDTO getTableById(Long id){
        RestaurantTable table = repository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy bàn với id: " + id));
        return mapToDto(table);   
    }

    @Override
    public RestaurantTableResponseDTO createTable(RestaurantTableRequestDTO dto){
        RestaurantTable table = new RestaurantTable();
        table.setTableName(dto.getTableName());
        table.setCapacity(dto.getCapacity());
        table.setStatus(dto.GetStatus());
        RestaurantTable tableSave = repository.save(table);
        return mapToDto(tableSave);

    }   

    @Override 
    public RestaurantTableResponseDTO updateTable(Long id, RestaurantTableRequestDTO dto){
        RestaurantTable table = repository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy bàn với id: " + id));
        if (dto.getTableName()!=null) table.setTableName(dto.getTableName());
        if (dto.getCapacity()!=null) table.setCapacity(dto.getCapacity());

        return mapToDto(repository.save(table));
    }

    @Override 
    public void deleteTable(Long id){
        RestaurantTable table = repository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy bàn với id: " + id));
        repository.delete(table);
    }

    @Override 
    public RestaurantTableResponseDTO updateTableStatus(Long id, Boolean status){
        RestaurantTable table = repository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy bàn với id: " + id));
        table.setStatus(status);
        return mapToDto(table);
    }
}
