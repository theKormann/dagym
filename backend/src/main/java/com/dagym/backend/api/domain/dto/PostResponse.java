package com.dagym.backend.api.domain.dto;

import java.time.LocalDateTime;
import java.util.List;

public record PostResponse(
        Long id,
        String description,
        String photoUrl,
        LocalDateTime publicationDate,
        UserResponse author,
        int likeCount,
        int commentCount,
        boolean isLiked,
        List<CommentResponse> comments,
        PostResponse originalPost
) {
}