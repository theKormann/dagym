"use client"

import { ChartPost } from "./ChartPost"
import { StandardPost } from "./StandardPost"

type PostCardProps = {
  post: any;
  [key: string]: any;
};

export function PostCard({ post, ...props }: PostCardProps) {
  // Se o post for do tipo 'chart', mostra o componente de gráfico
  if (post.postType === 'chart' && post.chartData) {
    return <ChartPost post={post} {...props} />;
  }
  
  // Caso contrário, mostra o post padrão (com texto/imagem)
  return <StandardPost post={post} {...props} />;
}