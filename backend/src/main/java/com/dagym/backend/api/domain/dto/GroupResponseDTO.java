package com.dagym.backend.api.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GroupResponseDTO {
    private Long id;
    private String name;
    private String description;
    private String category;
    private String location;
    private int membersCount;
    private boolean isMember; 
}