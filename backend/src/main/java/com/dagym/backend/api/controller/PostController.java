package com.dagym.backend.api.controller;

import com.dagym.backend.api.domain.dto.CommentResponse;
import com.dagym.backend.api.domain.dto.PostResponse;
import com.dagym.backend.api.services.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000") // Ajuste conforme sua porta do frontend
public class PostController {

    private final PostService postService;

    @PostMapping("/{postId}/repost")
    public ResponseEntity<PostResponse> repost(
            @PathVariable Long postId,
            @RequestParam Long userId,
            @RequestBody(required = false) String quote // Texto opcional (Quote Repost)
    ) {
        if (quote != null && quote.startsWith("\"") && quote.endsWith("\"")) {
            quote = quote.substring(1, quote.length() - 1);
        }

        PostResponse response = postService.repost(userId, postId, quote);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/user/{userId}")
    public ResponseEntity<PostResponse> createPost(
            @PathVariable Long userId,
            @RequestParam("description") String description,
            @RequestParam(value = "imageFile", required = false) MultipartFile imageFile
    ) {
        PostResponse savedPost = postService.publicarPost(userId, description, imageFile);
        return new ResponseEntity<>(savedPost, HttpStatus.CREATED);
    }

    // Listar Posts (Feed)
    @GetMapping
    public ResponseEntity<List<PostResponse>> getAllPosts(
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "general") String type
    ) {
        List<PostResponse> posts = postService.getFeed(userId, type);
        return ResponseEntity.ok(posts);
    }

    @PostMapping("/{postId}/like")
    public ResponseEntity<Void> toggleLike(
            @PathVariable Long postId,
            @RequestParam Long userId
    ) {
        postService.toggleLike(postId, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{postId}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long postId,
            @RequestParam Long userId,
            @RequestBody String text
    ) {

        if (text.startsWith("\"") && text.endsWith("\"")) {
            text = text.substring(1, text.length() - 1);
        }

        CommentResponse response = postService.addComment(postId, userId, text);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deletePost(
            @PathVariable Long postId,
            @RequestParam Long userId
    ) {
        postService.deletePost(postId, userId);
        return ResponseEntity.noContent().build();
    }
}