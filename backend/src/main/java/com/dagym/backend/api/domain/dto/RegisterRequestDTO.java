package com.dagym.backend.api.domain.dto;

import lombok.Data;

@Data
public class RegisterRequestDTO {
    private String nome;
    private String username;
    private String email;
    private String password;
}