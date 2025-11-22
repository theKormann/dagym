// ================== INÍCIO DO ARQUIVO ==================
"use client"

import { useMemo, useState, useEffect, FormEvent, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Heart,
  MessageSquare,
  ImagePlus,
  Send,
  Loader2,
  X,
  List,
  LayoutGrid
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardFooter, CardHeader } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

import { PostCard } from "./post/postCard"
import { PostModal } from "./post/PostModal"


// --- TIPOS (Frontend) ---
export type Comment = {
  id: string
  author: { name: string; username: string; avatar: string }
  text: string
  timestamp: string
}

export type PostAuthor = {
  name: string
  username: string
  avatar: string
}

type ChartDataPoint = { name: string; value: number; unit: string }
type ChartData = { title: string; period: string; unit: string; data: ChartDataPoint[] }

export type Post = {
  id: string
  author: PostAuthor
  timestamp: string
  content: string
  postType: "standard" | "chart"
  imageUrl: string | null
  chartData?: ChartData
  likes: number
  comments: number
  isLiked: boolean
  commentsList: Comment[]
}

// --- Tipos (Backend) ---
type UserResponse = {
  id: number
  name: string
  username: string
  avatarUrl: string
}

type PostResponse = {
  id: number
  description: string
  photoUrl: string | null
  publicationDate: string
  author: UserResponse
  likeCount: number
  commentCount: number
}

// Interface para o usuário do LocalStorage
interface CurrentUser {
  id: number
  name: string
  username: string
  avatarUrl?: string
}

// --- CONFIG ---
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
const UPLOAD_URL = "http://localhost:8080/uploads"

// --- MAP POST ---
function mapBackendPostToFrontend(backendPost: PostResponse): Post {
  return {
    id: backendPost.id.toString(),
    content: backendPost.description,
    imageUrl: backendPost.photoUrl ? `${UPLOAD_URL}/${backendPost.photoUrl}` : null,
    timestamp: new Date(backendPost.publicationDate).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }),
    author: {
      name: backendPost.author.name,
      username: backendPost.author.username,
      avatar: backendPost.author.avatarUrl
        ? `${UPLOAD_URL}/${backendPost.author.avatarUrl}`
        : ""
    },
    likes: backendPost.likeCount,
    comments: backendPost.commentCount,
    isLiked: false,
    commentsList: [],
    postType: "standard",
    chartData: undefined
  }
}

