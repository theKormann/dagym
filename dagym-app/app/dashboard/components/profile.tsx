"use client"

import React, { useMemo, useState, useEffect, FormEvent, useRef } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import {
    Heart,
    MessageSquare,
    Image as ImageIcon,
    Send,
    Loader2,
    X,
    Camera,
    Dumbbell,
    Copy,
    UserPlus,
    UserCheck,
    Users,
    PlusCircle,
    Trash2,
    Utensils,
    Flame,
    Beef,
    Wheat,
    Lollipop,
    Trophy,
    Award,
    ShieldCheck,
    Repeat,
    MessageCircle, // Ícone de mensagem
    Minus // Ícone de minimizar
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

// --- CONFIGURAÇÕES ---
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const UPLOAD_URL = "http://localhost:8080/uploads";

// --- INTERFACES ---

interface Challenge {
    id: number
    title: string
    description: string
    category: string
    duration: string
    totalTarget: number
    reward: string
    participantsCount: number
}

interface UserChallenge {
    id: number
    challenge: Challenge
    status: "active" | "completed"
    progress: number
}

interface Exercise {
    name: string
    sets: string
    reps: string
    image: string
}

interface WeeklySchedule {
    [key: string]: Exercise[]
}

interface WorkoutPlan {
    id: string
    title: string
    description: string
    level: string
    weeklySchedule: WeeklySchedule
}

interface FoodItem {
    name: string
    qty: string
    calories: number
    protein: number
    carbs: number
    fats: number
}

interface MealMap {
    [mealName: string]: FoodItem[]
}

interface WeeklyDiet {
    [dayName: string]: MealMap
}

interface DietPlan {
    name: string
    dailyGoal: { calories: number; protein: number; carbs: number; fats: number }
    week: WeeklyDiet
}

// Interface de Resposta do Backend (Com Recursão para Repost)
interface BackendPostResponse {
    id: number;
    description: string;
    photoUrl: string | null;
    publicationDate: string;
    author: { id: number; name: string; username: string; avatarUrl: string; };
    likeCount: number;
    commentCount: number;
    originalPost?: BackendPostResponse | null; // Recursão
}

interface User {
    id: number;
    nome: string;
    username: string;
    email?: string;
    description?: string;
    weight?: number;
    height?: number;
    diet?: string;
    workout?: string;
    avatarUrl?: string;
    followersCount?: number;
    followingCount?: number;
    postCount?: number;
    isFollowing?: boolean;
}

interface UserSimple {
    id: number;
    nome: string;
    username: string;
    avatarUrl?: string;
}

// Interface de Post Frontend (Com Recursão)
interface Post {
    id: number;
    imageUrl: string | null;
    caption: string;
    likes: number;
    comments: number;
    author: {
        id: number;
        name: string;
        username: string;
        avatarUrl?: string;
    };
    timestamp: string;
    originalPost?: Post | null; // Post Aninhado (Repost)
}

interface Story {
    id: number;
    mediaUrl: string;
    createdAt: string;
    expiresAt: string;
}

// Interface para Mensagens de Chat
interface ChatMessage {
    id: string;
    senderId: number;
    text: string;
    timestamp: Date;
    isMine: boolean;
}

interface ProfilePageProps {
    profileId?: number | null;
}

// --- HELPERS ---

function mapBackendToProfilePost(backendPost: BackendPostResponse): Post {
    const post: Post = {
        id: backendPost.id,
        caption: backendPost.description,
        imageUrl: backendPost.photoUrl ? `${UPLOAD_URL}/${backendPost.photoUrl}` : null,
        likes: backendPost.likeCount,
        comments: backendPost.commentCount,
        author: {
            id: backendPost.author.id,
            name: backendPost.author.name,
            username: backendPost.author.username,
            avatarUrl: backendPost.author.avatarUrl
        },
        timestamp: new Date(backendPost.publicationDate).toLocaleDateString(),
        originalPost: null
    };

    if (backendPost.originalPost) {
        post.originalPost = mapBackendToProfilePost(backendPost.originalPost);
    }

    return post;
}

const calculateBmi = (weight: number, heightInMeters: number) => {
    if (heightInMeters <= 0 || weight <= 0) return 0
    return weight / (heightInMeters * heightInMeters)
}

const getBmiStatus = (bmi: number) => {
    if (bmi <= 0) return { label: "Inválido", color: "gray" }
    if (bmi < 18.5) return { label: "Abaixo do Peso", color: "blue" }
    if (bmi < 24.9) return { label: "Peso Ideal", color: "green" }
    if (bmi < 29.9) return { label: "Sobrepeso", color: "yellow" }
    if (bmi < 34.9) return { label: "Obesidade Grau I", color: "orange" }
    if (bmi < 39.9) return { label: "Obesidade Grau II", color: "red" }
    return { label: "Obesidade Grau III", color: "darkred" }
}

const weekDays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]
const mealTypesOrder = ["Café da Manhã", "Almoço", "Lanche da Tarde", "Jantar", "Ceia"]

// --- COMPONENTE PRINCIPAL ---

