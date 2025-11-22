package com.dagym.backend.api.repository;

import com.dagym.backend.api.domain.models.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByUserId(Long userId);

    @Query("SELECT p FROM Post p JOIN FETCH p.user u ORDER BY p.publicationDate DESC")
    List<Post> findAllWithUserOrderByPublicationDateDesc();
}