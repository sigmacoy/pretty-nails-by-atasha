package com.prettynails.repository;

import com.prettynails.entity.Booking;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class BookingSpecification {

    public static Specification<Booking> adminBookings(LocalDate date, LocalDate start, LocalDate end,
                                                        String status, List<String> statusList, String search) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Date filter
            if (date != null) {
                predicates.add(criteriaBuilder.equal(root.get("appointmentDate"), date));
            }

            // Date range filter
            if (start != null && end != null) {
                predicates.add(criteriaBuilder.between(root.get("appointmentDate"), start, end));
            }

            // Status filter
            if (status != null && !"ALL".equalsIgnoreCase(status)) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            } else if (statusList != null && !statusList.isEmpty()) {
                predicates.add(root.get("status").in(statusList));
            }

            // Search filter (name or email)
            if (search != null && !search.trim().isEmpty()) {
                String searchPattern = "%" + search.toLowerCase() + "%";
                Join<Object, Object> userJoin = root.join("user", JoinType.LEFT);
                Predicate namePredicate = criteriaBuilder.like(criteriaBuilder.lower(userJoin.get("name")), searchPattern);
                Predicate emailPredicate = criteriaBuilder.like(criteriaBuilder.lower(userJoin.get("email")), searchPattern);
                predicates.add(criteriaBuilder.or(namePredicate, emailPredicate));
            }

            // Default ordering
            query.orderBy(
                    criteriaBuilder.desc(root.get("appointmentDate")),
                    criteriaBuilder.desc(root.get("startTime")),
                    criteriaBuilder.desc(root.get("createdAt"))
            );

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}