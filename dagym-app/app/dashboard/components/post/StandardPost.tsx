"use client"

import { 
  MessageSquare, 
  MoreHorizontal, 
  Repeat, 
  Trash, 
  Pencil, 
  Flag, 
  Link as LinkIcon, 
  Share 
} from "lucide-react"
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
import type { Post } from "../home" // Ajuste o import se necessário para onde está o tipo Post
import { LikeButton } from "./LikeButton"
import { CommentSection } from "./CommentSection"

type StandardPostProps = {
  post: Post;
  layout: 'list' | 'grid';
  currentUserId?: string | number;
  isCommentSectionOpen?: boolean;
  onLikeToggle: (postId: string) => void;
  onCommentToggle?: (postId: string) => void;
  onAddComment?: (postId: string, commentText: string) => void;
  onRepost: (postId: string, quote?: string) => void;
  onDelete?: (postId: string) => void;
  onCardClick?: () => void;
};

export function StandardPost({ 
  post, 
  layout, 
  currentUserId,
  isCommentSectionOpen, 
  onLikeToggle, 
  onCommentToggle, 
  onAddComment,
  onRepost, 
  onDelete,
  onCardClick 
}: StandardPostProps) {

  // Agora essa comparação vai funcionar!
  const isOwner = String(currentUserId) === String(post.author.id);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Tem certeza que deseja excluir este post permanentemente?")) {
        onDelete && onDelete(post.id);
    }
  }

  const handleRepostClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const quote = window.prompt("Adicionar um comentário ao repost?");
    if (quote !== null) {
        onRepost(post.id, quote);
    }
  }

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`https://dagym.com/post/${post.id}`);
    alert("Link copiado para a área de transferência!"); 
  }

  const PostActionsDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 data-[state=open]:bg-muted">
          <MoreHorizontal className="h-5 w-5" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Ações do Post</DropdownMenuLabel>
        
        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
          <LinkIcon className="mr-2 h-4 w-4" />
          Copiar Link
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <Share className="mr-2 h-4 w-4" />
          Compartilhar via...
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />

        {isOwner ? (
          <>
            <DropdownMenuItem className="cursor-pointer" onClick={(e) => e.stopPropagation()}>
               <Pencil className="mr-2 h-4 w-4" />
               Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleDeleteClick} 
              className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
            >
              <Trash className="mr-2 h-4 w-4" />
              Excluir Post
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
            <Flag className="mr-2 h-4 w-4" />
            Reportar Conteúdo
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const OriginalPostContent = ({ original }: { original: Post }) => (
    <div className="mt-3 border rounded-xl p-3 bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-6 w-6">
                <AvatarImage src={original.author.avatar} />
                <AvatarFallback>{original.author.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <span className="font-semibold text-sm">{original.author.name}</span>
            <span className="text-xs text-muted-foreground">@{original.author.username}</span>
        </div>
        <p className="text-sm mb-2">{original.content}</p>
        {original.imageUrl && (
             <div className="rounded-lg overflow-hidden border max-h-40">
                <img src={original.imageUrl} alt="Original content" className="w-full h-full object-cover" />
             </div>
        )}
    </div>
  );

  if (layout === 'grid') {
    return (
      <div onClick={onCardClick} className="h-full cursor-pointer relative group">
        <Card className="flex flex-col h-full overflow-hidden hover:border-gray-400 transition-colors">
          
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-full">
             <PostActionsDropdown />
          </div>

          {post.originalPost && (
             <div className="px-4 pt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Repeat className="h-3 w-3" />
                <span>{post.author.name} repostou</span>
             </div>
          )}

          <CardHeader className="flex flex-row items-center gap-3 pb-2 pt-3">
            <Avatar className="h-8 w-8"><AvatarImage src={post.author.avatar} /><AvatarFallback>{post.author.name.substring(0, 2)}</AvatarFallback></Avatar>
            <div className="overflow-hidden">
                <p className="font-semibold text-sm truncate">{post.author.name}</p>
            </div>
          </CardHeader>
          
          <CardContent className="flex-grow pb-2">
            {post.content && <p className="text-sm line-clamp-2 mb-2">{post.content}</p>}
            {post.imageUrl && (
                <div className="aspect-video w-full overflow-hidden rounded-md mb-2">
                    <img src={post.imageUrl} alt="Post content" className="w-full h-full object-cover" />
                </div>
            )}
            {post.originalPost && <OriginalPostContent original={post.originalPost} />}
          </CardContent>

          <CardFooter className="border-t pt-2 pb-2 flex justify-between text-muted-foreground">
             <LikeButton postId={post.id} isLiked={post.isLiked} likeCount={post.likes} onLikeToggle={onLikeToggle} size="xs" onClick={(e) => e.stopPropagation()} />
             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRepostClick}>
                <Repeat className="h-4 w-4" />
             </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <Card className="mb-4">
       {post.originalPost && (
             <div className="px-6 pt-2 flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                <Repeat className="h-3 w-3" />
                <span>{post.author.name} repostou</span>
             </div>
       )}

      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <Avatar className="h-11 w-11"><AvatarImage src={post.author.avatar} /><AvatarFallback>{post.author.name.substring(0, 2)}</AvatarFallback></Avatar>
        <div className="flex-1">
            <p className="font-semibold">{post.author.name}</p>
            <p className="text-xs text-muted-foreground">@{post.author.username} · {post.timestamp}</p>
        </div>
        
        <PostActionsDropdown />

      </CardHeader>

      <CardContent>
        {post.content && <p className="mb-4 whitespace-pre-wrap">{post.content}</p>}
        {post.imageUrl && (<div className="rounded-2xl border overflow-hidden mb-4"><img src={post.imageUrl} alt="Post content" className="w-full h-auto object-cover" /></div>)}
        {post.originalPost && <OriginalPostContent original={post.originalPost} />}
      </CardContent>

      <CardFooter className="border-t pt-3 flex justify-between sm:justify-start sm:gap-8">
        <LikeButton postId={post.id} isLiked={post.isLiked} likeCount={post.likes} onLikeToggle={onLikeToggle} />
        <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground hover:text-blue-500" onClick={(e) => onCommentToggle && onCommentToggle(post.id)}>
          <MessageSquare className="h-5 w-5" /> {post.comments}
        </Button>
        <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground hover:text-green-500" onClick={handleRepostClick}>
            <Repeat className="h-5 w-5" />
        </Button>
      </CardFooter>
      {isCommentSectionOpen && onAddComment && <CommentSection postId={post.id} comments={post.commentsList} onAddComment={onAddComment} />}
    </Card>
  );
}