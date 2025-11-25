"use client"

import { motion } from "framer-motion"
import { MessageSquare, X, MoreHorizontal, Trash, Link as LinkIcon, Flag } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import type { Post } from "@/app/home/page" 
import { LikeButton } from "./LikeButton"
import { CommentSection } from "./CommentSection"

type PostModalProps = {
  post: Post;
  currentUserId?: string | number;
  onClose: () => void;
  onLikeToggle: (postId: string) => void;
  onAddComment: (postId: string, commentText: string) => void;
  onDelete?: (postId: string) => void;
};

export function PostModal({ post, onClose, onLikeToggle, onAddComment, onDelete, currentUserId }: PostModalProps) {
  
  const isOwner = String(currentUserId) === String(post.author.id);

  const handleDeleteClick = () => {
    if (confirm("Tem certeza que deseja excluir este post?")) {
        onDelete && onDelete(post.id);
        onClose(); 
    }
  }

  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <motion.div
          layoutId={`card-container-${post.id}`}
          className="w-full max-w-2xl"
        >
          <Card className="max-h-[90vh] flex flex-col overflow-hidden relative">
            
            <div className="absolute top-2 right-2 p-2 z-10 flex gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-background/60 text-foreground hover:bg-background/80">
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem><LinkIcon className="mr-2 h-4 w-4"/> Copiar Link</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {isOwner && onDelete ? (
                            <DropdownMenuItem onClick={handleDeleteClick} className="text-red-600 focus:text-red-600 cursor-pointer">
                                <Trash className="mr-2 h-4 w-4" />
                                Deletar Post
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem><Flag className="mr-2 h-4 w-4"/> Reportar</DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

              <Button
                variant="ghost" size="icon"
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="h-8 w-8 rounded-full bg-background/60 text-foreground hover:bg-background/80"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          
            {post.imageUrl && (
                <div className="max-h-[50vh] overflow-hidden">
                    <img src={post.imageUrl} alt="Post content" className="w-full h-auto object-cover" />
                </div>
            )}

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