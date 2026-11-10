/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/pom.xml — Maven build configuration; dependencies, plugins, Java 17 target
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/.gitignore — Ignores target/, .idea/, *.iml, .DS_Store, .env, logs
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/mvnw — Unix Maven wrapper script
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/mvnw.cmd — Windows Maven wrapper script
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/.mvn/wrapper/maven-wrapper.properties — Maven wrapper configuration (distribution URL, wrapper URL)
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/resources/application.yml — Spring Boot config: datasource (Supabase), JPA, JWT, server port, CORS, logging
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/PrettyNailsApplication.java — Main Spring Boot entry point
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/config/ — Configuration classes (WebMvcConfig, SecurityConfig, etc.)
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/controller/ — REST controllers
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/dto/ — Data Transfer Objects (request/response)
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/entity/Account.java — OAuth2 account linking entity
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/entity/Availability.java — Availability scheduling entity
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/entity/Booking.java — Booking entity with status, appointments, pricing
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/entity/BookingService.java — Booking-Service join entity with variant/quantity/price
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/entity/CustomerNote.java — Admin notes on customers entity
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/entity/Gallery.java — Gallery image entity
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/entity/LoyaltyCard.java — Customer loyalty card entity
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/entity/LoyaltyStamp.java — Loyalty stamp earned entity
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/entity/Payment.java — Payment entity (GCash)
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/entity/Service.java — Service entity with variants, bookings
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/entity/ServiceVariant.java — Service variant entity (size/price)
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/entity/Session.java — Session token entity
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/entity/Setting.java — Application settings entity
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/entity/User.java — User entity implementing UserDetails
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/entity/VerificationToken.java — Email verification token entity
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/exception/ — Custom exceptions and global handler
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/exception/ResourceNotFoundException.java — RuntimeException for resource not found with resourceName, fieldName, fieldValue
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/exception/BadRequestException.java — RuntimeException for bad request with custom message
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/exception/ErrorResponse.java — DTO for error responses (timestamp, status, error, message, path)
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/exception/GlobalExceptionHandler.java — @ControllerAdvice handling ResourceNotFoundException (404), BadRequestException (400), MethodArgumentNotValidException (400), ConstraintViolationException (400), and fallback Exception (500)
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/repository/AccountRepository.java — OAuth2 account repository
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/repository/AvailabilityRepository.java — Availability scheduling repository
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/repository/BookingRepository.java — Booking repository with admin queries
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/repository/BookingServiceRepository.java — Booking-Service join repository
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/repository/CustomerNoteRepository.java — Customer note repository
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/repository/GalleryRepository.java — Gallery image repository
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/repository/LoyaltyCardRepository.java — Loyalty card repository
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/repository/LoyaltyStampRepository.java — Loyalty stamp repository
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/repository/PaymentRepository.java — Payment repository
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/repository/ServiceRepository.java — Service repository
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/repository/ServiceVariantRepository.java — Service variant repository
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/repository/SessionRepository.java — Session token repository
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/repository/SettingRepository.java — Application settings repository
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/repository/UserRepository.java — User repository with role/customer search
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/repository/VerificationTokenRepository.java — Email verification token repository
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/security/JwtUtil.java — JWT token generation, validation, and claims extraction
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/security/JwtAuthenticationFilter.java — OncePerRequestFilter for JWT auth, skips public endpoints (/api/auth/**, /api/availability, /api/gallery)
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/security/CustomUserDetailsService.java — UserDetailsService implementation loading User by email (case-insensitive)
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/security/SecurityConfig.java — Security filter chain, CORS, auth provider, password encoder, method security
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/service/ — Business logic services
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/dto/AuthDtos.java — Auth DTOs: RegisterRequest, LoginRequest, AuthResponse, UserDto
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/dto/AvailabilityDtos.java — Availability DTOs: AvailabilityDto, AvailabilityRequest
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/dto/ServiceDtos.java — Service DTOs: ServiceDto, ServiceVariantDto, ServiceRequest, ServiceVariantRequest
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/dto/GalleryDtos.java — Gallery DTOs: GalleryDto, GalleryRequest
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/dto/BookingDtos.java — Booking DTOs: BookingRequest, BookingServiceRequest, BookingResponse, BookingDto, BookingServiceDto, ServiceDto, ServiceVariantDto, PaymentDto, LoyaltyStampDto
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/controller/AuthController.java — Auth REST endpoints: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/controller/AvailabilityController.java — Public availability endpoint: GET /api/availability
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/controller/ServiceController.java — Public service endpoints: GET /api/services, GET /api/services/category/{category}; Admin endpoints: GET/POST/PUT/DELETE /api/admin/services
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/controller/GalleryController.java — Gallery REST endpoints: GET /api/gallery (public), GET/POST/PUT/DELETE /api/admin/gallery (admin)
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/controller/BookingController.java — Booking REST endpoints: POST /api/bookings (create), GET /api/bookings (user bookings)
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/service/AuthService.java — Auth business logic: register, login, getCurrentUser with JWT and loyalty card creation
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/service/AvailabilityService.java — Availability business logic: getAvailableDates mapping to DTO
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/service/ServiceService.java — Service business logic: getActiveServices, getActiveServicesByCategory, getAllServices, createService, updateService, deleteService
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/service/GalleryService.java — Gallery business logic: public/admin gallery retrieval, CRUD operations with DTO mapping
/Users/mccauleybacalla/SigMacoy/Code/IntelliJ/app-dev-capstone/pretty-nails-backend/src/main/java/com/prettynails/service/BookingService.java — Booking business logic: createBooking with availability/queue checks, service/variant resolution, payment record; getUserBookings