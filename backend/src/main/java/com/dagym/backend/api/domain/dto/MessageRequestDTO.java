package com.dagym.backend.api.domain.dto;

public record MessageRequestDTO(
        Long senderId,
        Long receiverId,
        String content
) {}