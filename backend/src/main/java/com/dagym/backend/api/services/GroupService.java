package com.dagym.backend.api.services;

import com.dagym.backend.api.domain.dto.GroupResponseDTO;
import com.dagym.backend.api.domain.dto.UserSearchDTO;
import com.dagym.backend.api.domain.models.CommunityGroup;
import com.dagym.backend.api.domain.models.User;
import com.dagym.backend.api.repository.GroupRepository;
import com.dagym.backend.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;
    private final UserRepository userRepository;

    public List<GroupResponseDTO> getAllGroups(Long currentUserId) {
        List<CommunityGroup> groups = groupRepository.findAll();
        return groups.stream().map(g -> convertToDTO(g, currentUserId)).collect(Collectors.toList());
    }

    public List<GroupResponseDTO> searchGroups(String query, Long currentUserId) {
        List<CommunityGroup> groups = groupRepository.findByNameContainingIgnoreCaseOrCategoryContainingIgnoreCase(query, query);
        return groups.stream().map(g -> convertToDTO(g, currentUserId)).collect(Collectors.toList());
    }

    @Transactional
    public GroupResponseDTO createGroup(Long creatorId, CommunityGroup groupData) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        groupData.setCreator(creator);
        groupData.getMembers().add(creator);

        CommunityGroup saved = groupRepository.save(groupData);
        return convertToDTO(saved, creatorId);
    }

    @Transactional
    public GroupResponseDTO toggleMembership(Long groupId, Long userId) {
        CommunityGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Grupo não encontrado"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        if (group.getMembers().contains(user)) {
            group.getMembers().remove(user);
        } else {
            group.getMembers().add(user);
        }

        CommunityGroup saved = groupRepository.save(group);
        return convertToDTO(saved, userId);
    }

    public List<UserSearchDTO> getGroupMembers(Long groupId) {
        CommunityGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Grupo não encontrado"));

        return group.getMembers().stream()
                .map(user -> new UserSearchDTO(
                        user.getId(),
                        user.getNome(),
                        user.getUsername(),
                        user.getAvatarUrl()
                ))
                .collect(Collectors.toList());
    }

    private GroupResponseDTO convertToDTO(CommunityGroup group, Long currentUserId) {
        boolean isMember = false;
        if (currentUserId != null) {
            isMember = group.getMembers().stream().anyMatch(u -> u.getId().equals(currentUserId));
        }
        return new GroupResponseDTO(
                group.getId(),
                group.getName(),
                group.getDescription(),
                group.getCategory(),
                group.getLocation(),
                group.getMembers().size(),
                isMember
        );
    }
}