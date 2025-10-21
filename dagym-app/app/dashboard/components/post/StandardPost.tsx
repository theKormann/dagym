"use client"

import { MessageSquare, MoreHorizontal } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import type { Post } from "../home"
import { LikeButton } from "./LikeButton"
import { CommentSection } from "./CommentSection"

type StandardPostProps = {
  post: Post;
  layout: 'list' | 'grid';
  isCommentSectionOpen: boolean;
  onLikeToggle: (postId: string) => void;
  onCommentToggle: (postId: string) => void;
  onAddComment: (postId: string, commentText: string) => void;
  onCardClick?: () => void;
};

export function StandardPost({ post, layout, isCommentSectionOpen, onLikeToggle, onCommentToggle, onAddComment, onCardClick }: StandardPostProps) {
  if (layout === 'grid') {
    return (
      <div onClick={onCardClick} className="h-full">
        <Card className="flex flex-col h-full overflow-hidden">
          {post.imageUrl && (
            <div className="aspect-video w-full overflow-hidden"><img src={post.imageUrl} alt="Post content" className="w-full h-full object-cover" /></div>
          )}
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <Avatar className="h-10 w-10"><AvatarImage src={post.author.avatar} /><AvatarFallback>{post.author.name.substring(0, 2)}</AvatarFallback></Avatar>
            <div><p className="font-semibold text-sm">{post.author.name}</p><p className="text-xs text-muted-foreground">@{post.author.username}</p></div>
          </CardHeader>
          <CardContent className="flex-grow"><p className="text-sm line-clamp-3">{post.content}</p></CardContent>
          <CardFooter className="border-t pt-3 flex justify-around">
            <LikeButton postId={post.id} isLiked={post.isLiked} likeCount={post.likes} onLikeToggle={onLikeToggle} size="xs" onClick={(e) => e.stopPropagation()} />
            <Button variant="ghost" size="xs" className="flex items-center gap-2 text-xs" onClick={(e) => { e.stopPropagation(); onCardClick?.() }}>
              <MessageSquare className="h-4 w-4" /> {post.comments}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <Avatar className="h-11 w-11"><AvatarImage src={post.author.avatar} /><AvatarFallback>{post.author.name.substring(0, 2)}</AvatarFallback></Avatar>
        <div className="flex-1"><p className="font-semibold">{post.author.name}</p><p className="text-xs text-muted-foreground">@{post.author.username} · {post.timestamp}</p></div>
        <Button variant="ghost" size="icon"><MoreHorizontal className="h-5 w-5" /></Button>
      </CardHeader>
      <CardContent>
        <p className="mb-4 whitespace-pre-wrap">{post.content}</p>
        {post.imageUrl && (<div className="rounded-2xl border overflow-hidden"><img src={post.imageUrl} alt="Post content" className="w-full h-auto object-cover" /></div>)}
      </CardContent>
      <CardFooter className="border-t pt-4 flex gap-4">
        <LikeButton postId={post.id} isLiked={post.isLiked} likeCount={post.likes} onLikeToggle={onLikeToggle} />
        <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={() => onCommentToggle(post.id)}>
          <MessageSquare className="h-5 w-5" /> {post.comments}
        </Button>
      </CardFooter>
      {isCommentSectionOpen && <CommentSection postId={post.id} comments={post.commentsList} onAddComment={onAddComment} />}
    </Card>
  );
}