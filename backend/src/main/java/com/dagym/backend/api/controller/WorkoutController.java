package com.dagym.backend.api.controller;

import com.dagym.backend.api.domain.models.User;
import com.dagym.backend.api.domain.dto.WorkoutDTO;
import com.dagym.backend.api.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/workout")
@RequiredArgsConstructor
public class WorkoutController {

    private final UserService userService;

    @GetMapping("/{userId}")
    public ResponseEntity<String> getUserWorkout(@PathVariable Long userId) {
        User user = userService.getUser(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado com id: " + userId));

        return ResponseEntity.ok(user.getWorkout());
    }

    @PutMapping("/{userId}")
    public ResponseEntity<User> updateUserWorkout(@PathVariable Long userId, @RequestBody WorkoutDTO workoutDto) {
        User user = userService.getUser(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado com id: " + userId));

        user.setWorkout(workoutDto.getWorkoutJson());

        User savedUser = userService.saveUser(user);

        return ResponseEntity.ok(savedUser);
    }
}