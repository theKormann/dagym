package com.dagym.backend.api.controller;

import com.dagym.backend.api.domain.models.Challenge;
import com.dagym.backend.api.domain.models.User;
import com.dagym.backend.api.domain.models.UserChallenge;
import com.dagym.backend.api.repository.ChallengeRepository;
import com.dagym.backend.api.repository.UserChallengeRepository;
import com.dagym.backend.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/challenges")
@RequiredArgsConstructor
public class ChallengeController {

    private final ChallengeRepository challengeRepository;
    private final UserChallengeRepository userChallengeRepository;
    private final UserRepository userRepository;

    @GetMapping
    public List<Challenge> getAllChallenges() {
        return challengeRepository.findAll();
    }

    @GetMapping("/user/{userId}")
    public List<UserChallenge> getUserChallenges(@PathVariable Long userId) {
        return userChallengeRepository.findByUserId(userId);
    }

    @PostMapping
    public Challenge createChallenge(@RequestBody Challenge challenge) {
        return challengeRepository.save(challenge);
    }

    @PostMapping("/{challengeId}/accept/{userId}")
    public ResponseEntity<?> acceptChallenge(@PathVariable Long challengeId, @PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        Challenge challenge = challengeRepository.findById(challengeId)
                .orElseThrow(() -> new RuntimeException("Desafio não encontrado"));

        if (userChallengeRepository.existsByUserIdAndChallengeId(userId, challengeId)) {
            return ResponseEntity.badRequest().body("Você já participa deste desafio.");
        }

        UserChallenge uc = new UserChallenge();
        uc.setUser(user);
        uc.setChallenge(challenge);
        uc.setStatus("active");
        uc.setProgress(0);

        // Incrementa contador
        challenge.setParticipantsCount(challenge.getParticipantsCount() + 1);
        challengeRepository.save(challenge);

        return ResponseEntity.ok(userChallengeRepository.save(uc));
    }

    @PutMapping("/{userChallengeId}/progress")
    public ResponseEntity<UserChallenge> updateProgress(@PathVariable Long userChallengeId) {
        UserChallenge uc = userChallengeRepository.findById(userChallengeId).orElseThrow();

        if (uc.getProgress() < uc.getChallenge().getTotalTarget()) {
            uc.setProgress(uc.getProgress() + 1);
        }

        if (uc.getProgress() >= uc.getChallenge().getTotalTarget()) {
            uc.setStatus("completed");
        }

        return ResponseEntity.ok(userChallengeRepository.save(uc));
    }
}