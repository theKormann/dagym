package com.dagym.backend.api.services;

import com.dagym.backend.api.domain.models.User;
import com.dagym.backend.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;


    public User register(User user) {
        return userRepository.save(user);
    }

    public boolean login(String email, String password) {
        Optional<User> user = userRepository.findByEmail(email);
        return user.isPresent() && user.get().getPassword().equals(password);
    }

    public Optional<User> getUser(Long id) {
        return userRepository.findById(id);
    }

    public User updateUser(Long id, User updatedUser) {
        Optional<User> optionalUser = userRepository.findById(id);
        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            user.setEmail(updatedUser.getEmail());
            user.setPassword(updatedUser.getPassword());
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
