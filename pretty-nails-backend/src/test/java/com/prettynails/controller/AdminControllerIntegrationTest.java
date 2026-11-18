package com.prettynails.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.prettynails.dto.AdminDtos.*;
import com.prettynails.entity.User;
import com.prettynails.IntegrationTestBase;
import com.prettynails.repository.UserRepository;
import com.prettynails.security.JwtUtil;
import com.prettynails.service.AdminService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(locations = "classpath:application-test.yml")
@Transactional
class AdminControllerIntegrationTest extends IntegrationTestBase {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private AdminService adminService;

    private User adminUser;
    private User customerUser;
    private String adminToken;
    private String customerToken;

    @BeforeEach
    void setUp() {
        // Create admin user
        adminUser = User.builder()
                .name("Admin User")
                .email("admin@example.com")
                .phone("1111111111")
                .password(passwordEncoder.encode("admin123"))
                .role("ADMIN")
                .emailVerified(LocalDateTime.now())
                .build();
        adminUser = userRepository.save(adminUser);

        // Create customer user
        customerUser = User.builder()
                .name("Customer User")
                .email("customer@example.com")
                .phone("2222222222")
                .password(passwordEncoder.encode("customer123"))
                .role("CUSTOMER")
                .emailVerified(LocalDateTime.now())
                .build();
        customerUser = userRepository.save(customerUser);

        // Generate tokens
        adminToken = jwtUtil.generateToken(adminUser);
        customerToken = jwtUtil.generateToken(customerUser);
    }

