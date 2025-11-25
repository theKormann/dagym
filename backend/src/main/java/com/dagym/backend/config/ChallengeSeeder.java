package com.dagym.backend.config;

import com.dagym.backend.api.domain.models.Challenge;
import com.dagym.backend.api.repository.ChallengeRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;

@Configuration
public class ChallengeSeeder {

    @Bean
    CommandLineRunner initChallenges(ChallengeRepository repository) {
        return args -> {
            if (repository.count() == 0) {

                Challenge c1 = new Challenge();
                c1.setTitle("Maratona de Cardio");
                c1.setDescription("Corra ou caminhe por 30 minutos todos os dias durante um mês.");
                c1.setCategory("Cardio");
                c1.setDuration("30 dias");
                c1.setTotalTarget(30);
                c1.setReward("Medalha de Fogo 🔥");
                c1.setParticipantsCount(150);

                Challenge c2 = new Challenge();
                c2.setTitle("Desafio da Hidratação");
                c2.setDescription("Beba 3 litros de água diariamente para limpar o organismo.");
                c2.setCategory("Bem-Estar");
                c2.setDuration("14 dias");
                c2.setTotalTarget(14);
                c2.setReward("Selo Gota d'Água 💧");
                c2.setParticipantsCount(342);

                Challenge c3 = new Challenge();
                c3.setTitle("Semana da Força");
                c3.setDescription("Realize treinos de força (musculação ou calistenia) por 7 dias seguidos.");
                c3.setCategory("Força");
                c3.setDuration("7 dias");
                c3.setTotalTarget(7);
                c3.setReward("Braço de Ferro 💪");
                c3.setParticipantsCount(89);

                Challenge c4 = new Challenge();
                c4.setTitle("Despertar 5AM");
                c4.setDescription("Acorde às 5 da manhã e faça uma atividade física imediatamente.");
                c4.setCategory("Bem-Estar");
                c4.setDuration("21 dias");
                c4.setTotalTarget(21);
                c4.setReward("Sol da Manhã ☀️");
                c4.setParticipantsCount(56);

                Challenge c5 = new Challenge();
                c5.setTitle("100 Flexões");
                c5.setDescription("Faça 100 flexões por dia (pode dividir em séries) durante 10 dias.");
                c5.setCategory("Força");
                c5.setDuration("10 dias");
                c5.setTotalTarget(10);
                c5.setReward("Peitoral de Aço 🛡️");
                c5.setParticipantsCount(210);

                repository.saveAll(Arrays.asList(c1, c2, c3, c4, c5));
                System.out.println("--- DESAFIOS PADRÃOCRIADOS COM SUCESSO ---");
            }
        };
    }
}