package com.prettynails.controller;

import com.prettynails.dto.GalleryDtos.*;
import com.prettynails.service.GalleryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class GalleryController {

    private final GalleryService galleryService;

    @GetMapping("/gallery")
    public ResponseEntity<List<GalleryDto>> getPublicGallery(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category
    ) {
        List<GalleryDto> gallery = galleryService.getPublicGallery(search, category);
        return ResponseEntity.ok(gallery);
    }

    @GetMapping("/admin/gallery")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<GalleryDto>> getAdminGallery(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category
    ) {
        List<GalleryDto> gallery = galleryService.getAdminGallery(search, category);
        return ResponseEntity.ok(gallery);
    }

    @PostMapping("/admin/gallery")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GalleryDto> createGallery(@Valid @RequestBody GalleryRequest request) {
        GalleryDto created = galleryService.createGallery(request);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/admin/gallery/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GalleryDto> updateGallery(
            @PathVariable String id,
            @Valid @RequestBody GalleryRequest request
    ) {
        GalleryDto updated = galleryService.updateGallery(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/admin/gallery/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteGallery(@PathVariable String id) {
        galleryService.deleteGallery(id);
        return ResponseEntity.noContent().build();
    }
}