    @Test
    void getDashboardStats_whenAdmin_shouldReturnStats() throws Exception {
        // Given
        AdminStatsDto mockStats = AdminStatsDto.builder()
                .totalCustomers(10L)
                .totalBookings(50L)
                .totalRevenue(5000000L)
                .pendingBookings(5L)
                .completedThisMonth(25L)
                .loyaltyActive(0L)
                .build();

        when(adminService.getDashboardStats()).thenReturn(mockStats);

        // When/Then
        mockMvc.perform(get("/api/admin/stats")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCustomers").value(10))
                .andExpect(jsonPath("$.totalBookings").value(50))
                .andExpect(jsonPath("$.totalRevenue").value(5000000));

        verify(adminService).getDashboardStats();
    }

    @Test
    void getDashboardStats_whenCustomer_shouldReturnForbidden() throws Exception {
        // When/Then
        mockMvc.perform(get("/api/admin/stats")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        verify(adminService, never()).getDashboardStats();
    }

    @Test
    void getDashboardStats_whenNotAuthenticated_shouldReturnUnauthorized() throws Exception {
        // When/Then
        mockMvc.perform(get("/api/admin/stats"))
                .andExpect(status().isUnauthorized());

        verify(adminService, never()).getDashboardStats();
    }

    @Test
    void getReports_whenAdmin_shouldReturnReports() throws Exception {
        // Given
        AdminReportsDto mockReports = AdminReportsDto.builder()
                .period("month")
                .revenue(1000000L)
                .bookingsCount(20L)
                .topServices(List.of())
                .build();

        when(adminService.getReports(anyString())).thenReturn(mockReports);

        // When/Then
        mockMvc.perform(get("/api/admin/reports")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("period", "month"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.period").value("month"))
                .andExpect(jsonPath("$.revenue").value(1000000));

        verify(adminService).getReports("month");
    }

    @Test
    void getReports_whenCustomer_shouldReturnForbidden() throws Exception {
        // When/Then
        mockMvc.perform(get("/api/admin/reports")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        verify(adminService, never()).getReports(anyString());
    }

    @Test
    void getLoyaltySettings_whenAdmin_shouldReturnSettings() throws Exception {
        // Given
        LoyaltySettingsDto mockSettings = LoyaltySettingsDto.builder()
                .stampsPerService(1)
                .stampsPerAmount(1)
                .amountThreshold(50000)
                .cardExpiryMonths(12)
                .freeServiceReward("Free Gel Manicure")
                .build();

        when(adminService.getLoyaltySettings()).thenReturn(mockSettings);

        // When/Then
        mockMvc.perform(get("/api/admin/settings")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stampsPerService").value(1))
                .andExpect(jsonPath("$.cardExpiryMonths").value(12));

        verify(adminService).getLoyaltySettings();
    }

    @Test
    void updateLoyaltySettings_whenAdmin_shouldReturnUpdatedSettings() throws Exception {
        // Given
        LoyaltySettingsDto request = LoyaltySettingsDto.builder()
                .stampsPerService(1)
                .stampsPerAmount(1)
                .amountThreshold(100000)
                .cardExpiryMonths(6)
                .freeServiceReward("Free Service")
                .build();

        LoyaltySettingsDto mockResponse = LoyaltySettingsDto.builder()
                .stampsPerService(1)
                .stampsPerAmount(1)
                .amountThreshold(100000)
                .cardExpiryMonths(6)
                .freeServiceReward("Free Service")
                .build();

        when(adminService.updateLoyaltySettings(any(LoyaltySettingsDto.class))).thenReturn(mockResponse);

        // When/Then
        mockMvc.perform(post("/api/admin/settings")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stampsPerService").value(1))
                .andExpect(jsonPath("$.cardExpiryMonths").value(6));

        verify(adminService).updateLoyaltySettings(any(LoyaltySettingsDto.class));
    }

    @Test
    void updateLoyaltySettings_whenCustomer_shouldReturnForbidden() throws Exception {
        // Given
        LoyaltySettingsDto request = LoyaltySettingsDto.builder()
                .stampsPerService(1)
                .stampsPerAmount(1)
                .amountThreshold(100000)
                .cardExpiryMonths(6)
                .freeServiceReward("Free Service")
                .build();

        // When/Then
        mockMvc.perform(post("/api/admin/settings")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        verify(adminService, never()).updateLoyaltySettings(any(LoyaltySettingsDto.class));
    }

    @Test
    void getCustomers_whenAdmin_shouldReturnCustomersPage() throws Exception {
        // Given
        CustomerListDto customerDto = CustomerListDto.builder()
                .id(customerUser.getId())
                .name("Customer User")
                .email("customer@example.com")
                .phone("2222222222")
                .role("CUSTOMER")
                .build();

        Page<CustomerListDto> mockPage = new PageImpl<>(List.of(customerDto), PageRequest.of(0, 20), 1);

        when(adminService.getCustomers(anyString(), any())).thenReturn(mockPage);

        // When/Then
        mockMvc.perform(get("/api/admin/customers")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].email").value("customer@example.com"))
                .andExpect(jsonPath("$.totalElements").value(1));

        verify(adminService).getCustomers(anyString(), any());
    }

    @Test
    void getCustomers_whenCustomer_shouldReturnForbidden() throws Exception {
        // When/Then
        mockMvc.perform(get("/api/admin/customers")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        verify(adminService, never()).getCustomers(anyString(), any());
    }

    @Test
    void addCustomerNote_whenAdmin_shouldReturnNote() throws Exception {
        // Given
        CustomerNoteRequest request = CustomerNoteRequest.builder()
                .content("Customer prefers morning appointments")
                .build();

        CustomerNoteDto mockNote = CustomerNoteDto.builder()
                .id("note-123")
                .userId(customerUser.getId())
                .content("Customer prefers morning appointments")
                .adminId(adminUser.getId())
                .nickname("Admin User")
                .build();

        when(adminService.addCustomerNote(anyString(), anyString(), anyString())).thenReturn(mockNote);

        // When/Then
        mockMvc.perform(post("/api/admin/customers/" + customerUser.getId() + "/notes")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("note-123"))
                .andExpect(jsonPath("$.content").value("Customer prefers morning appointments"));

        verify(adminService).addCustomerNote(eq(customerUser.getId()), eq("Customer prefers morning appointments"), eq(adminUser.getId()));
    }

    @Test
    void addCustomerNote_whenCustomer_shouldReturnForbidden() throws Exception {
        // Given
        CustomerNoteRequest request = CustomerNoteRequest.builder()
                .content("Customer prefers morning appointments")
                .build();

        // When/Then
        mockMvc.perform(post("/api/admin/customers/" + customerUser.getId() + "/notes")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        verify(adminService, never()).addCustomerNote(anyString(), anyString(), anyString());
    }

    @Test
    void updateCustomerNote_whenAdmin_shouldReturnUpdatedNote() throws Exception {
        // Given
        CustomerNoteRequest request = CustomerNoteRequest.builder()
                .content("Updated note content")
                .build();

        CustomerNoteDto mockNote = CustomerNoteDto.builder()
                .id("note-123")
                .userId(customerUser.getId())
                .content("Updated note content")
                .adminId(adminUser.getId())
                .nickname("Admin User")
                .build();

        when(adminService.updateCustomerNote(anyString(), anyString(), anyString())).thenReturn(mockNote);

        // When/Then
        mockMvc.perform(put("/api/admin/customers/notes/note-123")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("note-123"))
                .andExpect(jsonPath("$.content").value("Updated note content"));

        verify(adminService).updateCustomerNote(eq("note-123"), eq("Updated note content"), eq(adminUser.getId()));
    }

    @Test
    void deleteCustomerNote_whenAdmin_shouldReturnNoContent() throws Exception {
        // Given
        doNothing().when(adminService).deleteCustomerNote(anyString(), anyString());

        // When/Then
        mockMvc.perform(delete("/api/admin/customers/notes/note-123")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        verify(adminService).deleteCustomerNote(eq("note-123"), eq(adminUser.getId()));
    }

    @Test
    void deleteCustomerNote_whenCustomer_shouldReturnForbidden() throws Exception {
        // When/Then
        mockMvc.perform(delete("/api/admin/customers/notes/note-123")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        verify(adminService, never()).deleteCustomerNote(anyString(), anyString());
    }
}