export function ProfilePage({ profileId }: ProfilePageProps) {
    const router = useRouter();

    // --- Estados Principais ---
    const [user, setUser] = useState<User | null>(null)
    const [loggedUser, setLoggedUser] = useState<User | null>(null)
    const [isOwner, setIsOwner] = useState(false)
    const [posts, setPosts] = useState<Post[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // --- UI States ---
    const [activeTab, setActiveTab] = useState<'posts' | 'workout' | 'diet' | 'achievements'>('posts')

    // Treino States
    const [selectedWorkoutDay, setSelectedWorkoutDay] = useState(weekDays[0])
    const [parsedWorkout, setParsedWorkout] = useState<WorkoutPlan | null>(null)

    // Dieta States
    const [selectedDietDay, setSelectedDietDay] = useState(weekDays[0])
    const [parsedDiet, setParsedDiet] = useState<DietPlan | null>(null)

    // Desafios States
    const [completedChallenges, setCompletedChallenges] = useState<UserChallenge[]>([])

    // --- Form States ---
    const [weight, setWeight] = useState(0)
    const [height, setHeight] = useState(0)
    const [description, setDescription] = useState("")
    const [diet, setDiet] = useState("")
    const [workout, setWorkout] = useState("")
    const [postCaption, setPostCaption] = useState("")

    // --- Upload states ---
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const storyInputRef = useRef<HTMLInputElement>(null);

    // --- Loading states ---
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isUploadingStory, setIsUploadingStory] = useState(false);
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
    const [isCreatingPost, setIsCreatingPost] = useState(false)
    const [isMirroring, setIsMirroring] = useState(false)
    const [isFollowingLoading, setIsFollowingLoading] = useState(false);

    // --- Modal States (Followers) ---
    const [showUserListModal, setShowUserListModal] = useState(false);
    const [userListTitle, setUserListTitle] = useState("");
    const [userList, setUserList] = useState<UserSimple[]>([]);
    const [isUserListLoading, setIsUserListLoading] = useState(false);

    // --- STATES DE STORY ---
    const [stories, setStories] = useState<Story[]>([]);
    const [showStoryViewer, setShowStoryViewer] = useState(false);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [isDeletingStory, setIsDeletingStory] = useState(false);

    // --- STATES DE CHAT ---
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessage, setChatMessage] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // --- FETCH DATA ---
    useEffect(() => {
        const storedUserStr = localStorage.getItem('dagym_user');
        if (!storedUserStr) { router.push('/login'); return; }

        let currentLoggedUser: User;
        try {
            currentLoggedUser = JSON.parse(storedUserStr);
            setLoggedUser(currentLoggedUser);
        } catch (e) { router.push('/login'); return; }

        const targetUserId = profileId || currentLoggedUser.id;
        const ownerStatus = targetUserId === currentLoggedUser.id;
        setIsOwner(ownerStatus);

        const fetchProfileData = async () => {
            try {
                setIsLoading(true)
                // 1. Fetch User Profile
                const userRes = await fetch(`${API_URL}/api/users/${targetUserId}/profile?currentUserId=${currentLoggedUser.id}`)

                let userData: User;
                if (!userRes.ok && userRes.status === 404) {
                    const fallbackRes = await fetch(`${API_URL}/api/dashboard/${targetUserId}`);
                    if (!fallbackRes.ok) throw new Error("Falha ao buscar perfil");
                    userData = await fallbackRes.json();
                } else if (!userRes.ok) {
                    throw new Error(`Erro API: ${userRes.status}`);
                } else {
                    userData = await userRes.json();
                }

                setUser(userData)
                setWeight(userData.weight || 0)
                setHeight(userData.height || 0)
                setDescription(userData.description || "")
                setDiet(userData.diet || "")
                setWorkout(userData.workout || "")

                // Parse JSONs
                if (userData.workout) { try { setParsedWorkout(JSON.parse(userData.workout)); } catch (e) { setParsedWorkout(null); } }
                if (userData.diet) { try { setParsedDiet(JSON.parse(userData.diet)); } catch (e) { setParsedDiet(null); } }

                // 2. Fetch Posts
                const postsRes = await fetch(`${API_URL}/api/posts?userId=${targetUserId}&type=general`);
                if (postsRes.ok) {
                    const allBackendPosts: BackendPostResponse[] = await postsRes.json();
                    const userPosts = allBackendPosts
                        .filter(post => post.author.id === Number(targetUserId))
                        .map(mapBackendToProfilePost);
                    setPosts(userPosts);
                }

                // 3. Fetch Stories
                const storiesRes = await fetch(`${API_URL}/api/stories/user/${targetUserId}`);
                if (storiesRes.ok) {
                    const storiesData = await storiesRes.json();
                    setStories(storiesData);
                }

                // 4. Fetch Challenges
                const challengesRes = await fetch(`${API_URL}/api/challenges/user/${targetUserId}`);
                if (challengesRes.ok) {
                    const allUserChallenges: UserChallenge[] = await challengesRes.json();
                    const completed = allUserChallenges.filter(uc => uc.status === "completed");
                    setCompletedChallenges(completed);
                }

            } catch (err) {
                setError(err instanceof Error ? err.message : "Erro desconhecido")
            } finally {
                setIsLoading(false)
            }
        }

        fetchProfileData()
    }, [API_URL, router, profileId])

    const bmiData = useMemo(() => {
        const bmiValue = calculateBmi(weight, height)
        return { value: bmiValue.toFixed(1), status: getBmiStatus(bmiValue) }
    }, [weight, height])

    const dailyDietTotals = useMemo(() => {
        let totals = { calories: 0, protein: 0, carbs: 0, fats: 0 }
        if (!parsedDiet || !parsedDiet.week[selectedDietDay]) return totals
        Object.values(parsedDiet.week[selectedDietDay]).forEach((foods) => {
            foods.forEach((food) => {
                totals.calories += Number(food.calories) || 0
                totals.protein += Number(food.protein) || 0
                totals.carbs += Number(food.carbs) || 0
                totals.fats += Number(food.fats) || 0
            })
        })
        return totals
    }, [parsedDiet, selectedDietDay])

    // --- LÓGICA DE CHAT ---
    const handleStartChat = () => {
        if (!user) return;
        setIsChatOpen(true);
        // Mensagem de boas vindas fake se vazio
        if(messages.length === 0) {
            setMessages([{
                id: 'init',
                senderId: user.id,
                text: `Olá! Este é o início da sua conversa com ${user.nome}.`,
                timestamp: new Date(),
                isMine: false
            }]);
        }
    };

    const handleSendMessage = (e: FormEvent) => {
        e.preventDefault();
        if (!chatMessage.trim() || !user || !loggedUser) return;

        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            senderId: loggedUser.id,
            text: chatMessage,
            timestamp: new Date(),
            isMine: true
        };

        setMessages(prev => [...prev, newMessage]);
        setChatMessage("");

        // SIMULAÇÃO: Salvar no localStorage para aparecer no Inbox do Navbar
        const inboxKey = 'dagym_inbox_chats';
        const existingChatsStr = localStorage.getItem(inboxKey);
        let existingChats = existingChatsStr ? JSON.parse(existingChatsStr) : [];
        
        // Remove entrada antiga desse usuário se existir para colocar no topo
        existingChats = existingChats.filter((c: any) => c.userId !== user.id);
        
        // Adiciona nova entrada
        existingChats.unshift({
            userId: user.id,
            username: user.username,
            avatarUrl: user.avatarUrl,
            lastMessage: newMessage.text,
            timestamp: new Date().toISOString()
        });

        localStorage.setItem(inboxKey, JSON.stringify(existingChats));
        
        // Dispara evento para o Navbar atualizar
        window.dispatchEvent(new Event('storage'));
    };

    // Scroll para o fundo do chat
    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages, isChatOpen]);


    // --- OUTROS HANDLERS ---
    const handleFollowToggle = async () => {
        if (!user || !loggedUser) return;
        setIsFollowingLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/users/${user.id}/follow?followerId=${loggedUser.id}`, { method: "POST" });
            if (!res.ok) throw new Error("Falha ao seguir");
            setUser(prev => {
                if (!prev) return null;
                const newIsFollowing = !prev.isFollowing;
                const newFollowersCount = (prev.followersCount || 0) + (newIsFollowing ? 1 : -1);
                return { ...prev, isFollowing: newIsFollowing, followersCount: newFollowersCount };
            });
        } catch (error) { console.error(error); alert("Erro ao alterar status de seguir."); } finally { setIsFollowingLoading(false); }
    };

    const openUserList = async (type: 'followers' | 'following') => {
        if (!user) return;
        setUserListTitle(type === 'followers' ? 'Seguidores' : 'Seguindo');
        setShowUserListModal(true);
        setIsUserListLoading(true);
        setUserList([]);
        try {
            const res = await fetch(`${API_URL}/api/users/${user.id}/${type}`);
            if (res.ok) { const data = await res.json(); setUserList(data); }
        } catch (error) { console.error(error); } finally { setIsUserListLoading(false); }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); }
    };
    const removeSelectedImage = () => { setSelectedFile(null); setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = ""; };

    const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;
        setIsUploadingAvatar(true);
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await fetch(`${API_URL}/api/users/${user.id}/avatar`, { method: "POST", body: formData });
            if (!res.ok) throw new Error();
            const updatedUser: User = await res.json();
            setUser(prev => prev ? ({ ...updatedUser, isFollowing: prev.isFollowing, followersCount: prev.followersCount, followingCount: prev.followingCount }) : updatedUser);
            if (isOwner) { localStorage.setItem('dagym_user', JSON.stringify(updatedUser)); window.dispatchEvent(new Event("storage")); }
            alert("Foto atualizada!");
        } catch (err) { alert("Erro ao atualizar foto"); } finally { setIsUploadingAvatar(false); if (avatarInputRef.current) avatarInputRef.current.value = ""; }
    };

    const handleStoryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;
        setIsUploadingStory(true);
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await fetch(`${API_URL}/api/stories/user/${user.id}`, { method: "POST", body: formData });
            if (!res.ok) throw new Error("Falha ao enviar story");
            const newStory: Story = await res.json();
            setStories(prev => [...prev, newStory]);
            alert("Story publicado!");
        } catch (err) { console.error(err); alert("Erro ao publicar story."); } finally { setIsUploadingStory(false); if (storyInputRef.current) storyInputRef.current.value = ""; }
    }

    const handleDeleteStory = async () => {
        if (!user || stories.length === 0) return;
        const storyToDelete = stories[currentStoryIndex];
        if (!confirm("Tem certeza que deseja excluir este story?")) return;
        setIsDeletingStory(true);
        try {
            const res = await fetch(`${API_URL}/api/stories/${storyToDelete.id}?userId=${user.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Falha ao excluir");
            const updatedStories = stories.filter(s => s.id !== storyToDelete.id);
            setStories(updatedStories);
            if (updatedStories.length === 0) { setShowStoryViewer(false); }
            else if (currentStoryIndex >= updatedStories.length) { setCurrentStoryIndex(updatedStories.length - 1); }
        } catch (error) { console.error(error); alert("Erro ao deletar story."); } finally { setIsDeletingStory(false); }
    };

    const openStoryViewer = () => { if (stories.length > 0) { setCurrentStoryIndex(0); setShowStoryViewer(true); } }
    const nextStory = (e: React.MouseEvent) => { e.stopPropagation(); if (currentStoryIndex < stories.length - 1) { setCurrentStoryIndex(prev => prev + 1); } else { setShowStoryViewer(false); } }
    const prevStory = (e: React.MouseEvent) => { e.stopPropagation(); if (currentStoryIndex > 0) { setCurrentStoryIndex(prev => prev - 1); } }

    const handleUpdateProfile = async (e: FormEvent) => {
        e.preventDefault(); if (!user) return; setIsUpdatingProfile(true);
        try {
            const res = await fetch(`${API_URL}/api/dashboard/${user.id}/profile`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ weight, height, description, diet, workout }) });
            if (!res.ok) throw new Error();
            const u = await res.json();
            setUser(prev => prev ? { ...u, avatarUrl: prev.avatarUrl, isFollowing: prev.isFollowing, followersCount: prev.followersCount, followingCount: prev.followingCount } : u);
            if (isOwner) localStorage.setItem('dagym_user', JSON.stringify(u)); alert("Perfil salvo!");
        } catch (e) { alert("Erro ao salvar"); } finally { setIsUpdatingProfile(false); }
    };

    const handleCreatePost = async (e: FormEvent) => {
        e.preventDefault(); if ((!postCaption.trim() && !selectedFile) || !user) return; setIsCreatingPost(true);
        const fd = new FormData(); fd.append('description', postCaption); if (selectedFile) fd.append('imageFile', selectedFile);
        try {
            const res = await fetch(`${API_URL}/api/posts/user/${user.id}`, { method: 'POST', body: fd });
            if (!res.ok) throw new Error(); const newP = await res.json(); setPosts([mapBackendToProfilePost(newP), ...posts]);
            setPostCaption(""); removeSelectedImage();
        } catch (e) { alert("Erro ao publicar"); } finally { setIsCreatingPost(false); }
    };

    const handleRepost = async (postId: number) => {
        if (!loggedUser) return;
        const userQuote = window.prompt("Adicionar um comentário ao repost? (Deixe em branco para apenas repostar)");
        if (userQuote === null) return; 
        try {
            const res = await fetch(`${API_URL}/api/posts/${postId}/repost?userId=${loggedUser.id}`, {
                method: "POST",
                headers: userQuote ? { "Content-Type": "application/json" } : undefined,
                body: userQuote ? JSON.stringify({ comment: userQuote }) : undefined
            });
            if (!res.ok) throw new Error("Erro ao repostar");
            const newPostBackend: BackendPostResponse = await res.json();
            const newPostFrontend = mapBackendToProfilePost(newPostBackend);
            setPosts(prev => [newPostFrontend, ...prev]);
            alert("Repostado com sucesso!");
        } catch (error) { console.error(error); alert("Não foi possível repostar."); }
    };

    const handleMirrorWorkout = async () => {
        if (!loggedUser || !user || !parsedWorkout) return;
        if (!confirm(`Copiar o treino "${parsedWorkout.title}"?`)) return;
        setIsMirroring(true);
        try {
            const res = await fetch(`${API_URL}/api/workout/${loggedUser.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workoutJson: user.workout }) });
            if (!res.ok) throw new Error(); alert("Treino copiado para seu perfil!");
        } catch (err) { alert("Erro ao copiar."); } finally { setIsMirroring(false); }
    }

    const handleMirrorDiet = async () => {
        if (!loggedUser || !user || !parsedDiet) return;
        if (!confirm(`Copiar a dieta "${parsedDiet.name}"?`)) return;
        setIsMirroring(true);
        try {
            const res = await fetch(`${API_URL}/api/diet/${loggedUser.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dietJson: user.diet }) });
            if (!res.ok) throw new Error(); alert("Dieta copiada para seu perfil!");
        } catch (err) { alert("Erro ao copiar dieta."); } finally { setIsMirroring(false); }
    }

    if (isLoading) return <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin text-red-800" /></div>
    if (error || !user) return <p className="text-center text-red-600">{error || "Usuário não encontrado"}</p>

    const dailyExercises = parsedWorkout?.weeklySchedule[selectedWorkoutDay] || [];
    const dailyMeals = parsedDiet?.week[selectedDietDay] || {};
    const hasStories = stories.length > 0;
    const sortedMealKeys = Object.keys(dailyMeals).sort((a, b) => mealTypesOrder.indexOf(a) - mealTypesOrder.indexOf(b))

    return (
        <>
            {/* Cabeçalho do Perfil */}
            <Card className="mb-6">
                <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
                    {/* Avatar e Stories */}
                    <div className="relative flex flex-col items-center">
                        <div
                            className={cn(
                                "relative p-[3px] rounded-full cursor-pointer transition-all",
                                hasStories ? "bg-gradient-to-tr from-red-900 via-rose-800 to-red-600 hover:scale-105" : "bg-transparent border-4 border-transparent"
                            )}
                            onClick={hasStories ? openStoryViewer : undefined}
                        >
                            <div className="bg-white rounded-full p-[2px]">
                                <Avatar className="h-28 w-28 border-2 border-white">
                                    {user.avatarUrl && <AvatarImage src={`${UPLOAD_URL}/${user.avatarUrl}`} className="object-cover" />}
                                    <AvatarFallback className="text-4xl">{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </div>
                        </div>

                        {isOwner && (
                            <>
                                <div className="absolute top-0 right-0 bg-black/60 rounded-full p-1.5 cursor-pointer hover:bg-black/80 transition-colors z-20" onClick={(e) => { e.stopPropagation(); avatarInputRef.current?.click(); }} title="Alterar Foto de Perfil">
                                    {isUploadingAvatar ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Camera className="h-4 w-4 text-white" />}
                                </div>
                                <div className="absolute bottom-0 right-2 bg-red-800 rounded-full cursor-pointer hover:bg-red-900 transition-colors z-20 border-2 border-white" onClick={(e) => { e.stopPropagation(); storyInputRef.current?.click(); }} title="Adicionar Story">
                                    {isUploadingStory ? <Loader2 className="h-6 w-6 text-white animate-spin p-1" /> : <PlusCircle className="h-6 w-6 text-white" />}
                                </div>
                            </>
                        )}
                        <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                        <input type="file" ref={storyInputRef} onChange={handleStoryUpload} className="hidden" accept="image/*,video/*" />
                    </div>

                    {/* Info do Usuário */}
                    <div className="text-center sm:text-left flex-1 w-full">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between w-full gap-4">
                            <div>
                                <h2 className="text-2xl font-bold">{user.nome}</h2>
                                <p className="text-muted-foreground">@{user.username.toLowerCase()}</p>
                                {user.description && <p className="mt-2 text-sm max-w-lg">{user.description}</p>}
                            </div>

                            <div className="mt-2 sm:mt-0 flex gap-2">
                                {isOwner ? (
                                    <Button variant="outline" className="gap-2" disabled>Editar Perfil (Abaixo)</Button>
                                ) : (
                                    <>
                                        <Button
                                            onClick={handleFollowToggle}
                                            disabled={isFollowingLoading}
                                            className={cn(
                                                "gap-2 w-32 transition-all",
                                                user.isFollowing ? "bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300" : "bg-red-700 hover:bg-red-800 text-white"
                                            )}
                                        >
                                            {isFollowingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> :
                                                user.isFollowing ? <><UserCheck className="h-4 w-4" /> Seguindo</> : <><UserPlus className="h-4 w-4" /> Seguir</>
                                            }
                                        </Button>
                                        
                                        {/* --- BOTÃO DE DM (CONDICIONAL) --- */}
                                        {user.isFollowing && (
                                            <Button 
                                                variant="outline" 
                                                className="gap-2 border-red-700 text-red-700 hover:bg-red-50"
                                                onClick={handleStartChat}
                                            >
                                                <MessageCircle className="h-4 w-4" />
                                                Mensagem
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="mt-6 flex justify-center sm:justify-start gap-8">
                            <div className="text-center">
                                <p className="font-bold text-lg">{posts.length}</p>
                                <p className="text-sm text-muted-foreground">Posts</p>
                            </div>
                            <button onClick={() => openUserList('followers')} className="text-center hover:opacity-70 transition-opacity">
                                <p className="font-bold text-lg">{user.followersCount || 0}</p>
                                <p className="text-sm text-muted-foreground">Seguidores</p>
                            </button>
                            <button onClick={() => openUserList('following')} className="text-center hover:opacity-70 transition-opacity">
                                <p className="font-bold text-lg">{user.followingCount || 0}</p>
                                <p className="text-sm text-muted-foreground">Seguindo</p>
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Layout Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className={isOwner ? "lg:col-span-3 space-y-6" : "lg:col-span-4 space-y-6"}>
                    {/* Navegação de Abas */}
                    <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
                        <Button variant={activeTab === 'posts' ? 'default' : 'outline'} onClick={() => setActiveTab('posts')} className="gap-2"><ImageIcon className="w-4 h-4" /> Publicações</Button>
                        <Button variant={activeTab === 'workout' ? 'default' : 'outline'} onClick={() => setActiveTab('workout')} className="gap-2"><Dumbbell className="w-4 h-4" /> Treino</Button>
                        <Button variant={activeTab === 'diet' ? 'default' : 'outline'} onClick={() => setActiveTab('diet')} className="gap-2"><Utensils className="w-4 h-4" /> Dieta</Button>
                        <Button variant={activeTab === 'achievements' ? 'default' : 'outline'} onClick={() => setActiveTab('achievements')} className="gap-2"><Trophy className="w-4 h-4" /> Conquistas</Button>
                    </div>

                    {/* --- TAB: POSTS --- */}
                    {activeTab === 'posts' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {isOwner && (
                                <form onSubmit={handleCreatePost}>
                                    <Card><CardHeader><CardTitle>Criar Publicação</CardTitle></CardHeader><CardContent><div className="grid w-full gap-3"><Textarea placeholder="No que você está pensando hoje?" value={postCaption} onChange={(e) => setPostCaption(e.target.value)} disabled={isCreatingPost} />{previewUrl && <div className="relative w-full max-w-xs"><img src={previewUrl} alt="Preview" className="rounded-lg w-full" /><Button variant="destructive" size="icon" className="absolute top-2 right-2 rounded-full h-6 w-6" onClick={removeSelectedImage} type="button"><X className="h-3 w-3" /></Button></div>}<div className="flex justify-between"><Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}><ImageIcon className="h-5 w-5 text-muted-foreground" /></Button><Button type="submit" className="rounded-2xl" disabled={isCreatingPost || (!postCaption.trim() && !selectedFile)}>{isCreatingPost ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Publicar</Button></div></div></CardContent></Card>
                                </form>
                            )}
                            <div className="grid grid-cols-1 gap-4">
                                {posts.length > 0 ? posts.map((post) => (
                                    <Card key={post.id} className="overflow-hidden border-gray-200">
                                        {post.originalPost && (<div className="px-4 pt-2 flex items-center gap-2 text-xs text-muted-foreground font-semibold bg-muted/20"><Repeat className="h-3 w-3" /><span>{post.author.name} repostou</span></div>)}
                                        <CardHeader className="flex flex-row items-center gap-3 pb-2"><Avatar className="h-10 w-10">{post.author.avatarUrl && <AvatarImage src={post.author.avatarUrl} />}<AvatarFallback>{post.author.name.substring(0, 2)}</AvatarFallback></Avatar><div className="flex-1"><p className="font-semibold text-sm">{post.author.name}</p><p className="text-xs text-muted-foreground">@{post.author.username} • {post.timestamp}</p></div></CardHeader>
                                        <CardContent className="pb-2">{post.caption && <p className="text-sm mb-3 whitespace-pre-wrap">{post.caption}</p>}{post.imageUrl && (<img src={post.imageUrl} alt="Post" className="rounded-lg w-full object-cover max-h-96 mb-3" />)}{post.originalPost && (<div className="mt-2 border rounded-lg p-3 bg-muted/30"><div className="flex items-center gap-2 mb-2"><Avatar className="h-6 w-6">{post.originalPost.author.avatarUrl && <AvatarImage src={post.originalPost.author.avatarUrl} />}<AvatarFallback>{post.originalPost.author.name.substring(0, 2)}</AvatarFallback></Avatar><span className="font-semibold text-sm">{post.originalPost.author.name}</span><span className="text-xs text-muted-foreground">@{post.originalPost.author.username}</span></div><p className="text-sm mb-2 line-clamp-3">{post.originalPost.caption}</p>{post.originalPost.imageUrl && (<div className="rounded-md overflow-hidden max-h-40 border"><img src={post.originalPost.imageUrl} alt="Original Content" className="w-full h-full object-cover" /></div>)}</div>)}</CardContent>
                                        <CardFooter className="pt-2 flex justify-between border-t bg-gray-50/50"><div className="flex items-center gap-4 text-muted-foreground text-sm"><span className="flex items-center gap-1"><Heart className="h-4 w-4" /> {post.likes}</span><span className="flex items-center gap-1"><MessageSquare className="h-4 w-4" /> {post.comments}</span></div><Button variant="ghost" size="sm" onClick={() => handleRepost(post.id)} className="text-muted-foreground hover:text-green-600 gap-1"><Repeat className="h-4 w-4" /><span className="text-xs">Repostar</span></Button></CardFooter>
                                    </Card>
                                )) : <p className="text-muted-foreground col-span-full text-center py-8">Nenhuma publicação encontrada.</p>}
                            </div>
                        </div>
                    )}

                    {/* --- TAB: WORKOUT --- */}
                    {activeTab === 'workout' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {parsedWorkout ? (
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div><CardTitle>{parsedWorkout.title}</CardTitle><CardDescription>{parsedWorkout.description}</CardDescription><Badge className="mt-2" variant="secondary">{parsedWorkout.level}</Badge></div>
                                        {!isOwner && (<Button onClick={handleMirrorWorkout} disabled={isMirroring} className="bg-green-600 hover:bg-green-700 text-white">{isMirroring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />} Espelhar Treino</Button>)}
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-start space-x-2 mb-6 overflow-x-auto pb-2">{weekDays.map((day) => (<Button key={day} variant={selectedWorkoutDay === day ? "default" : "outline"} size="sm" className={cn("rounded-lg flex-shrink-0", selectedWorkoutDay === day && "bg-red-800 hover:bg-red-900")} onClick={() => setSelectedWorkoutDay(day)}>{day.substring(0, 3)}</Button>))}</div>
                                        <div className="space-y-4">{dailyExercises.length > 0 ? dailyExercises.map((exercise, index) => (<div key={index} className="flex items-center gap-4 p-3 bg-muted rounded-lg border"><div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">{exercise.image && !exercise.image.includes("default") ? <img src={exercise.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-300"><Dumbbell className="text-gray-500 h-6 w-6" /></div>}</div><div className="flex-1"><h4 className="font-semibold text-sm">{exercise.name}</h4><p className="text-xs text-muted-foreground">{exercise.sets} séries x {exercise.reps} repetições</p></div></div>)) : <div className="text-center py-8 bg-muted/50 rounded-lg border border-dashed"><p className="font-medium text-muted-foreground">Descanso</p></div>}</div>
                                    </CardContent>
                                </Card>
                            ) : <Card><CardContent className="py-10 text-center"><p className="text-muted-foreground">Sem treino configurado.</p></CardContent></Card>}
                        </div>
                    )}

                    {/* --- TAB: DIET --- */}
                    {activeTab === 'diet' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {parsedDiet ? (
                                <div className="space-y-4">
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between pb-2"><div><CardTitle>{parsedDiet.name}</CardTitle><CardDescription>Meta: {parsedDiet.dailyGoal.calories} kcal</CardDescription></div>{!isOwner && (<Button onClick={handleMirrorDiet} disabled={isMirroring} className="bg-green-600 hover:bg-green-700 text-white">{isMirroring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />} Espelhar Dieta</Button>)}</CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs sm:text-sm mb-4">
                                                <div className="p-2 bg-red-50 text-red-700 rounded-lg flex flex-col items-center"><Flame className="h-4 w-4 mb-1" /><strong>{dailyDietTotals.calories}</strong> <span className="opacity-70">/ {parsedDiet.dailyGoal.calories} kcal</span></div>
                                                <div className="p-2 bg-orange-50 text-orange-700 rounded-lg flex flex-col items-center"><Beef className="h-4 w-4 mb-1" /><strong>{dailyDietTotals.protein}g</strong> <span className="opacity-70">/ {parsedDiet.dailyGoal.protein}g P</span></div>
                                                <div className="p-2 bg-yellow-50 text-yellow-700 rounded-lg flex flex-col items-center"><Wheat className="h-4 w-4 mb-1" /><strong>{dailyDietTotals.carbs}g</strong> <span className="opacity-70">/ {parsedDiet.dailyGoal.carbs}g C</span></div>
                                                <div className="p-2 bg-purple-50 text-purple-700 rounded-lg flex flex-col items-center"><Lollipop className="h-4 w-4 mb-1" /><strong>{dailyDietTotals.fats}g</strong> <span className="opacity-70">/ {parsedDiet.dailyGoal.fats}g G</span></div>
                                            </div>
                                            <div className="flex items-center justify-start space-x-2 mb-6 overflow-x-auto pb-2">{weekDays.map((day) => (<Button key={day} variant={selectedDietDay === day ? "default" : "outline"} size="sm" className={cn("rounded-lg flex-shrink-0", selectedDietDay === day && "bg-red-800 hover:bg-red-900")} onClick={() => setSelectedDietDay(day)}>{day.substring(0, 3)}</Button>))}</div>
                                            <div className="space-y-6">{sortedMealKeys.length > 0 ? sortedMealKeys.map((mealName) => (<div key={mealName} className="border rounded-lg p-3"><h4 className="font-semibold mb-2 text-sm text-red-900">{mealName}</h4><div className="space-y-2">{dailyMeals[mealName].map((food, idx) => (<div key={idx} className="flex justify-between items-center text-sm bg-muted/50 p-2 rounded"><div><p className="font-medium">{food.name}</p><p className="text-xs text-muted-foreground">{food.qty}</p></div><div className="text-right"><p className="font-bold">{food.calories} kcal</p><p className="text-[10px] text-muted-foreground">P:{food.protein} C:{food.carbs} G:{food.fats}</p></div></div>))}</div></div>)) : <div className="text-center py-8 bg-muted/50 rounded-lg border border-dashed"><p className="font-medium text-muted-foreground">Sem refeições planejadas para hoje.</p></div>}</div>
                                        </CardContent>
                                    </Card>
                                </div>
                            ) : <Card><CardContent className="py-10 text-center"><p className="text-muted-foreground">Sem dieta configurada.</p></CardContent></Card>}
                        </div>
                    )}

                    {/* --- TAB: ACHIEVEMENTS --- */}
                    {activeTab === 'achievements' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {completedChallenges.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {completedChallenges.map((uc) => (
                                        <Card key={uc.id} className="bg-green-50 border-green-200">
                                            <CardHeader className="pb-2"><div className="flex justify-between items-center"><CardTitle className="text-base text-green-900 line-through decoration-green-500/50">{uc.challenge.title}</CardTitle><ShieldCheck className="h-5 w-5 text-green-600" /></div></CardHeader>
                                            <CardContent><p className="text-xs text-green-700">{uc.challenge.description}</p></CardContent>
                                            <CardFooter className="text-sm font-bold text-green-800 pt-2 flex items-center gap-2"><Award className="h-4 w-4 text-yellow-600" />Conquista: {uc.challenge.reward}</CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            ) : (<Card><CardContent className="py-10 text-center flex flex-col items-center"><Trophy className="h-10 w-10 text-muted-foreground mb-3 opacity-30" /><p className="text-muted-foreground">Nenhum desafio concluído ainda.</p>{isOwner && <Button variant="link" className="mt-2 text-red-700" onClick={() => router.push('/dashboard?tab=desafios')}>Ir para Central de Desafios</Button>}</CardContent></Card>)}
                        </div>
                    )}
                </div>

                {/* Sidebar de Edição */}
                {isOwner && (
                    <div className="lg:col-span-1 space-y-6">
                        <form onSubmit={handleUpdateProfile}>
                            <Card><CardHeader><CardTitle>Editar Dados</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label>Bio</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div><div className="grid grid-cols-2 gap-2"><div className="space-y-2"><Label>Peso (kg)</Label><Input type="number" step="0.1" value={weight} onChange={(e) => setWeight(Number(e.target.value))} /></div><div className="space-y-2"><Label>Altura (m)</Label><Input type="number" step="0.01" value={height} onChange={(e) => setHeight(Number(e.target.value))} /></div></div><div className="text-center pt-2 bg-muted rounded-lg py-2"><p className="text-xs text-muted-foreground uppercase font-bold">IMC Atual</p><p className="text-2xl font-bold">{bmiData.value}</p><Badge className="mt-1 text-white text-[10px]" style={{ backgroundColor: bmiData.status.color }}>{bmiData.status.label}</Badge></div></CardContent><CardFooter><Button type="submit" className="w-full rounded-2xl" disabled={isUpdatingProfile}>{isUpdatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar Perfil</Button></CardFooter></Card>
                        </form>
                    </div>
                )}
            </div>

            {/* MODAL DE LISTA DE USUÁRIOS */}
            <AnimatePresence>
                {showUserListModal && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
                            <div className="p-4 border-b flex justify-between items-center bg-slate-50"><h2 className="text-lg font-bold">{userListTitle}</h2><Button variant="ghost" size="icon" onClick={() => setShowUserListModal(false)}><X className="h-4 w-4" /></Button></div>
                            <ScrollArea className="flex-1 p-4">
                                {isUserListLoading ? (
                                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-red-600" /></div>
                                ) : userList.length > 0 ? (
                                    <div className="space-y-4">
                                        {userList.map((u) => (
                                            <div
                                                key={u.id}
                                                className="flex items-center gap-3 p-2 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                                onClick={() => { window.location.href = `/dashboard?tab=perfil&userId=${u.id}`; }}
                                            >
                                                <Avatar className="h-10 w-10 border border-gray-200">
                                                    {u.avatarUrl && (
                                                        <AvatarImage src={`${UPLOAD_URL}/${u.avatarUrl}`} className="object-cover" />
                                                    )}
                                                    <AvatarFallback className="bg-slate-100 text-slate-600">
                                                        {u.username.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col text-left">
                                                    <span className="font-medium text-sm text-foreground">{u.nome}</span>
                                                    <span className="text-xs text-muted-foreground">@{u.username}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">Ninguém aqui ainda.</p>
                                    </div>
                                )}
                            </ScrollArea>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL DE STORY */}
            <AnimatePresence>
                {showStoryViewer && stories.length > 0 && (
                    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center">
                        <div className="relative w-full h-full max-w-md max-h-[90vh] bg-black flex items-center justify-center overflow-hidden md:rounded-xl shadow-2xl">
                            <div className="absolute top-4 left-0 right-0 flex justify-between items-center px-6 z-50">
                                {isOwner ? (
                                    <button className="text-white/80 hover:text-red-500 transition-colors bg-black/20 rounded-full p-2" onClick={handleDeleteStory} disabled={isDeletingStory}>
                                        {isDeletingStory ? <Loader2 className="h-6 w-6 animate-spin" /> : <Trash2 className="h-6 w-6" />}
                                    </button>
                                ) : <div />}
                                <button className="text-white/80 hover:text-white transition-colors bg-black/20 rounded-full p-2" onClick={() => setShowStoryViewer(false)}><X className="h-6 w-6" /></button>
                            </div>
                            <img src={`${UPLOAD_URL}/${stories[currentStoryIndex].mediaUrl}`} alt="Story" className="max-w-full max-h-full object-contain" />
                            <div className="absolute top-2 left-2 right-2 flex gap-1">
                                {stories.map((_, idx) => (
                                    <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                                        <div className={cn("h-full bg-white transition-all duration-300", idx < currentStoryIndex ? "w-full" : idx === currentStoryIndex ? "w-full" : "w-0")} />
                                    </div>
                                ))}
                            </div>
                            <div className="absolute inset-0 flex justify-between">
                                <div className="w-1/2 h-full cursor-pointer" onClick={prevStory} />
                                <div className="w-1/2 h-full cursor-pointer" onClick={nextStory} />
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- CHAT FLUTUANTE (Facebook Style) --- */}
            <AnimatePresence>
                {isChatOpen && user && (
                    <motion.div 
                        initial={{ opacity: 0, y: 100 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed bottom-0 right-4 md:right-8 w-80 h-96 bg-white border border-gray-300 rounded-t-xl shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header do Chat */}
                        <div className="flex items-center justify-between p-3 bg-red-800 text-white rounded-t-xl cursor-pointer" onClick={() => setIsChatOpen(false)}>
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8 border-2 border-white/20">
                                    {user.avatarUrl && <AvatarImage src={`${UPLOAD_URL}/${user.avatarUrl}`} />}
                                    <AvatarFallback className="text-black bg-white">{user.username.substring(0,2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm leading-none">{user.nome}</span>
                                    <span className="text-[10px] opacity-80">Online</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-red-700 text-white" onClick={(e) => { e.stopPropagation(); setIsChatOpen(false); }}>
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-red-700 text-white" onClick={(e) => { e.stopPropagation(); setIsChatOpen(false); }}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Área de Mensagens */}
                        <div className="flex-1 bg-slate-50 overflow-hidden relative" ref={scrollAreaRef}>
                            <ScrollArea className="h-full p-4">
                                <div className="flex flex-col gap-3">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className={cn("flex w-full", msg.isMine ? "justify-end" : "justify-start")}>
                                            <div className={cn(
                                                "max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                                                msg.isMine ? "bg-red-600 text-white rounded-br-none" : "bg-white border text-gray-800 rounded-bl-none"
                                            )}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={(el) => { if(el) el.scrollIntoView({ behavior: "smooth" }); }} />
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Input */}
                        <div className="p-3 bg-white border-t">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <Input 
                                    value={chatMessage} 
                                    onChange={(e) => setChatMessage(e.target.value)} 
                                    placeholder="Enviar mensagem..." 
                                    className="flex-1 h-9 text-sm rounded-full"
                                />
                                <Button type="submit" size="icon" className="h-9 w-9 rounded-full bg-red-700 hover:bg-red-800" disabled={!chatMessage.trim()}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}