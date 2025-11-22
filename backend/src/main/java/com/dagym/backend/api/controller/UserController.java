package com.dagym.backend.api.controller;

import com.dagym.backend.api.domain.dto.UserSearchDTO;
import com.dagym.backend.api.domain.models.User;
import com.dagym.backend.api.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/users") // Novo endpoint base
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserSearchDTO>> getSuggestions() {
        List<UserSearchDTO> suggestions = userService.getSuggestedUsers();
        return ResponseEntity.ok(suggestions);
    }

    @PostMapping("/{id}/avatar")
    public ResponseEntity<User> uploadAvatar(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        User updatedUser = userService.updateAvatar(id, file);
        return ResponseEntity.ok(updatedUser);
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserSearchDTO>> searchUsers(@RequestParam("q") String query) {
        List<UserSearchDTO> results = userService.searchUsers(query);
        return ResponseEntity.ok(results);
    }
}