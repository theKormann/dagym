package com.dagym.backend.config;

import com.dagym.backend.api.domain.models.Post;
import com.dagym.backend.api.domain.models.User;
import com.dagym.backend.api.repository.PostRepository;
import com.dagym.backend.api.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.util.Optional;

@Configuration
public class UserSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PostRepository postRepository;

    public UserSeeder(UserRepository userRepository, PostRepository postRepository) {
        this.userRepository = userRepository;
        this.postRepository = postRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        seedMiguel();
        seedMatheus();
        seedManuela();
        seedGeazi();
        seedArthur();
    }

    // ========================= MIGUEL ================================
    private void seedMiguel() {
        User miguel;

        Optional<User> existingUser = userRepository.findByEmail("migmib@gmail.com");

        if (existingUser.isPresent()) {
            System.out.println("🔄 Atualizando usuário Miguel existente...");
            miguel = existingUser.get();
        } else {
            System.out.println("🆕 Criando novo usuário Miguel...");
            miguel = new User();
            miguel.setEmail("migmib@gmail.com");
            miguel.setUsername("mWillians");
            miguel.setPassword("12345678");
        }

        miguel.setNome("Miguel Willians");
        miguel.setAvatarUrl("teste/miguel/perfil.png");
        miguel.setDescription("treino a quatro anos, gosto de treinar sozinho e adoro treinar de madrugada");
        miguel.setWeight(86.0);
        miguel.setHeight(1.88);
        miguel.setDiet("Dieta padrão de hipertrofia: 3000kcal...");
        miguel.setWorkout("ABC 2x...");

        miguel = userRepository.save(miguel);

        System.out.println("✅ Dados do usuário Miguel salvos!");

        createPostIfNotExists(
                miguel,
                "mais um treino lendário",
                miguel.getAvatarUrl(),
                "teste/miguel/mig.png"
        );
    }


    // ======================== MATHEUS KORMANN =========================
    private void seedMatheus() {
        User user = upsertUser(
                "kormannmatheus@gmail.com",
                "kormann",
                "Matheus Kormann",
                "teste/korma/perfil.jpg",
                "CEO do Dagym"
        );

        createPostIfNotExists(
                user,
                "A vida não é só json",
                user.getAvatarUrl(),
                "teste/korma/postkormann.jpg"
        );
    }


    // ======================== MANUELA GOMES ==========================
    private void seedManuela() {
        User user = upsertUser(
                "manulinda@gmail.com",
                "manu",
                "Manuela Gomes",
                "teste/korma/perfilmanu.jpg",
                "Esposa do Matheus Kormann"
        );
    }


    // ======================== GEAZI ANDRADE ===========================
    private void seedGeazi() {
        User user = upsertUser(
                "gex@gmail.com",
                "gex",
                "Geazi Andrade",
                "teste/geazi/perfil.webp",
                "TheBigBadWolf"
        );

        createPostIfNotExists(
                user,
                "Sem medo 🐺🔥",
                user.getAvatarUrl(),
                "teste/geazi/postgex.jpg"
        );
    }


    // ======================== ARTHUR MANSUR ===========================
    private void seedArthur() {
        User user = upsertUser(
                "bigbarros@gmail.com",
                "mansur",
                "Arthur Mansur",
                "teste/arthur/perfil.png",
                "buguinha ex goleiro"
        );

        createPostIfNotExists(
                user,
                "Olá, sou o Big Barros!",
                user.getAvatarUrl(),
                "teste/arthur/postarthur.jpg"
        );
    }


    // ==================================================================
    // HELPERS
    // ==================================================================

    private User upsertUser(String email, String username, String nome, String avatarPath, String bio) {

        User user;

        Optional<User> existing = userRepository.findByEmail(email);

        if (existing.isPresent()) {
            System.out.println("🔄 Atualizando usuário " + nome + "...");
            user = existing.get();
        } else {
            System.out.println("🆕 Criando novo usuário " + nome + "...");
            user = new User();
            user.setEmail(email);
            user.setUsername(username);
            user.setPassword("12345678");
        }

        user.setNome(nome);
        user.setAvatarUrl(avatarPath); // sempre sem barra inicial
        user.setDescription(bio);

        return userRepository.save(user);
    }


    private void createPostIfNotExists(User author, String description, String avatarUrl, String photoUrl) {
        boolean postExists = postRepository.findAll().stream()
                .anyMatch(p -> p.getUser().getId().equals(author.getId())
                        && p.getDescription().equals(description));

        if (postExists) {
            System.out.println("⚠️ Post já existe para " + author.getNome() + ". Pulando criação.");
            return;
        }

        Post post = new Post();
        post.setUser(author);
        post.setDescription(description);
        post.setAvatarUrl(avatarUrl);
        post.setPhotoUrl(photoUrl);

        postRepository.save(post);

        System.out.println("✅ Post criado para " + author.getNome());
    }
}
