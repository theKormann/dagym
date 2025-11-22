package com.dagym.backend.api.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserSearchDTO {
    private Long id;
    private String nome;
    private String username;
    private String avatarUrl;
}