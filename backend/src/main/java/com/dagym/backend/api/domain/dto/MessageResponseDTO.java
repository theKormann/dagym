package com.dagym.backend.api.domain.dto;

public record MessageResponseDTO(
        Long id,
        Long senderId,
        Long receiverId,
        String content,
        String timestamp
) {}