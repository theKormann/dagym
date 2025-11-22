package com.dagym.backend.api.services;

import com.dagym.backend.api.domain.dto.CreatePostRequest;
import com.dagym.backend.api.domain.dto.PostResponse;
import com.dagym.backend.api.domain.dto.UserResponse;
import com.dagym.backend.api.domain.models.Post;
import com.dagym.backend.api.domain.models.User;
import com.dagym.backend.api.repository.PostRepository;
import com.dagym.backend.api.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;

    @Transactional
    public PostResponse publicarPost(Long userId, String description, MultipartFile imageFile) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado com ID: " + userId));

        String photoFilename = null;
        if (imageFile != null && !imageFile.isEmpty()) {
            photoFilename = storageService.store(imageFile);
        }

        Post newPost = new Post();
        newPost.setUser(user);
        newPost.setDescription(description);
        newPost.setPhotoUrl(photoFilename); // 2. Salva o NOME do arquivo no banco

        Post savedPost = postRepository.save(newPost);
        return mapToPostResponse(savedPost);
    }

    @Transactional(readOnly = true)
    public List<PostResponse> getAllPosts() {
        List<Post> posts = postRepository.findAllWithUserOrderByPublicationDateDesc();

        return posts.stream()
                .map(this::mapToPostResponse)
                .collect(Collectors.toList());
    }

    private PostResponse mapToPostResponse(Post post) {
        User user = post.getUser();

        UserResponse author = new UserResponse(
                user.getId(),
                user.getNome(),
                user.getUsername(),
                user.getAvatarUrl()
        );

        return new PostResponse(
                post.getId(),
                post.getDescription(),
                post.getPhotoUrl(),
                post.getPublicationDate(),
                author,
                post.getLikes().size(),
                post.getComments().size()
        );
    }
}