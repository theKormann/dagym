package com.dagym.backend.api.controller;

import com.dagym.backend.api.domain.dto.DietDTO;
import com.dagym.backend.api.domain.models.User;
import com.dagym.backend.api.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/diet")
@RequiredArgsConstructor
public class DietController {

    private final UserService userService;

    @GetMapping("/{userId}")
    public ResponseEntity<String> getUserDiet(@PathVariable Long userId) {
        User user = userService.getUser(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado: " + userId));

        return ResponseEntity.ok(user.getDiet());
    }

    @PutMapping("/{userId}")
    public ResponseEntity<User> updateUserDiet(@PathVariable Long userId, @RequestBody DietDTO dietDTO) {
        User user = userService.getUser(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado: " + userId));

        user.setDiet(dietDTO.getDietJson());

        User savedUser = userService.saveUser(user);
        return ResponseEntity.ok(savedUser);
    }
}