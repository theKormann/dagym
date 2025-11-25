package com.dagym.backend.api.controller;

import com.dagym.backend.api.domain.dto.RegisterRequestDTO;
import com.dagym.backend.api.domain.models.User;
import com.dagym.backend.api.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// ATUALIZAÇÃO: Importar o @Data do Lombok
import lombok.Data;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @Data
    static class LoginRequest {
        private String email;
        private String password;
    }

    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody RegisterRequestDTO request) {
        // Convert DTO to Entity manually or using a mapper
        User user = new User();
        user.setNome(request.getNome());
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());

        return ResponseEntity.ok(userService.register(user));
    }

    @PostMapping("/login")
    public ResponseEntity<User> login(@RequestBody LoginRequest loginRequest) {
        Optional<User> userOptional = userService.login(loginRequest.getEmail(), loginRequest.getPassword());

        return userOptional
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(401).build());
    }


    @PutMapping("/{id}")
    public ResponseEntity<User> updateUserCredentials(@PathVariable Long id, @RequestBody User updatedUser) {
        return ResponseEntity.ok(userService.updateUser(id, updatedUser));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}