export function HomePage() {
  const [layout, setLayout] = useState<"list" | "grid">("list")
  const [posts, setPosts] = useState<Post[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

  const [newPostContent, setNewPostContent] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPosting, setIsPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // -----------------------------
  // 🔔 AVISO DE ATUALIZAR PERFIL
  // -----------------------------
  const [showUpdateAlert, setShowUpdateAlert] = useState(false)

  useEffect(() => {
    const alreadyShown = localStorage.getItem("dagym_profile_alert")

    if (!alreadyShown) {
      // primeira vez → mostrar aviso
      setShowUpdateAlert(true)
      localStorage.setItem("dagym_profile_alert", "shown")
    }
  }, [])

  // -----------------------------
  // Carregar usuário
  // -----------------------------
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("dagym_user")
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser))
      }
    } catch (e) {
      console.error("Erro ao ler usuário:", e)
    }
  }, [])

  // Handle File Change
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const removeSelectedImage = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // -----------------------------
  // Buscar Posts
  // -----------------------------
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch(`${BASE_URL}/api/posts`)
        if (!response.ok) throw new Error("Não foi possível carregar os posts.")

        const backendPosts: PostResponse[] = await response.json()
        setPosts(backendPosts.map(mapBackendPostToFrontend))
      } catch (err: any) {
        setError(err.message || "Erro desconhecido.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPosts()
  }, [])

  // --------------------------------------------
  // Publicar
  // --------------------------------------------
  const handlePublishPost = async () => {
    if ((!newPostContent.trim() && !selectedFile) || isPosting) return
    if (!currentUser) {
      setError("Você precisa estar logado para publicar.")
      return
    }

    setIsPosting(true)
    setError(null)

    const formData = new FormData()
    formData.append("description", newPostContent)
    if (selectedFile) formData.append("imageFile", selectedFile)

    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("dagym_token")

      const headers: HeadersInit = {}
      if (token) headers["Authorization"] = `Bearer ${token}`

      const response = await fetch(
        `${BASE_URL}/api/posts/user/${currentUser.id}`,
        {
          method: "POST",
          headers,
          body: formData
        }
      )

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Falha ao publicar: ${errorData}`)
      }

      const backendPost: PostResponse = await response.json()
      setPosts([mapBackendPostToFrontend(backendPost), ...posts])
      setNewPostContent("")
      removeSelectedImage()
    } catch (err: any) {
      setError(err.message || "Erro ao publicar.")
    } finally {
      setIsPosting(false)
    }
  }

  const handleLikeToggle = (postId: string) => {
    setPosts(
      posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              isLiked: !p.isLiked,
              likes: p.isLiked ? p.likes - 1 : p.likes + 1
            }
          : p
      )
    )
  }

  const handleAddComment = (postId: string, commentText: string) => {
    if (!commentText.trim() || !currentUser) return

    const newComment: Comment = {
      id: new Date().toISOString(),
      author: {
        name: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.avatarUrl
          ? `${UPLOAD_URL}/${currentUser.avatarUrl}`
          : ""
      },
      text: commentText,
      timestamp: "agora mesmo"
    }

    setPosts(
      posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: p.comments + 1,
              commentsList: [...p.commentsList, newComment]
            }
          : p
      )
    )
  }

  const handleCommentToggle = (postId: string) => {
    setCommentingPostId((prev) => (prev === postId ? null : postId))
  }

  const handleCommentClickFromModal = (postId: string) => {
    setLayout("list")
    setCommentingPostId(postId)
    setSelectedId(null)
  }

  const selectedPost = selectedId ? posts.find((p) => p.id === selectedId) : null

  // ===================== RENDER =====================

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* FEED */}
      <div className="lg:col-span-3 space-y-6">

        {/* ----------------------------- */}
        {/* 🔔 AVISO DE ATUALIZAR PERFIL */}
        {/* ----------------------------- */}
        {showUpdateAlert && (
          <Alert className="border-yellow-500/40 bg-yellow-500/10">
            <AlertTitle className="font-bold">Atualize seu perfil</AlertTitle>
            <AlertDescription className="flex justify-between items-center">
              Para melhorar sua experiência, complete suas informações no perfil.
              <Button
                className="ml-4"
                variant="secondary"
                onClick={() => setShowUpdateAlert(false)}
              >
                Me lembre mais tarde
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* ----------------------------- */}
        {/* CAIXA DE CRIAR POST */}
        {/* ----------------------------- */}
        <Card>
          <CardHeader className="flex flex-row items-start gap-4 p-4">
            <Avatar>
              {currentUser?.avatarUrl && (
                <AvatarImage
                  src={`${UPLOAD_URL}/${currentUser.avatarUrl}`}
                  className="object-cover"
                />
              )}
              <AvatarFallback>
                {currentUser
                  ? currentUser.username.substring(0, 2).toUpperCase()
                  : "?"}
              </AvatarFallback>
            </Avatar>

            <div className="w-full space-y-3">
              <Textarea
                placeholder={
                  currentUser
                    ? `Compartilhe seu progresso, ${
                        (currentUser.name || currentUser.username || "Atleta").split(
                          " "
                        )[0]
                      }...`
                    : "O que você está pensando?"
                }
                className="bg-muted border-none focus-visible:ring-1 focus-visible:ring-ring"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                disabled={isPosting || !currentUser}
                rows={3}
              />

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg, image/gif"
              />

              {previewUrl && (
                <div className="relative w-full max-w-md">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="rounded-lg object-cover w-full"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 rounded-full"
                    onClick={removeSelectedImage}
                    disabled={isPosting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardFooter className="flex justify-between items-center p-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPosting || !currentUser}
            >
              <ImagePlus className="h-5 w-5" />
            </Button>

            <Button
              className="rounded-2xl w-28"
              onClick={handlePublishPost}
              disabled={
                isPosting ||
                (!newPostContent.trim() && !selectedFile) ||
                !currentUser
              }
            >
              {isPosting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Publicar <Send className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* -------------------------------- */}
        {/* FEED / TOGGLE GROUP */}
        {/* -------------------------------- */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold tracking-tight">
            Feed de Atividades
          </h2>

          <ToggleGroup
            type="single"
            value={layout}
            onValueChange={(value) => {
              if (value === "list" || value === "grid") setLayout(value)
            }}
            className="h-9"
          >
            <ToggleGroupItem value="list">
              <List className="h-4 w-4" />
            </ToggleGroupItem>

            <ToggleGroupItem value="grid">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* -------------------------------- */}
        {/* POSTS */}
        {/* -------------------------------- */}
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-lg text-muted-foreground">
              Carregando feed...
            </p>
          </div>
        ) : !error && posts.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-lg text-muted-foreground">
              Nenhuma publicação ainda. Seja o primeiro!
            </p>
          </div>
        ) : (
          <div
            className={
              layout === "list"
                ? "space-y-4"
                : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            }
          >
            {posts.map((post) => (
              <motion.div
                key={post.id}
                layoutId={`card-${post.id}`}
                whileHover={
                  layout === "grid"
                    ? { scale: 1.03, transition: { duration: 0.2 } }
                    : {}
                }
                className={layout === "grid" ? "cursor-pointer" : ""}
              >
                <PostCard
                  post={post}
                  layout={layout}
                  isCommentSectionOpen={commentingPostId === post.id}
                  onLikeToggle={handleLikeToggle}
                  onCommentToggle={handleCommentToggle}
                  onAddComment={handleAddComment}
                  onCardClick={() =>
                    layout === "grid" && setSelectedId(post.id)
                  }
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* COLUNA DIREITA */}
      <div className="lg:col-span-1 space-y-6"></div>

      {/* MODAL */}
      <AnimatePresence>
        {selectedPost && (
          <PostModal
            post={selectedPost}
            onClose={() => setSelectedId(null)}
            onLikeToggle={handleLikeToggle}
            onAddComment={handleAddComment}
            onCommentClick={handleCommentClickFromModal}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
