package com.dagym.backend.api.domain.dto;

import java.time.LocalDateTime;

public record PostResponse(
        Long id,
        String description,
        String photoUrl,
        LocalDateTime publicationDate,
        UserResponse author,
        int likeCount,
        int commentCount
) {
}