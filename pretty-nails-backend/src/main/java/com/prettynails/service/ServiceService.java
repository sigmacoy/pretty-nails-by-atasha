package com.prettynails.service;

import com.prettynails.dto.ServiceDtos.*;
import com.prettynails.entity.ServiceVariant;
import com.prettynails.exception.ResourceNotFoundException;
import com.prettynails.repository.ServiceRepository;
import com.prettynails.repository.ServiceVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiceService {

    private final ServiceRepository serviceRepository;
    private final ServiceVariantRepository variantRepository;

    public List<ServiceDto> getAllServices() {
        return serviceRepository.findAll().stream()
                .map(this::mapToServiceDto)
                .collect(Collectors.toList());
    }

    public List<ServiceDto> getActiveServices() {
        return serviceRepository.findByIsActiveTrueOrderByCreatedAtDesc().stream()
                .map(this::mapToServiceDto)
                .collect(Collectors.toList());
    }

    public List<ServiceDto> getActiveServicesByCategory(String category) {
        return serviceRepository.findByIsActiveTrueAndCategoryOrderByCreatedAtDesc(category).stream()
                .map(this::mapToServiceDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ServiceDto createService(ServiceRequest request) {
        com.prettynails.entity.Service service = com.prettynails.entity.Service.builder()
                .name(request.getName())
                .category(request.getCategory())
                .description(request.getDescription())
                .basePrice(request.getBasePrice())
                .duration(request.getDuration())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        service = serviceRepository.save(service);

        if (request.getVariants() != null && !request.getVariants().isEmpty()) {
            for (ServiceVariantRequest vr : request.getVariants()) {
                ServiceVariant variant = ServiceVariant.builder()
                        .serviceId(service.getId())
                        .name(vr.getName())
                        .price(vr.getPrice())
                        .build();
                variantRepository.save(variant);
            }
        }

        return mapToServiceDto(serviceRepository.findById(service.getId()).orElseThrow());
    }

    @Transactional
    public ServiceDto updateService(String id, ServiceRequest request) {
        com.prettynails.entity.Service service = serviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service", "id", id));

        service.setName(request.getName());
        service.setCategory(request.getCategory());
        service.setDescription(request.getDescription());
        service.setBasePrice(request.getBasePrice());
        service.setDuration(request.getDuration());
        service.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);

        service = serviceRepository.save(service);

        // Update variants - delete existing and recreate
        if (request.getVariants() != null) {
            variantRepository.deleteByServiceId(id);
            for (ServiceVariantRequest vr : request.getVariants()) {
                ServiceVariant variant = ServiceVariant.builder()
                        .serviceId(service.getId())
                        .name(vr.getName())
                        .price(vr.getPrice())
                        .build();
                variantRepository.save(variant);
            }
        }

        return mapToServiceDto(serviceRepository.findById(id).orElseThrow());
    }

    @Transactional
    public void deleteService(String id) {
        com.prettynails.entity.Service service = serviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service", "id", id));
        variantRepository.deleteByServiceId(id);
        serviceRepository.delete(service);
    }

    private ServiceDto mapToServiceDto(com.prettynails.entity.Service entity) {
        List<ServiceVariantDto> variantDtos = entity.getVariants().stream()
                .map(v -> ServiceVariantDto.builder()
                        .id(v.getId())
                        .serviceId(v.getServiceId())
                        .name(v.getName())
                        .price(v.getPrice())
                        .build())
                .collect(Collectors.toList());

        return ServiceDto.builder()
                .id(entity.getId())
                .name(entity.getName())
                .category(entity.getCategory())
                .description(entity.getDescription())
                .basePrice(entity.getBasePrice())
                .duration(entity.getDuration())
                .isActive(entity.getIsActive())
                .variants(variantDtos)
                .build();
    }
}