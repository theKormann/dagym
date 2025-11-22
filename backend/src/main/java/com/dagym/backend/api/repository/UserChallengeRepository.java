package com.dagym.backend.api.repository;

import com.dagym.backend.api.domain.models.UserChallenge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserChallengeRepository extends JpaRepository<UserChallenge, Long> {

    List<UserChallenge> findByUserId(Long userId);

    boolean existsByUserIdAndChallengeId(Long userId, Long challengeId);

    List<UserChallenge> findByUserIdAndStatus(Long userId, String status);
}