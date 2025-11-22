package com.dagym.backend.api.services;

import com.dagym.backend.api.domain.dto.UserSearchDTO;
import com.dagym.backend.api.domain.models.User;
import com.dagym.backend.api.repository.UserRepository;
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
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este email já está cadastrado.");
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
        return new UserSearchDTO(user.getId(), user.getNome(), user.getUsername());
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

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}