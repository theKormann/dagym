"use client"

import React, { useState, useEffect } from "react"
import { Send } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import type { Comment } from "../home"

const UPLOAD_URL = "http://localhost:8080/uploads";

type CommentSectionProps = {
  postId: string;
  comments: Comment[];
  onAddComment: (postId: string, commentText: string) => void;
};

interface LocalUser {
    username: string;
    avatarUrl?: string;
}

export function CommentSection({ postId, comments, onAddComment }: CommentSectionProps) {
  const [commentText, setCommentText] = useState("");
  const [currentUser, setCurrentUser] = useState<LocalUser | null>(null);

  // Busca o usuário logado no localStorage ao montar o componente
  useEffect(() => {
      const storedUser = localStorage.getItem('dagym_user');
      if (storedUser) {
          try {
              setCurrentUser(JSON.parse(storedUser));
          } catch (e) {
              console.error("Erro ao ler usuário do cache", e);
          }
      }
  }, []);

  const handleCommentSubmit = () => {
    if (!commentText.trim()) return;
    onAddComment(postId, commentText);
    setCommentText(""); // Limpa o campo
  };

  return (
    <div className="px-6 pb-4 pt-2">
      <Separator className="mb-4" />
      
      {/* Lista de comentários existentes */}
      <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2">
        {comments.map(comment => (
          <div key={comment.id} className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
                <AvatarImage src={comment.author.avatar} />
                <AvatarFallback>{comment.author.name.substring(0,2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="text-sm bg-muted rounded-xl p-3">
              <p className="font-semibold">{comment.author.name}</p>
              <p>{comment.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Campo para adicionar novo comentário */}
      <div className="flex items-center gap-3">
        {/* AQUI: Exibe a foto do usuário logado ou suas iniciais */}
        <Avatar className="h-9 w-9 border border-border">
           {currentUser?.avatarUrl && (
               <AvatarImage 
                   src={`${UPLOAD_URL}/${currentUser.avatarUrl}`} 
                   className="object-cover"
               />
           )}
           <AvatarFallback className="bg-muted text-muted-foreground">
               {currentUser ? currentUser.username.substring(0, 2).toUpperCase() : "EU"}
           </AvatarFallback>
        </Avatar>

        <Input 
          placeholder="Escreva um comentário..."
          className="flex-1"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleCommentSubmit();
            }
          }}
        />
        <Button size="icon" onClick={handleCommentSubmit} disabled={!commentText.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}