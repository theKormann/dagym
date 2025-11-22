package com.dagym.backend.api.controller;

import com.dagym.backend.api.domain.dto.GroupResponseDTO;
import com.dagym.backend.api.domain.dto.UserSearchDTO;
import com.dagym.backend.api.domain.models.CommunityGroup;
import com.dagym.backend.api.services.GroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @GetMapping
    public ResponseEntity<List<GroupResponseDTO>> getAll(@RequestParam(required = false) Long userId, @RequestParam(required = false) String q) {
        if (q != null && !q.isEmpty()) {
            return ResponseEntity.ok(groupService.searchGroups(q, userId));
        }
        return ResponseEntity.ok(groupService.getAllGroups(userId));
    }

    @GetMapping("/{groupId}/members")
    public ResponseEntity<List<UserSearchDTO>> getMembers(@PathVariable Long groupId) {
        return ResponseEntity.ok(groupService.getGroupMembers(groupId));
    }

    @PostMapping
    public ResponseEntity<GroupResponseDTO> create(@RequestParam Long userId, @RequestBody CommunityGroup group) {
        return ResponseEntity.ok(groupService.createGroup(userId, group));
    }

    @PostMapping("/{groupId}/toggle-member")
    public ResponseEntity<GroupResponseDTO> toggleMember(@PathVariable Long groupId, @RequestParam Long userId) {
        return ResponseEntity.ok(groupService.toggleMembership(groupId, userId));
    }
}