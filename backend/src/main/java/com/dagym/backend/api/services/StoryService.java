package com.dagym.backend.api.services;

import com.dagym.backend.api.domain.models.Story;
import com.dagym.backend.api.domain.models.User;
import com.dagym.backend.api.repository.StoryRepository;
import com.dagym.backend.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StoryService {

    private final StoryRepository storyRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;

    public Story createStory(Long userId, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        String filename = storageService.store(file);

        Story story = new Story();
        story.setUser(user);
        story.setMediaUrl(filename);

        return storyRepository.save(story);
    }

    public List<Story> getActiveStories(Long userId) {
        return storyRepository.findByUserIdAndExpiresAtAfterOrderByCreatedAtAsc(userId, LocalDateTime.now());
    }

    public void deleteStory(Long storyId, Long userId) {
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story não encontrado"));

        if (!story.getUser().getId().equals(userId)) {
            throw new RuntimeException("Você não tem permissão para deletar este story.");
        }


        storyRepository.delete(story);
    }
}