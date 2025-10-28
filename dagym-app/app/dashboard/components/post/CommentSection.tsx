// src/app/dashboard/components/post/CommentSection.tsx

"use client"

import React, { useState } from "react"
import { Send } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import type { Comment } from "../home" // ✨ Importaremos o tipo do home.tsx

type CommentSectionProps = {
  postId: string;
  comments: Comment[];
  onAddComment: (postId: string, commentText: string) => void;
};

export function CommentSection({ postId, comments, onAddComment }: CommentSectionProps) {
  const [commentText, setCommentText] = useState("");

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
            <Avatar className="h-8 w-8"><AvatarImage src={comment.author.avatar} /><AvatarFallback>{comment.author.name.substring(0,2)}</AvatarFallback></Avatar>
            <div className="text-sm bg-muted rounded-xl p-3">
              <p className="font-semibold">{comment.author.name}</p>
              <p>{comment.text}</p>
            </div>
          </div>
        ))}
      </div>
      {/* Campo para adicionar novo comentário */}
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9"><AvatarImage src="https://github.com/shadcn.png" /><AvatarFallback>MK</AvatarFallback></Avatar>
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