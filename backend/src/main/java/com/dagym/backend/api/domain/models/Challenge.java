package com.dagym.backend.api.domain.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor // <--- ESSENCIAL
@AllArgsConstructor // <--- ESSENCIAL
@Entity
@Table(name = "challenges")
public class Challenge {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    @Column(length = 500)
    private String description;
    private String category;
    private String duration;
    private Integer totalTarget;
    private String reward;

    private Integer participantsCount = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}