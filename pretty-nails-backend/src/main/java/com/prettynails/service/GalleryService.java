package com.prettynails.service;

import com.prettynails.dto.GalleryDtos.*;
import com.prettynails.entity.Gallery;
import com.prettynails.exception.ResourceNotFoundException;
import com.prettynails.repository.GalleryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GalleryService {

    private final GalleryRepository galleryRepository;

    public List<GalleryDto> getPublicGallery(String search, String category) {
        return galleryRepository.searchActive(search, category).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<GalleryDto> getAdminGallery(String search, String category) {
        return galleryRepository.searchActive(search, category).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public GalleryDto createGallery(GalleryRequest request) {
        Gallery gallery = Gallery.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .category(request.getCategory())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        gallery = galleryRepository.save(gallery);
        return mapToDto(gallery);
    }

    @Transactional
    public GalleryDto updateGallery(String id, GalleryRequest request) {
        Gallery gallery = galleryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gallery", "id", id));

        gallery.setTitle(request.getTitle());
        gallery.setDescription(request.getDescription());
        gallery.setImageUrl(request.getImageUrl());
        gallery.setCategory(request.getCategory());
        gallery.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);

        gallery = galleryRepository.save(gallery);
        return mapToDto(gallery);
    }

    @Transactional
    public void deleteGallery(String id) {
        Gallery gallery = galleryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gallery", "id", id));
        galleryRepository.delete(gallery);
    }

    private GalleryDto mapToDto(Gallery g) {
        return GalleryDto.builder()
                .id(g.getId())
                .title(g.getTitle())
                .description(g.getDescription())
                .imageUrl(g.getImageUrl())
                .category(g.getCategory())
                .isActive(g.getIsActive())
                .createdAt(g.getCreatedAt().toString())
                .updatedAt(g.getUpdatedAt() != null ? g.getUpdatedAt().toString() : null)
                .build();
    }
}