package com.dagym.backend.api.services;

import com.dagym.backend.api.domain.dto.CommentResponse;
import com.dagym.backend.api.domain.dto.PostResponse;
import com.dagym.backend.api.domain.dto.UserResponse;
import com.dagym.backend.api.domain.models.*;
import com.dagym.backend.api.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final LikeRepository likeRepository;
    private final CommentRepository commentRepository;
    private final StorageService storageService;
    private final GroupRepository groupRepository;

    /**
     * Retorna o feed de posts.
     * @param currentUserId ID do usuário logado (pode ser nulo se for visitante).
     * @param type Tipo de feed: "general" ou "following".
     */
    @Transactional(readOnly = true)
    public List<PostResponse> getFeed(Long currentUserId, String type) {
        List<Post> posts;
        User currentUser = null;

        // Se tiver um ID logado, buscamos o objeto User para verificar os likes depois
        if (currentUserId != null) {
            currentUser = userRepository.findById(currentUserId).orElse(null);
        }

        if ("following".equalsIgnoreCase(type) && currentUserId != null) {
            posts = getPersonalizedFeedPosts(currentUserId);
        } else {
            posts = postRepository.findAllWithUserOrderByPublicationDateDesc();
        }

        // Variável final efetiva para usar dentro do stream
        final User finalCurrentUser = currentUser;

        return posts.stream()
                .map(post -> mapToPostResponse(post, finalCurrentUser))
                .collect(Collectors.toList());
    }

    private List<Post> getPersonalizedFeedPosts(Long userId) {
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        Set<Long> feedUserIds = new HashSet<>();

        // 1. Posts do próprio usuário
        feedUserIds.add(userId);

        // 2. Posts de quem ele segue
        currentUser.getFollowing().forEach(u -> feedUserIds.add(u.getId()));

        // 3. Posts de membros das comunidades que ele participa
        List<CommunityGroup> userGroups = groupRepository.findAllByMemberId(userId);
        for (CommunityGroup group : userGroups) {
            group.getMembers().forEach(member -> feedUserIds.add(member.getId()));
        }

        return postRepository.findByUserIdsInOrderByPublicationDateDesc(new ArrayList<>(feedUserIds));
    }

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
        newPost.setPhotoUrl(photoFilename);

        // Inicializa listas vazias para evitar NullPointerException no retorno imediato
        newPost.setLikes(new HashSet<>());
        newPost.setComments(new ArrayList<>());

        Post savedPost = postRepository.save(newPost);
        return mapToPostResponse(savedPost, user);
    }

    /**
     * Alterna o like (Se já curtiu, remove. Se não, adiciona).
     */
    @Transactional
    public void toggleLike(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post não encontrado"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        Optional<Like> existingLike = likeRepository.findByPostAndUser(post, user);

        if (existingLike.isPresent()) {
            likeRepository.delete(existingLike.get());
        } else {
            Like newLike = new Like();
            newLike.setPost(post);
            newLike.setUser(user);
            likeRepository.save(newLike);
        }
    }

    @Transactional
    public CommentResponse addComment(Long postId, Long userId, String text) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post não encontrado"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        Comment comment = new Comment();
        comment.setPost(post);
        comment.setUser(user);
        comment.setText(text);

        Comment savedComment = commentRepository.save(comment);

        // Retorna o DTO do comentário criado para adicionar na lista do frontend
        return new CommentResponse(
                savedComment.getId(),
                savedComment.getText(),
                savedComment.getTimestamp(),
                new UserResponse(user.getId(), user.getNome(), user.getUsername(), user.getAvatarUrl())
        );
    }

    // --- MÉTODOS AUXILIARES ---

    @Transactional
    public PostResponse repost(Long userId, Long originalPostId, String quote) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        Post originalPost = postRepository.findById(originalPostId)
                .orElseThrow(() -> new EntityNotFoundException("Post original não encontrado"));

        // Regra opcional: Se eu repostar um repost, aponto para o original "raiz"
        // para evitar cadeias longas, ou mantenho a cadeia. Aqui mantemos o imediato.
        Post postToBeReferenced = originalPost;
        if (originalPost.getOriginalPost() != null) {
            // Se quiser apontar sempre para a raiz:
            // postToBeReferenced = originalPost.getOriginalPost();
        }

        Post newRepost = new Post();
        newRepost.setUser(user);
        newRepost.setDescription(quote); // Pode ser nulo se for apenas um share simples
        newRepost.setOriginalPost(postToBeReferenced);
        newRepost.setLikes(new HashSet<>());
        newRepost.setComments(new ArrayList<>());

        Post savedPost = postRepository.save(newRepost);
        return mapToPostResponse(savedPost, user);
    }

    @Transactional
    public void deletePost(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post não encontrado"));

        if (!post.getUser().getId().equals(userId)) {
            throw new RuntimeException("Usuário não tem permissão para deletar este post");
        }

        postRepository.delete(post);
    }

    private PostResponse mapToPostResponse(Post post, User currentUser) {
        User user = post.getUser();

        UserResponse author = new UserResponse(
                user.getId(),
                user.getNome(),
                user.getUsername(),
                user.getAvatarUrl()
        );

        boolean isLiked = false;
        if (currentUser != null) {
            isLiked = likeRepository.existsByPostAndUser(post, currentUser);
        }

        List<CommentResponse> comments = new ArrayList<>();
        if (post.getComments() != null) {
            comments = post.getComments().stream()
                    .map(c -> new CommentResponse(
                            c.getId(),
                            c.getText(),
                            c.getTimestamp(),
                            new UserResponse(c.getUser().getId(), c.getUser().getNome(), c.getUser().getUsername(), c.getUser().getAvatarUrl())
                    ))
                    .sorted(Comparator.comparing(CommentResponse::getTimestamp))
                    .collect(Collectors.toList());
        }

        PostResponse originalPostResponse = null;
        if (post.getOriginalPost() != null) {
            originalPostResponse = mapToPostResponse(post.getOriginalPost(), currentUser);
        }

        return new PostResponse(
                post.getId(),
                post.getDescription(),
                post.getPhotoUrl(),
                post.getPublicationDate(),
                author,
                post.getLikes() != null ? post.getLikes().size() : 0,
                post.getComments() != null ? post.getComments().size() : 0,
                isLiked,
                comments,
                originalPostResponse
        );
    }
}