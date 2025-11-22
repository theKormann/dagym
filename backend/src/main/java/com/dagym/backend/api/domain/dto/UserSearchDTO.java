package com.dagym.backend.api.domain.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class UserSearchDTO {
    private Long id;
    private String nome;
    private String username;

    public UserSearchDTO(Long id, String nome, String username) {
        this.id = id;
        this.nome = nome;
        this.username = username;
    }
}