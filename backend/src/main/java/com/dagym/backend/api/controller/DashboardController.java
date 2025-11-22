package com.dagym.backend.api.controller;

import com.dagym.backend.api.domain.models.User;
import com.dagym.backend.api.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard") // Novo endpoint base para o dashboard
@RequiredArgsConstructor
public class DashboardController {

    private final UserService userService;

    /**
     * Busca os dados do perfil principal do usuário.
     */
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserProfile(@PathVariable Long id) {
        return userService.getUser(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Atualiza os dados de perfil do usuário (peso, altura, etc.).
     * Este é o endpoint PUT que o frontend do perfil usará.
     * Exemplo de JSON:
     * {
     * "description": "...",
     * "weight": 85.5,
     * "height": 1.80, // Note: Altura em metros
     * "diet": "...",
     * "workout": "..."
     * }
     */
    @PutMapping("/{id}/profile")
    public ResponseEntity<User> updateProfile(@PathVariable Long id, @RequestBody User profileData) {
        try {
            User updatedUser = userService.completeProfile(id, profileData);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

}