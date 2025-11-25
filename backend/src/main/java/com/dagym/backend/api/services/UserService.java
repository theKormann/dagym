package com.dagym.backend.api.services;

import com.dagym.backend.api.domain.dto.UserProfileDTO;
import com.dagym.backend.api.domain.dto.UserSearchDTO;
import com.dagym.backend.api.domain.models.User;
import com.dagym.backend.api.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final StorageService storageService;

    public User register(User user) {
        if (user.getPassword() == null || user.getPassword().isEmpty()) {
            throw new IllegalArgumentException("Password cannot be empty");
        }

        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        return userRepository.save(user);
    }

    public User saveUser(User user) {
        return userRepository.save(user);
    }

    public Optional<User> login(String email, String password) {
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isPresent() && userOptional.get().getPassword().equals(password)) {
            return userOptional;
        }
        return Optional.empty();
    }

    /**
     * NOVO: Busca usuários aleatórios para a seção de sugestões.
     * Requer que o método findRandomUsers() exista no UserRepository.
     */
    public List<UserSearchDTO> getSuggestedUsers() {
        return userRepository.findRandomUsers().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<UserSearchDTO> searchUsers(String query) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }

        List<User> users = userRepository.findByNomeContainingIgnoreCaseOrUsernameContainingIgnoreCase(query, query);

        return users.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private UserSearchDTO convertToDTO(User user) {
        return new UserSearchDTO(user.getId(), user.getNome(), user.getUsername(), user.getAvatarUrl());
    }

    public Optional<User> getUser(Long id) {
        return userRepository.findById(id);
    }

    public User updateAvatar(Long userId, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        String filename = storageService.store(file);

        user.setAvatarUrl(filename);

        return userRepository.save(user);
    }

    public User updateUser(Long id, User updatedUser) {
        Optional<User> optionalUser = userRepository.findById(id);
        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            if (updatedUser.getEmail() != null) user.setEmail(updatedUser.getEmail());
            if (updatedUser.getPassword() != null) user.setPassword(updatedUser.getPassword());
            return userRepository.save(user);
        } else {
            throw new RuntimeException("Usuário não encontrado");
        }
    }

    public User completeProfile(Long id, User profileData) {
        return userRepository.findById(id).map(user -> {
            user.setDescription(profileData.getDescription());
            user.setWeight(profileData.getWeight());
            user.setHeight(profileData.getHeight());
            user.setDiet(profileData.getDiet());
            user.setWorkout(profileData.getWorkout());
            return userRepository.save(user);
        }).orElseThrow(() -> new RuntimeException("Usuário com id " + id + " não encontrado"));
    }

    @Transactional
    public void toggleFollow(Long followerId, Long followedId) {
        if (followerId.equals(followedId)) return;

        User follower = userRepository.findById(followerId).orElseThrow();
        User followed = userRepository.findById(followedId).orElseThrow();

        if (follower.getFollowing().contains(followed)) {
            follower.getFollowing().remove(followed);
            followed.getFollowers().remove(follower);
        } else {
            follower.getFollowing().add(followed);
            followed.getFollowers().add(follower);
        }
        userRepository.save(follower);
    }

    public UserProfileDTO getUserProfile(Long profileId, Long currentUserId) {
        User profileUser = userRepository.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        boolean isFollowing = false;
        if (currentUserId != null) {
            isFollowing = profileUser.getFollowers().stream()
                    .anyMatch(u -> u.getId().equals(currentUserId));
        }

        return new UserProfileDTO(
                profileUser.getId(),
                profileUser.getNome(),
                profileUser.getUsername(),
                profileUser.getDescription(),
                profileUser.getAvatarUrl(),
                profileUser.getWeight(),
                profileUser.getHeight(),
                profileUser.getDiet(),
                profileUser.getWorkout(),
                profileUser.getFollowers().size(),
                profileUser.getFollowing().size(),
                profileUser.getPosts().size(),
                isFollowing
        );
    }

    // Listar seguidores/seguindo para o modal
    public List<UserSearchDTO> getFollowers(Long userId) {
        return userRepository.findById(userId).orElseThrow().getFollowers().stream()
                .map(u -> new UserSearchDTO(u.getId(), u.getNome(), u.getUsername(), u.getAvatarUrl()))
                .collect(Collectors.toList());
    }

    public List<UserSearchDTO> getFollowing(Long userId) {
        return userRepository.findById(userId).orElseThrow().getFollowing().stream()
                .map(u -> new UserSearchDTO(u.getId(), u.getNome(), u.getUsername(), u.getAvatarUrl()))
                .collect(Collectors.toList());
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}