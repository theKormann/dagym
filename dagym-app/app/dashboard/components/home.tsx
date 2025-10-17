"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, BarChart, Users, List, LayoutGrid } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PostCard } from "./post/postCard"
import { PostModal } from "./post/PostModal"

// --- TIPOS COMPLETOS ---
export type Comment = { id: string; author: { name: string; username: string; avatar: string; }; text: string; timestamp: string; };
export type PostAuthor = { name: string; username: string; avatar: string; };
type ChartDataPoint = { name: string; value: number; unit: string; };
type ChartData = { title: string; period: string; unit: string; data: ChartDataPoint[]; };
export type Post = {
  id: string;
  author: PostAuthor;
  timestamp: string;
  content: string;
  postType: 'standard' | 'chart';
  imageUrl: string | null;
  chartData?: ChartData;
  likes: number;
  comments: number;
  isLiked: boolean;
  commentsList: Comment[];
};
type SuggestedUser = { name: string; username: string; avatar: string; };
type TrendingTopic = { topic: string; posts: string; };

// --- DADOS COMPLETOS ---
const initialFeedPosts: Post[] = [
    // Posts Padrão (com postType adicionado)
    {
        id: "post1", postType: 'standard', author: { name: "Julia Santos", username: "jsantosfit", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d" }, timestamp: "2h atrás", content: "Acabei de completar o desafio de 5km! 🏃‍♀️ Sentindo-me incrível e cheia de energia...", imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070", likes: 256, comments: 2, isLiked: false,
        commentsList: [
            { id: "comment1-1", author: { name: "Carlos Andrade", username: "carlos_strong", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704e" }, text: "Parabéns, Julia!", timestamp: "1h atrás" },
            { id: "comment1-2", author: { name: "Ana Pereira", username: "anayogini", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704f" }, text: "Incrível! 💪", timestamp: "30m atrás" },
        ]
    },
    { id: "post2", postType: 'standard', author: { name: "Carlos Andrade", username: "carlos_strong", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704e" }, timestamp: "5h atrás", content: "Novo recorde pessoal no levantamento terra hoje! 180kg.", imageUrl: null, likes: 489, comments: 0, isLiked: true, commentsList: [] },
    { id: "post3", postType: 'standard', author: { name: "Ana Pereira", username: "anayogini", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704f" }, timestamp: "Ontem", content: "Começando o dia com uma sessão de yoga ao nascer do sol.", imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2120", likes: 312, comments: 1, isLiked: false, commentsList: [ { id: "comment3-1", author: { name: "Julia Santos", username: "jsantosfit", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d" }, text: "Que foto linda!", timestamp: "Hoje" } ] },
    { id: "post4", postType: 'standard', author: { name: "Mariana Lima", username: "marifitfood", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704g" }, timestamp: "Hoje às 12:30", content: "Meal prep da semana concluído com sucesso!", imageUrl: "https://images.unsplash.com/photo-1543353071-873f6b64603d?q=80&w=2070", likes: 412, comments: 0, isLiked: false, commentsList: [] },
    { id: "post5", postType: 'standard', author: { name: "Ricardo Souza", username: "ricardo_cross", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704h" }, timestamp: "Hoje às 09:15", content: "WOD de hoje foi brutal, mas a sensação de dever cumprido não tem preço.", imageUrl: "https://images.unsplash.com/photo-1517964603305-11c036237682?q=80&w=2071", likes: 530, comments: 0, isLiked: true, commentsList: [] },
    { id: "post6", postType: 'standard', author: { name: "Fernanda Oliveira", username: "fer_pilates", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704i" }, timestamp: "Ontem", content: "Lembrete: o descanso é tão importante quanto o treino.", imageUrl: null, likes: 388, comments: 0, isLiked: false, commentsList: [] },
    { id: "post7", postType: 'standard', author: { name: "Bruno Costa", username: "brunotrilheiro", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704j" }, timestamp: "2 dias atrás", content: "Trilha do fim de semana. Conectar-se com a natureza recarrega as energias! ⛰️☀️", imageUrl: "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=2070", likes: 621, comments: 0, isLiked: false, commentsList: [] },
    { id: "post8", postType: 'standard', author: { name: "Camila Martins", username: "camilabike", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704k" }, timestamp: "2 dias atrás", content: "Pedal de 50km pra começar o domingo!", imageUrl: "https://images.unsplash.com/photo-1541625602330-2277a4c46182?q=80&w=2070", likes: 476, comments: 0, isLiked: true, commentsList: [] },
    { id: "post9", postType: 'standard', author: { name: "Gustavo Pereira", username: "gustavo_mindset", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704l" }, timestamp: "3 dias atrás", content: "'A única pessoa que você está destinado a se tornar é a pessoa que você decide ser.'", imageUrl: null, likes: 298, comments: 0, isLiked: false, commentsList: [] },
    { id: "post10", postType: 'standard', author: { name: "Laura Azevedo", username: "laurapilates", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704m" }, timestamp: "4 dias atrás", content: "Aula de Pilates hoje focada no core.", imageUrl: "https://images.unsplash.com/photo-1599447462855-c0194b635079?q=80&w=1974", likes: 355, comments: 1, isLiked: false, commentsList: [ { id: "comment10-1", author: { name: "Ana Pereira", username: "anayogini", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704f" }, text: "Pilates é vida!", timestamp: "3 dias atrás" } ] },
    { id: "post11", postType: 'standard', author: { name: "Vinicius Rocha", username: "vini_gains", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704n" }, timestamp: "4 dias atrás", content: "Foto de progresso! A balança nem sempre mostra a evolução.", imageUrl: "https://images.unsplash.com/photo-1581009137052-c67946786276?q=80&w=2070", likes: 580, comments: 0, isLiked: true, commentsList: [] },
    { id: "post12", postType: 'standard', author: { name: "Letícia Barros", username: "lelebarros", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704o" }, timestamp: "5 dias atrás", content: "CONSEGUI FAZER MINHA PRIMEIRA BARRA FIXA HOJE! 🎉", imageUrl: null, likes: 419, comments: 0, isLiked: false, commentsList: [] },
    { id: "post13", postType: 'standard', author: { name: "Felipe Almeida", username: "felipefuncional", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704p" }, timestamp: "6 dias atrás", content: "Começando o dia com um smoothie verde detox.", imageUrl: "https://images.unsplash.com/photo-1505252585461-1b632da547ec?q=80&w=1974", likes: 333, comments: 0, isLiked: false, commentsList: [] },
    
    // Posts de Gráfico
    {
        id: "post14", postType: 'chart', author: { name: "Carlos Andrade", username: "carlos_strong", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704e" }, timestamp: "Hoje às 18:00", content: "Minha evolução de carga no supino nos últimos 2 meses. Foco total!", imageUrl: null, likes: 720, comments: 55, isLiked: true, commentsList: [],
        chartData: { title: "Evolução de Carga: Supino Reto", period: "Agosto e Setembro", unit: "kg", data: [ { name: 'Sem 1', value: 80, unit: 'kg' }, { name: 'Sem 2', value: 82.5, unit: 'kg' }, { name: 'Sem 3', value: 85, unit: 'kg' }, { name: 'Sem 4', value: 85, unit: 'kg' }, { name: 'Sem 5', value: 87.5, unit: 'kg' }, { name: 'Sem 6', value: 90, unit: 'kg' } ] }
    },
    {
        id: "post15", postType: 'chart', author: { name: "Lucas Mendes", username: "lucas_run", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704a" }, timestamp: "Ontem", content: "Gráfico da minha perda de peso desde que comecei a correr. Cada quilo a menos é uma vitória!", imageUrl: null, likes: 815, comments: 72, isLiked: false, commentsList: [],
        chartData: { title: "Evolução de Peso Corporal", period: "Últimos 3 meses", unit: "kg", data: [ { name: 'Julho', value: 95, unit: 'kg' }, { name: 'Agosto', value: 91, unit: 'kg' }, { name: 'Setembro', value: 88, unit: 'kg' } ] }
    }
];

const suggestedUsers: SuggestedUser[] = [ /* ... */ ];
const trendingTopics: TrendingTopic[] = [ /* ... */ ];

export function HomePage() {
  const [layout, setLayout] = useState<'list' | 'grid'>('list');
  const [posts, setPosts] = useState<Post[]>(initialFeedPosts);
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  
  const handlePublishPost = () => {
    if (!newPostContent.trim()) return;
    const newPost: Post = {
        id: new Date().toISOString(),
        author: { name: "Matheus K.", username: "matheusk", avatar: "https://github.com/shadcn.png" },
        timestamp: "agora mesmo", content: newPostContent, postType: 'standard', imageUrl: null,
        likes: 0, comments: 0, isLiked: false, commentsList: []
    };
    setPosts([newPost, ...posts]);
    setNewPostContent("");
  };

  const handleLikeToggle = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 } 
        : post
    ));
  };

  const handleAddComment = (postId: string, commentText: string) => {
    if (!commentText.trim()) return;
    const newComment: Comment = { id: new Date().toISOString(), author: { name: "Matheus K.", username: "matheusk", avatar: "https://github.com/shadcn.png" }, text: commentText, timestamp: "agora mesmo" };
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, comments: post.comments + 1, commentsList: [...post.commentsList, newComment] } 
        : post
    ));
  };
  
  const handleCommentToggle = (postId: string) => {
    setCommentingPostId(prevId => prevId === postId ? null : postId);
  };

  const handleCommentClickFromModal = (postId: string) => {
    setLayout('list');
    setCommentingPostId(postId);
    setSelectedId(null);
  };

  const selectedPost = selectedId ? posts.find(post => post.id === selectedId) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
              <Avatar><AvatarImage src="https://github.com/shadcn.png" /><AvatarFallback>MK</AvatarFallback></Avatar>
              <div className="w-full">
              <Textarea placeholder="Compartilhe seu progresso, Matheus..." className="bg-muted border-none focus-visible:ring-1 focus-visible:ring-ring" value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} />
              </div>
          </CardHeader>
          <CardFooter className="flex justify-end">
              <Button className="rounded-2xl" onClick={handlePublishPost}>Publicar <Send className="ml-2 h-4 w-4" /></Button>
          </CardFooter>
        </Card>
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold tracking-tight">Feed de Atividades</h2>
            <ToggleGroup 
                type="single" 
                value={layout} 
                onValueChange={(value) => {
                    if (value === 'list' || value === 'grid') { setLayout(value); }
                }} 
                className="h-9"
            >
                <ToggleGroupItem value="list" aria-label="Ver como lista"><List className="h-4 w-4" /></ToggleGroupItem>
                <ToggleGroupItem value="grid" aria-label="Ver como grade"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
            </ToggleGroup>
        </div>
        <div className={layout === 'list' ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"}>
            {posts.map((post) => (
                <motion.div 
                  key={post.id}
                  layoutId={`card-container-${post.id}`} 
                  whileHover={layout === 'grid' ? { scale: 1.03, transition: { duration: 0.2 } } : {}}
                  className={layout === 'grid' ? "cursor-pointer" : ""}
                >
                    <PostCard 
                        post={post}
                        layout={layout}
                        isCommentSectionOpen={commentingPostId === post.id}
                        onLikeToggle={handleLikeToggle}
                        onCommentToggle={handleCommentToggle}
                        onAddComment={handleAddComment}
                        onCardClick={() => layout === 'grid' && setSelectedId(post.id)}
                    />
                </motion.div>
            ))}
        </div>
      </div>
      
      <div className="lg:col-span-1 space-y-6">
          {/* ... Coluna da Direita ... */}
      </div>

      <AnimatePresence>
        {selectedPost && (
          <PostModal 
            post={selectedPost}
            onClose={() => setSelectedId(null)}
            onLikeToggle={handleLikeToggle}
            onAddComment={handleAddComment}
          />
        )}
      </AnimatePresence>
    </div>
  )
}