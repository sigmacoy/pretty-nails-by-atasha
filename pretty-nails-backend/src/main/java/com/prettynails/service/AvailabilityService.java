package com.prettynails.service;

import com.prettynails.dto.AvailabilityDtos.*;
import com.prettynails.entity.Availability;
import com.prettynails.repository.AvailabilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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