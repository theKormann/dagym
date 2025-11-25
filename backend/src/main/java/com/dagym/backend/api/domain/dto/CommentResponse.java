package com.dagym.backend.api.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class CommentResponse {
    private Long id;
    private String text;
    private LocalDateTime timestamp;
    private UserResponse author;
}