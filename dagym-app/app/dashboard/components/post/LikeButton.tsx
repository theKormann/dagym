// src/app/dashboard/components/post/LikeButton.tsx

"use client"

import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"

// Tipos das propriedades que este componente recebe
type LikeButtonProps = {
  postId: string;
  isLiked: boolean;
  likeCount: number;
  onLikeToggle: (postId: string) => void;
  size?: "sm" | "xs"; // Tamanho opcional
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void; // Para parar a propagação no grid
};

export function LikeButton({ postId, isLiked, likeCount, onLikeToggle, size = "sm", onClick }: LikeButtonProps) {
  const handleInternalClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(event); // Executa a função de parar propagação, se existir
    }
    onLikeToggle(postId); // Executa a lógica de curtir
  };
  
  const iconSize = size === "sm" ? "h-5 w-5" : "h-4 w-4";

  return (
    <Button variant="ghost" size={size} className="flex items-center gap-2" onClick={handleInternalClick}>
      <Heart 
        className={`transition-colors ${iconSize} ${isLiked ? 'text-red-500 fill-red-500' : 'text-foreground'}`} 
      /> 
      {likeCount}
    </Button>
  );
}