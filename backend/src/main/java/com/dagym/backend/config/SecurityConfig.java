package com.dagym.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Configura CORS primeiro
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // Desabilita CSRF (necessário para POSTs via API/Postman/React sem cookie de sessão)
                .csrf(csrf -> csrf.disable())

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/error").permitAll()

                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/uploads/**").permitAll()

                        // --- ÁREA DE POSTS ---
                        .requestMatchers("/api/posts/**").permitAll()
                        .requestMatchers("/posts/**").permitAll()

                        // --- ÁREA DE USUÁRIOS ---
                        .requestMatchers("/api/users/**").permitAll()
                        .requestMatchers("/users/**").permitAll()

                        // --- ÁREA DE FUNCIONALIDADES (DASHBOARD, TREINO, DIETA, DESAFIOS) ---
                        .requestMatchers("/api/dashboard/**").permitAll()

                        .requestMatchers("/api/groups/**").permitAll()

                        // Libera a rota de TREINO
                        .requestMatchers("/api/workout/**").permitAll()

                        // Libera a rota de DIETA (Nova)
                        .requestMatchers("/api/diet/**").permitAll()

                        // Libera a rota de DESAFIOS (Correção do erro 403)
                        .requestMatchers("/api/challenges/**").permitAll()

                        .anyRequest().authenticated()
                );

        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Permitir o frontend (ajuste se a porta mudar)
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000"));

        // Permitir todos os métodos
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"));

        // Permitir todos os headers
        configuration.setAllowedHeaders(Arrays.asList("*"));

        // Permitir credenciais (cookies/auth headers)
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}