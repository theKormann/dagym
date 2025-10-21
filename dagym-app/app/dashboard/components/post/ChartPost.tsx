"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MessageSquare, MoreHorizontal } from "lucide-react"
import type { Post } from '../home';
import { LikeButton } from './LikeButton';
import { CommentSection } from './CommentSection';

// Componente para customizar o tooltip do gráfico
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <span className="font-bold text-muted-foreground">
          {`${label}: ${payload[0].value} ${payload[0].payload.unit}`}
        </span>
      </div>
    );
  }
  return null;
};

// Props que este componente espera receber
type ChartPostProps = {
  post: Post;
  isCommentSectionOpen: boolean;
  onLikeToggle: (postId: string) => void;
  onCommentToggle: (postId: string) => void;
  onAddComment: (postId: string, commentText: string) => void;
}

export function ChartPost({ post, isCommentSectionOpen, onLikeToggle, onCommentToggle, onAddComment }: ChartPostProps) {
  if (!post.chartData) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <Avatar className="h-11 w-11"><AvatarImage src={post.author.avatar} /><AvatarFallback>{post.author.name.substring(0, 2)}</AvatarFallback></Avatar>
        <div className="flex-1">
          <p className="font-semibold">{post.author.name}</p>
          <p className="text-xs text-muted-foreground">@{post.author.username} · {post.timestamp}</p>
        </div>
        <Button variant="ghost" size="icon"><MoreHorizontal className="h-5 w-5" /></Button>
      </CardHeader>
      <CardContent>
        <p className="mb-2 font-semibold text-lg">{post.chartData.title}</p>
        <p className="mb-4 text-sm text-muted-foreground">{post.content}</p>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={post.chartData.data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', fillOpacity: 0.5 }} />
              <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
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