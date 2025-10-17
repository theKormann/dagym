package com.dagym.backend.api.controller;

import com.dagym.backend.api.domain.models.User;
import com.dagym.backend.api.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody User user) {
        return ResponseEntity.ok(userService.register(user));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody User user) {
        boolean success = userService.login(user.getEmail(), user.getPassword());
        if (success) {
            Map<String, String> response = new HashMap<>();
            response.put("token", "fake-token");
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.status(401).body(Map.of("error", "Dados incorretos!"));
    }


    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        return userService.getUser(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User updatedUser) {
        return ResponseEntity.ok(userService.updateUser(id, updatedUser));
    }

    /**
     * Novo endpoint para completar o perfil do usuário.
     * Exemplo de JSON para o corpo da requisição:
     * {
     * "description": "Entusiasta de musculação",
     * "weight": 85.5,
     * "height": 1.80,
     * "diet": "Rica em proteínas",
     * "workout": "5x por semana, foco em hipertrofia"
     * }
     * @param id O ID do usuário vindo da URL.
     * @param profileData Os dados do perfil vindos do corpo da requisição.
     * @return Uma ResponseEntity com o usuário atualizado ou um status 404 se não for encontrado.
     */
    @PutMapping("/{id}/profile")
    public ResponseEntity<User> completeProfile(@PathVariable Long id, @RequestBody User profileData) {
        try {
            User updatedUser = userService.completeProfile(id, profileData);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            // Se o usuário não for encontrado no serviço, retorna 404 Not Found.
            return ResponseEntity.notFound().build();
        }
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
