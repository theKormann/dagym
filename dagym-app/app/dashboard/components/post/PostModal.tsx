"use client"

import { motion } from "framer-motion"
import { MessageSquare, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import type { Post } from "../home"
import { LikeButton } from "./LikeButton"
// ✨ 1. Importamos a seção de comentários que já tínhamos criado
import { CommentSection } from "./CommentSection"

type PostModalProps = {
  post: Post;
  onClose: () => void;
  onLikeToggle: (postId: string) => void;
  // ✨ 2. A função onAddComment agora é necessária aqui
  onAddComment: (postId: string, commentText: string) => void;
};

export function PostModal({ post, onClose, onLikeToggle, onAddComment }: PostModalProps) {
  return (
    <>
      {/* Fundo (Overlay) */}
      <motion.div
        className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      {/* Conteúdo do Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <motion.div
          layoutId={`card-container-${post.id}`}
          className="w-full max-w-2xl"
        >
          <Card className="max-h-[90vh] flex flex-col overflow-hidden relative">
            <div className="absolute top-0 right-0 p-2 z-10">
              <Button
                variant="ghost" size="icon"
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="h-8 w-8 rounded-full bg-background/60 text-foreground hover:bg-background/80"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          
            {post.imageUrl && (
                <div className="max-h-[50vh] overflow-hidden">
                    <img src={post.imageUrl} alt="Post content" className="w-full h-auto object-cover" />
                </div>
            )}

            {/* A área de scroll agora engloba todo o conteúdo de texto */}
            <div className="flex-1 overflow-y-auto">
              <CardHeader className="flex flex-row items-center gap-3">
                <Avatar className="h-11 w-11"><AvatarImage src={post.author.avatar} /><AvatarFallback>{post.author.name.substring(0, 2)}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{post.author.name}</p>
                  <p className="text-xs text-muted-foreground">@{post.author.username} · {post.timestamp}</p>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 whitespace-pre-wrap">{post.content}</p>
              </CardContent>
              <CardFooter className="border-t pt-4 flex gap-4">
                  <LikeButton postId={post.id} isLiked={post.isLiked} likeCount={post.likes} onLikeToggle={onLikeToggle} />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageSquare className="h-5 w-5" /> 
                    <span>{post.comments}</span>
                  </div>
              </CardFooter>

              {/* ✨ 3. A seção de comentários é renderizada aqui dentro do modal */}
              <CommentSection 
                postId={post.id}
                comments={post.commentsList}
                onAddComment={onAddComment}
              />
            </div>
          </Card>
        </motion.div>
      </div>
    </>
  );
}