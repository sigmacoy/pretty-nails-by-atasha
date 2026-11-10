package com.prettynails.controller;

import com.prettynails.dto.AvailabilityDtos.*;
import com.prettynails.service.AvailabilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    @GetMapping("/availability")
    public List<AvailabilityDto> getAvailableDates() {
        return availabilityService.getAvailableDates();
    }
}