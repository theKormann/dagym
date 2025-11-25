package com.dagym.backend.api.repository;

import com.dagym.backend.api.domain.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    @Query(value = "SELECT * FROM users ORDER BY RAND() LIMIT 10", nativeQuery = true)
    List<User> findRandomUsers();
    List<User> findByNomeContainingIgnoreCaseOrUsernameContainingIgnoreCase(String nomeQuery, String usernameQuery);
}
