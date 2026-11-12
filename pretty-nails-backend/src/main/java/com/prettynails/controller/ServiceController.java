package com.prettynails.controller;

import com.prettynails.dto.ServiceDtos.ServiceDto;
import com.prettynails.dto.ServiceDtos.ServiceRequest;
import com.prettynails.dto.ServiceDtos.ServiceVariantDto;
import com.prettynails.service.ServiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ServiceController {

    private final ServiceService serviceService;

    @GetMapping("/services")
    public ResponseEntity<List<ServiceDto>> getActiveServices() {
        return ResponseEntity.ok(serviceService.getActiveServices());
    }

    @GetMapping("/services/category/{category}")
    public ResponseEntity<List<ServiceDto>> getActiveServicesByCategory(@PathVariable String category) {
        return ResponseEntity.ok(serviceService.getActiveServicesByCategory(category));
    }

    @GetMapping("/services/{id}")
    public ResponseEntity<ServiceDto> getServiceById(@PathVariable String id) {
        return ResponseEntity.ok(serviceService.getServiceById(id));
    }

    @GetMapping("/services/{id}/variants")
    public ResponseEntity<List<ServiceVariantDto>> getServiceVariants(@PathVariable String id) {
        return ResponseEntity.ok(serviceService.getServiceVariants(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/services")
    public ResponseEntity<List<ServiceDto>> getAllServices() {
        return ResponseEntity.ok(serviceService.getAllServices());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/services")
    public ResponseEntity<ServiceDto> createService(@Valid @RequestBody ServiceRequest request) {
        return ResponseEntity.ok(serviceService.createService(request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/services/{id}")
    public ResponseEntity<ServiceDto> updateService(
            @PathVariable String id,
            @Valid @RequestBody ServiceRequest request) {
        return ResponseEntity.ok(serviceService.updateService(id, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/admin/services/{id}")
    public ResponseEntity<Void> deleteService(@PathVariable String id) {
        serviceService.deleteService(id);
        return ResponseEntity.noContent().build();
    }
}