package com.prettynails.service;

import com.prettynails.dto.AvailabilityDtos.*;
import com.prettynails.entity.Availability;
import com.prettynails.exception.ResourceNotFoundException;
import com.prettynails.repository.AvailabilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AvailabilityService {

    private final AvailabilityRepository availabilityRepository;

    public List<AvailabilityDto> getAvailableDates() {
        LocalDateTime today = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        return availabilityRepository.findAvailableDatesFrom(today).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<AvailabilityDto> getAdminAvailabilities(LocalDateTime start, LocalDateTime end) {
        if (start != null && end != null) {
            return availabilityRepository.findByDateBetweenOrderByDateAsc(start, end).stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
        }
        return availabilityRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public AvailabilityDto upsertAvailability(AvailabilityRequest request) {
        LocalDateTime date = request.getDate().withHour(0).withMinute(0).withSecond(0).withNano(0);

        Availability availability = availabilityRepository.findByDate(date)
                .orElse(Availability.builder().date(date).build());

        availability.setIsAvailable(request.getIsAvailable());
        availability.setStartTime(request.getStartTime() != null ? request.getStartTime() : "08:00");
        availability.setEndTime(request.getEndTime() != null ? request.getEndTime() : "22:00");
        availability.setMaxSlots(request.getMaxSlots() != null ? request.getMaxSlots() : 4);
        availability.setNote(request.getNote());

        availability = availabilityRepository.save(availability);
        return mapToDto(availability);
    }

    @Transactional
    public void deleteAvailability(String id) {
        Availability availability = availabilityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Availability", "id", id));
        availabilityRepository.delete(availability);
    }

    private AvailabilityDto mapToDto(Availability a) {
        return AvailabilityDto.builder()
                .id(a.getId())
                .date(a.getDate())
                .isAvailable(a.getIsAvailable())
                .startTime(a.getStartTime())
                .endTime(a.getEndTime())
                .maxSlots(a.getMaxSlots())
                .note(a.getNote())
                .createdAt(a.getCreatedAt().toString())
                .updatedAt(a.getUpdatedAt() != null ? a.getUpdatedAt().toString() : null)
                .build();
    }
}