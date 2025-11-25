package com.dagym.backend.api.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserProfileDTO {
    private Long id;
    private String nome;
    private String username;
    private String description;
    private String avatarUrl;
    private Double weight;
    private Double height;
    private String diet;
    private String workout;

    private int followersCount;
    private int followingCount;
    private int postCount;
    private boolean isFollowing;
}