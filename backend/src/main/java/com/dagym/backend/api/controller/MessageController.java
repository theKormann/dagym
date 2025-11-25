package com.dagym.backend.api.controller;

import com.dagym.backend.api.domain.dto.MessageRequestDTO;
import com.dagym.backend.api.domain.dto.MessageResponseDTO;
import com.dagym.backend.api.domain.models.Message;
import com.dagym.backend.api.domain.models.User;
import com.dagym.backend.api.repository.MessageRepository;
import com.dagym.backend.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    public ResponseEntity<Void> sendMessage(@RequestBody MessageRequestDTO dto) {
        User sender = userRepository.findById(dto.senderId())
                .orElseThrow(() -> new RuntimeException("Remetente não encontrado"));

        User receiver = userRepository.findById(dto.receiverId())
                .orElseThrow(() -> new RuntimeException("Destinatário não encontrado"));

        Message msg = new Message();
        msg.setSender(sender);
        msg.setReceiver(receiver);
        msg.setContent(dto.content());

        messageRepository.save(msg);

        return ResponseEntity.ok().build();
    }


    @GetMapping("/{userId}/{otherUserId}")
    public ResponseEntity<List<MessageResponseDTO>> getChatHistory(
            @PathVariable Long userId,
            @PathVariable Long otherUserId) {

        List<Message> messages = messageRepository.findChatHistory(userId, otherUserId);

        List<MessageResponseDTO> dtos = messages.stream().map(m -> new MessageResponseDTO(
                m.getId(),
                m.getSender().getId(),
                m.getReceiver().getId(),
                m.getContent(),
                m.getTimestamp().toString()
        )).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }
}