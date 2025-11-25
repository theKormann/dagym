package com.dagym.backend.api.controller;

import com.dagym.backend.api.domain.models.Story;
import com.dagym.backend.api.services.StoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/stories")
@RequiredArgsConstructor
public class StoryController {

    private final StoryService storyService;

    @PostMapping("/user/{userId}")
    public ResponseEntity<Story> createStory(@PathVariable Long userId, @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(storyService.createStory(userId, file));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Story>> getUserStories(@PathVariable Long userId) {
        return ResponseEntity.ok(storyService.getActiveStories(userId));
    }

    @DeleteMapping("/{storyId}")
    public ResponseEntity<Void> deleteStory(@PathVariable Long storyId, @RequestParam Long userId) {
        storyService.deleteStory(storyId, userId);
        return ResponseEntity.noContent().build();
    }
}