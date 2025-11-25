package com.dagym.backend.api.repository;

import com.dagym.backend.api.domain.models.Story;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StoryRepository extends JpaRepository<Story, Long> {
    List<Story> findByUserIdAndExpiresAtAfterOrderByCreatedAtAsc(Long userId, LocalDateTime now);
}