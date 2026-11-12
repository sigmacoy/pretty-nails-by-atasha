package com.prettynails.service;

import com.prettynails.dto.AvailabilityDtos.*;
import com.prettynails.entity.Availability;
import com.prettynails.exception.ResourceNotFoundException;
import com.prettynails.repository.AvailabilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
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

    /**
     * Get available time slots for a specific date
     */
    public List<AvailabilitySlotDto> getAvailableSlots(LocalDate date) {
        LocalDateTime dateTime = date.atStartOfDay();
        Optional<Availability> availability = availabilityRepository.findByDate(dateTime);

        if (availability.isEmpty() || !availability.get().getIsAvailable()) {
            return List.of();
        }

        Availability avail = availability.get();
        List<AvailabilitySlotDto> slots = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm");

        // Parse start and end times
        LocalTime startTime = LocalTime.parse(avail.getStartTime());
        LocalTime endTime = LocalTime.parse(avail.getEndTime());
        LocalDateTime slotStart = date.atTime(startTime);
        LocalDateTime slotEnd = date.atTime(endTime);

        // Generate 30-minute slots
        int slotDurationMinutes = 30;
        int maxSlots = avail.getMaxSlots();
        int slotCount = 0;

        while (slotStart.plusMinutes(slotDurationMinutes).isBefore(slotEnd.plusMinutes(1))) {
            if (slotCount >= maxSlots) break;

            slots.add(AvailabilitySlotDto.builder()
                    .startTime(slotStart.format(formatter))
                    .endTime(slotStart.plusMinutes(slotDurationMinutes).format(formatter))
                    .available(true)
                    .build());

            slotStart = slotStart.plusMinutes(slotDurationMinutes);
            slotCount++;
        }

        return slots;
    }

    /**
     * Get staff schedule (placeholder - returns all availabilities since no staff concept yet)
     */
    public List<AvailabilityDto> getStaffSchedule(String staffId) {
        // Since there's no staff concept in the entity yet, return all available dates
        // In the future, this would filter by staffId
        return availabilityRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public AvailabilityDto createAvailability(AvailabilityRequest request) {
        Availability availability = Availability.builder()
                .date(request.getDate())
                .isAvailable(request.getIsAvailable())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .maxSlots(request.getMaxSlots())
                .note(request.getNote())
                .build();

        availability = availabilityRepository.save(availability);
        return mapToDto(availability);
    }

    @Transactional
    public AvailabilityDto updateAvailability(String id, AvailabilityRequest request) {
        Availability availability = availabilityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Availability", "id", id));

        availability.setDate(request.getDate());
        availability.setIsAvailable(request.getIsAvailable());
        availability.setStartTime(request.getStartTime());
        availability.setEndTime(request.getEndTime());
        availability.setMaxSlots(request.getMaxSlots());
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