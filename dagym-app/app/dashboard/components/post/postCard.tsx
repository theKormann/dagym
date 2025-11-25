"use client"

import { ChartPost } from "./ChartPost"
import { StandardPost } from "./StandardPost" 

type PostCardProps = {
  post: any;
  currentUserId?: string | number; 
  onLikeToggle: (id: string) => void;
  onCommentToggle?: (id: string) => void;
  onAddComment?: (id: string, text: string) => void;
  onRepost?: (id: string | number, quote?: string) => void;
  onDelete?: (id: string) => void;
  [key: string]: any;
};

export function PostCard({ post, onRepost, onDelete, currentUserId, ...props }: PostCardProps) {
  if (post.postType === 'chart' && post.chartData) {
    return (
        <ChartPost 
            post={post} 
            onDelete={onDelete} 
            currentUserId={currentUserId} 
            {...props} 
        />
    );
  }
  
  return (
    <StandardPost 
        post={post} 
        onRepost={onRepost} 
        onDelete={onDelete} 
        currentUserId={currentUserId}
        {...props} 
    />
  );
}