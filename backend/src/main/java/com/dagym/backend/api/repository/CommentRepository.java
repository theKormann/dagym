package com.dagym.backend.api.repository;

import com.dagym.backend.api.domain.models.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<Comment, Long> {
}