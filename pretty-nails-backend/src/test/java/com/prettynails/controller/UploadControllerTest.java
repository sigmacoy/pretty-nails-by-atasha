package com.prettynails.controller;

import com.prettynails.dto.UploadDtos.UploadResponse;
import com.prettynails.exception.BadRequestException;
import com.prettynails.exception.GlobalExceptionHandler;
import com.prettynails.service.FileStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class UploadControllerTest {

    private MockMvc mockMvc;

    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private UploadController uploadController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(uploadController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void uploadFile_whenValid_shouldReturnOkAndResponse() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.png",
                "image/png",
                "some-image-data".getBytes()
        );

        UploadResponse mockResponse = UploadResponse.builder()
                .url("http://localhost:8080/uploads/uuid-test.png")
                .filename("uuid-test.png")
                .size(15L)
                .build();

        when(fileStorageService.storeFile(any())).thenReturn(mockResponse);

        mockMvc.perform(multipart("/api/upload").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value("http://localhost:8080/uploads/uuid-test.png"))
                .andExpect(jsonPath("$.filename").value("uuid-test.png"))
                .andExpect(jsonPath("$.size").value(15));
    }

    @Test
    void uploadFile_whenServiceThrowsBadRequest_shouldReturnBadRequestStatus() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "bad.txt",
                "text/plain",
                "bad-data".getBytes()
        );

        when(fileStorageService.storeFile(any()))
                .thenThrow(new BadRequestException("Invalid file type"));

        mockMvc.perform(multipart("/api/upload").file(file))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid file type"));
    }
}
