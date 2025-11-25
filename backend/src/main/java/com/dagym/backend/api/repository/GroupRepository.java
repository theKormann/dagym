package com.dagym.backend.api.repository;

import com.dagym.backend.api.domain.models.CommunityGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupRepository extends JpaRepository<CommunityGroup, Long> {
    @Query("SELECT g FROM CommunityGroup g JOIN g.members m WHERE m.id = :userId")
    List<CommunityGroup> findAllByMemberId(Long userId);

    List<CommunityGroup> findByNameContainingIgnoreCaseOrCategoryContainingIgnoreCase(String name, String category);
}