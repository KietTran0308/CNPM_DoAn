package com.group2.restaurant_kds.service;
import java.util.List;

import org.springframework.stereotype.Service;
import com.group2.restaurant_kds.entity.Category;
import com.group2.restaurant_kds.dto.category.CategoryRequestDTO;
import com.group2.restaurant_kds.dto.category.CategoryResponseDTO;
import com.group2.restaurant_kds.repository.CategoryRepository;

import jakarta.transaction.Transactional;

@Service 
@Transactional
public class CategoryServiceImpl implements CategoryService{
    private final CategoryRepository categoryRepository;
    public CategoryServiceImpl(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override 
    public List<CategoryResponseDTO> getAllCategories(){
        List<Category> categories = categoryRepository.findAll();
        return categories.stream()
                        .map(this::mapToDTO)
                        .toList();
    }

    private CategoryResponseDTO mapToDTO(Category category) {
        return new CategoryResponseDTO( 
            category.getId(),
            category.getName(),
            category.getSlug(),
            category.getDescription()
        );
    }

    public CategoryResponseDTO createCategory(CategoryRequestDTO dto){
        Category category = new Category();
        category.setName(dto.getName());
        category.setSlug(dto.getSlug());
        category.setDescription(dto.getDescription());

        Category categorySave = categoryRepository.save(category);

        return mapToDTO(categorySave);
    }

    public CategoryResponseDTO categoryGetById(Long id){
        Category category = categoryRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với id: " + id));   
        return mapToDTO(category);
    }

    public CategoryResponseDTO updateCategory(Long id, CategoryRequestDTO dto){
        Category category = categoryRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với id: "+ id));
        if (dto.getName()!=null) category.setName(dto.getName());
        if (dto.getSlug()!=null) category.setSlug(dto.getSlug());
        if (dto.getDescription()!=null) category.setDescription(dto.getDescription());

        return mapToDTO(categoryRepository.save(category));
    }

    public void deleteCategory (long id){
        Category category = categoryRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với id: "+ id));
        categoryRepository.delete(category);
    }

        // Hàm này trả về Entity, chỉ dùng cho nội bộ Backend giao tiếp với nhau
    public Category getCategoryEntityById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Danh mục không tồn tại!"));
    }
}
