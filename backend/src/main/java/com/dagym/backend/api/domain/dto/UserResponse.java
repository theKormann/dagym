package com.dagym.backend.api.domain.dto;


public record UserResponse(
        Long id,
        String name,
        String username,
        String avatarUrl
) {
}