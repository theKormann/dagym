package com.dagym.backend.api.repository;

import com.dagym.backend.api.domain.models.Like;
import com.dagym.backend.api.domain.models.Post;
import com.dagym.backend.api.domain.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface LikeRepository extends JpaRepository<Like, Long> {
    Optional<Like> findByPostAndUser(Post post, User user);
    boolean existsByPostAndUser(Post post, User user);
}