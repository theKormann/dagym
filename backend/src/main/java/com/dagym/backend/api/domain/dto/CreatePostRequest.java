package com.dagym.backend.api.domain.dto;

public record CreatePostRequest(
        String description,
        String photoUrl
) {
}