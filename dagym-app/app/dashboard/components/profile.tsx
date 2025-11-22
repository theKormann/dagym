"use client"

import { useMemo, useState, useEffect, FormEvent, useRef } from "react"
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
    Users
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const UPLOAD_URL = "http://localhost:8080/uploads";

// --- Interfaces ---

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

interface BackendPostResponse {
    id: number;
    description: string;
    photoUrl: string | null;
    publicationDate: string;
    author: { id: number; name: string; username: string; avatarUrl: string; };
    likeCount: number;
    commentCount: number;
}

// Interface User atualizada com dados de Follow
interface User {
    id: number;
    nome: string;
    username: string;
    email?: string; // Opcional pois vem do DTO de perfil as vezes sem email
    description?: string;
    weight?: number;
    height?: number;
    diet?: string;
    workout?: string;
    avatarUrl?: string;
    // Novos campos
    followersCount?: number;
    followingCount?: number;
    postCount?: number;
    isFollowing?: boolean;
}

// Interface simples para listas de usuários (Modal)
interface UserSimple {
    id: number;
    nome: string;
    username: string;
    avatarUrl?: string;
}

interface Post {
    id: number;
    imageUrl: string | null;
    caption: string;
    likes: number;
    comments: number;
}

interface ProfilePageProps {
    profileId?: number | null;
}

function mapBackendToProfilePost(backendPost: BackendPostResponse): Post {
    return {
        id: backendPost.id,
        caption: backendPost.description,
        imageUrl: backendPost.photoUrl ? `${UPLOAD_URL}/${backendPost.photoUrl}` : null,
        likes: backendPost.likeCount,
        comments: backendPost.commentCount,
    };
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

export function ProfilePage({ profileId }: ProfilePageProps) {
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null)
    const [loggedUser, setLoggedUser] = useState<User | null>(null)
    const [isOwner, setIsOwner] = useState(false)
    const [posts, setPosts] = useState<Post[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // UI States
    const [activeTab, setActiveTab] = useState<'posts' | 'workout'>('posts')
    const [selectedWorkoutDay, setSelectedWorkoutDay] = useState(weekDays[0])
    const [parsedWorkout, setParsedWorkout] = useState<WorkoutPlan | null>(null)

    // Form States
    const [weight, setWeight] = useState(0)
    const [height, setHeight] = useState(0)
    const [description, setDescription] = useState("")
    const [diet, setDiet] = useState("")
    const [workout, setWorkout] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [postCaption, setPostCaption] = useState("")
    
    // Upload states
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    
    // Loading states
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
    const [isUpdatingCreds, setIsUpdatingCreds] = useState(false)
    const [isCreatingPost, setIsCreatingPost] = useState(false)
    const [isMirroring, setIsMirroring] = useState(false)
    const [isFollowingLoading, setIsFollowingLoading] = useState(false);

    // Modal States (Followers/Following)
    const [showUserListModal, setShowUserListModal] = useState(false);
    const [userListTitle, setUserListTitle] = useState("");
    const [userList, setUserList] = useState<UserSimple[]>([]);
    const [isUserListLoading, setIsUserListLoading] = useState(false);

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
                // Nota: Endpoint alterado para suportar DTO de perfil com status de follow
                // Requer que o backend tenha o endpoint /api/users/{id}/profile?currentUserId={id}
                const userRes = await fetch(`${API_URL}/api/users/${targetUserId}/profile?currentUserId=${currentLoggedUser.id}`)
                
                let userData: User;
                
                // Fallback se o endpoint novo não existir, usa o dashboard antigo
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

                // Preencher forms
                setWeight(userData.weight || 0)
                setHeight(userData.height || 0)
                setDescription(userData.description || "")
                setDiet(userData.diet || "")
                setWorkout(userData.workout || "")

                if (userData.workout) {
                    try { setParsedWorkout(JSON.parse(userData.workout)); } 
                    catch (e) { setParsedWorkout(null); }
                }

                const postsRes = await fetch(`${API_URL}/api/posts`);
                if (postsRes.ok) {
                    const allBackendPosts: BackendPostResponse[] = await postsRes.json();
                    const userPosts = allBackendPosts
                        .filter(post => post.author.id === targetUserId)
                        .map(mapBackendToProfilePost);
                    setPosts(userPosts);
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

    // --- Handlers ---

    const handleFollowToggle = async () => {
        if (!user || !loggedUser) return;
        
        setIsFollowingLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/users/${user.id}/follow?followerId=${loggedUser.id}`, {
                method: "POST"
            });
            
            if (!res.ok) throw new Error("Falha ao seguir");

            // Atualização otimista da UI
            setUser(prev => {
                if (!prev) return null;
                const newIsFollowing = !prev.isFollowing;
                const newFollowersCount = (prev.followersCount || 0) + (newIsFollowing ? 1 : -1);
                return { ...prev, isFollowing: newIsFollowing, followersCount: newFollowersCount };
            });

        } catch (error) {
            console.error(error);
            alert("Erro ao alterar status de seguir.");
        } finally {
            setIsFollowingLoading(false);
        }
    };

    const openUserList = async (type: 'followers' | 'following') => {
        if (!user) return;
        
        setUserListTitle(type === 'followers' ? 'Seguidores' : 'Seguindo');
        setShowUserListModal(true);
        setIsUserListLoading(true);
        setUserList([]);

        try {
            const res = await fetch(`${API_URL}/api/users/${user.id}/${type}`);
            if (res.ok) {
                const data = await res.json();
                setUserList(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsUserListLoading(false);
        }
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
            // Mantém o status de follow que veio do DTO
            setUser(prev => prev ? ({...updatedUser, isFollowing: prev.isFollowing, followersCount: prev.followersCount, followingCount: prev.followingCount}) : updatedUser);
            if (isOwner) { localStorage.setItem('dagym_user', JSON.stringify(updatedUser)); window.dispatchEvent(new Event("storage")); }
            alert("Foto atualizada!");
        } catch (err) { alert("Erro ao atualizar foto"); } finally { setIsUploadingAvatar(false); if (avatarInputRef.current) avatarInputRef.current.value = ""; }
    };

    const handleUpdateProfile = async (e: FormEvent) => {
        e.preventDefault(); if(!user) return; setIsUpdatingProfile(true);
        try {
            const res = await fetch(`${API_URL}/api/dashboard/${user.id}/profile`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ weight, height, description, diet, workout }) });
            if(!res.ok) throw new Error(); 
            const u = await res.json(); 
            // Preserva campos de visualização
            setUser(prev => prev ? { ...u, avatarUrl: prev.avatarUrl, isFollowing: prev.isFollowing, followersCount: prev.followersCount, followingCount: prev.followingCount } : u);
            if(isOwner) localStorage.setItem('dagym_user', JSON.stringify(u)); alert("Perfil salvo!");
        } catch(e) { alert("Erro ao salvar"); } finally { setIsUpdatingProfile(false); }
    };

    const handleCreatePost = async (e: FormEvent) => {
        e.preventDefault(); if((!postCaption.trim() && !selectedFile) || !user) return; setIsCreatingPost(true);
        const fd = new FormData(); fd.append('description', postCaption); if(selectedFile) fd.append('imageFile', selectedFile);
        try {
            const res = await fetch(`${API_URL}/api/posts/user/${user.id}`, { method: 'POST', body: fd });
            if(!res.ok) throw new Error(); const newP = await res.json(); setPosts([mapBackendToProfilePost(newP), ...posts]);
            setPostCaption(""); removeSelectedImage();
        } catch(e) { alert("Erro ao publicar"); } finally { setIsCreatingPost(false); }
    };

    const handleMirrorWorkout = async () => {
        if (!loggedUser || !user || !parsedWorkout) return;
        if (!confirm(`Copiar o treino "${parsedWorkout.title}"?`)) return;
        setIsMirroring(true);
        try {
            const res = await fetch(`${API_URL}/api/workout/${loggedUser.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ workoutJson: user.workout })
            });
            if (!res.ok) throw new Error();
            alert("Treino copiado!");
        } catch (err) { alert("Erro ao copiar."); } finally { setIsMirroring(false); }
    }

    if (isLoading) return <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin text-red-800" /></div>
    if (error || !user) return <p className="text-center text-red-600">{error || "Usuário não encontrado"}</p>

    const dailyExercises = parsedWorkout?.weeklySchedule[selectedWorkoutDay] || [];

    return (
        <>
            {/* Cabeçalho do Perfil */}
            <Card className="mb-6">
                <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
                    
                    {/* Avatar */}
                    <div className="relative group">
                        <Avatar className="h-28 w-28 border-4 border-red-800">
                            {user.avatarUrl && <AvatarImage src={`${UPLOAD_URL}/${user.avatarUrl}`} className="object-cover"/>}
                            <AvatarFallback className="text-4xl">{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {isOwner && (
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                                {isUploadingAvatar ? <Loader2 className="h-8 w-8 text-white animate-spin" /> : <Camera className="h-8 w-8 text-white" />}
                            </div>
                        )}
                         <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                    </div>

                    {/* Info */}
                    <div className="text-center sm:text-left flex-1 w-full">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between w-full gap-4">
                            <div>
                                <h2 className="text-2xl font-bold">{user.nome}</h2>
                                <p className="text-muted-foreground">@{user.username.toLowerCase()}</p>
                                {user.description && <p className="mt-2 text-sm max-w-lg">{user.description}</p>}
                            </div>
                            
                            {/* Botão de Seguir / Editar */}
                            <div className="mt-2 sm:mt-0">
                                {isOwner ? (
                                    <Button variant="outline" className="gap-2" disabled>
                                        Editar Perfil (Abaixo)
                                    </Button>
                                ) : (
                                    <Button 
                                        onClick={handleFollowToggle}
                                        disabled={isFollowingLoading}
                                        className={cn(
                                            "gap-2 w-32 transition-all",
                                            user.isFollowing 
                                                ? "bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300" 
                                                : "bg-red-700 hover:bg-red-800 text-white"
                                        )}
                                    >
                                        {isFollowingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 
                                         user.isFollowing ? <><UserCheck className="h-4 w-4"/> Seguindo</> : <><UserPlus className="h-4 w-4"/> Seguir</>
                                        }
                                    </Button>
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

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className={isOwner ? "lg:col-span-3 space-y-6" : "lg:col-span-4 space-y-6"}>
                    {/* Tabs */}
                    <div className="flex space-x-2 mb-4">
                        <Button variant={activeTab === 'posts' ? 'default' : 'outline'} onClick={() => setActiveTab('posts')} className="gap-2">
                            <ImageIcon className="w-4 h-4"/> Publicações
                        </Button>
                        <Button variant={activeTab === 'workout' ? 'default' : 'outline'} onClick={() => setActiveTab('workout')} className="gap-2">
                            <Dumbbell className="w-4 h-4"/> Rotina de Treino
                        </Button>
                    </div>

                    {/* CONTEÚDO: POSTS */}
                    {activeTab === 'posts' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {isOwner && (
                                <form onSubmit={handleCreatePost}>
                                    <Card>
                                        <CardHeader><CardTitle>Criar Publicação</CardTitle></CardHeader>
                                        <CardContent>
                                            <div className="grid w-full gap-3">
                                                <Textarea placeholder="No que você está pensando hoje?" value={postCaption} onChange={(e) => setPostCaption(e.target.value)} disabled={isCreatingPost}/>
                                                {previewUrl && (
                                                    <div className="relative w-full max-w-xs">
                                                        <img src={previewUrl} alt="Preview" className="rounded-lg w-full" />
                                                        <Button variant="destructive" size="icon" className="absolute top-2 right-2 rounded-full h-6 w-6" onClick={removeSelectedImage} type="button"><X className="h-3 w-3" /></Button>
                                                    </div>
                                                )}
                                                <div className="flex justify-between">
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}><ImageIcon className="h-5 w-5 text-muted-foreground" /></Button>
                                                    <Button type="submit" className="rounded-2xl" disabled={isCreatingPost || (!postCaption.trim() && !selectedFile)}>
                                                        {isCreatingPost ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Publicar
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </form>
                            )}
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {posts.length > 0 ? (
                                    posts.map((post) => (
                                        <Card key={post.id} className="overflow-hidden">
                                            {post.imageUrl && <img src={post.imageUrl} alt="Post" className="aspect-video w-full object-cover" />}
                                            <CardContent className="p-4">
                                                <p className="text-sm mb-2">{post.caption}</p>
                                                <div className="flex items-center gap-4 text-muted-foreground text-sm">
                                                    <span className="flex items-center gap-1"><Heart className="h-4 w-4" /> {post.likes}</span>
                                                    <span className="flex items-center gap-1"><MessageSquare className="h-4 w-4" /> {post.comments}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground col-span-full text-center py-8">Nenhuma publicação encontrada.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* CONTEÚDO: TREINO */}
                    {activeTab === 'workout' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {parsedWorkout ? (
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle>{parsedWorkout.title}</CardTitle>
                                            <CardDescription>{parsedWorkout.description}</CardDescription>
                                            <Badge className="mt-2" variant="secondary">{parsedWorkout.level}</Badge>
                                        </div>
                                        {!isOwner && (
                                            <Button onClick={handleMirrorWorkout} disabled={isMirroring} className="bg-green-600 hover:bg-green-700 text-white">
                                                {isMirroring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />} Espelhar Treino
                                            </Button>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-start space-x-2 mb-6 overflow-x-auto pb-2">
                                            {weekDays.map((day) => (
                                                <Button key={day} variant={selectedWorkoutDay === day ? "default" : "outline"} size="sm" 
                                                    className={cn("rounded-lg flex-shrink-0", selectedWorkoutDay === day && "bg-red-800 hover:bg-red-900")}
                                                    onClick={() => setSelectedWorkoutDay(day)}
                                                >
                                                    {day.substring(0, 3)}
                                                </Button>
                                            ))}
                                        </div>
                                        <div className="space-y-4">
                                            {dailyExercises.length > 0 ? (
                                                dailyExercises.map((exercise, index) => (
                                                    <div key={index} className="flex items-center gap-4 p-3 bg-muted rounded-lg border">
                                                        <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                                                            {exercise.image && !exercise.image.includes("default") ? <img src={exercise.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-300"><Dumbbell className="text-gray-500 h-6 w-6"/></div>}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold text-sm">{exercise.name}</h4>
                                                            <p className="text-xs text-muted-foreground">{exercise.sets} séries x {exercise.reps} repetições</p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : <div className="text-center py-8 bg-muted/50 rounded-lg border border-dashed"><p className="font-medium text-muted-foreground">Descanso</p></div>}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card><CardContent className="py-10 text-center"><p className="text-muted-foreground">Sem treino público configurado.</p></CardContent></Card>
                            )}
                        </div>
                    )}
                </div>

                {/* Coluna Lateral (Edição - Apenas Dono) */}
                {isOwner && (
                    <div className="lg:col-span-1 space-y-6">
                        <form onSubmit={handleUpdateProfile}>
                            <Card>
                                <CardHeader><CardTitle>Editar Dados</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2"><Label>Bio</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-2"><Label>Peso (kg)</Label><Input type="number" step="0.1" value={weight} onChange={(e) => setWeight(Number(e.target.value))} /></div>
                                        <div className="space-y-2"><Label>Altura (m)</Label><Input type="number" step="0.01" value={height} onChange={(e) => setHeight(Number(e.target.value))} /></div>
                                    </div>
                                    <div className="text-center pt-2 bg-muted rounded-lg py-2">
                                        <p className="text-xs text-muted-foreground uppercase font-bold">IMC Atual</p>
                                        <p className="text-2xl font-bold">{bmiData.value}</p>
                                        <Badge className="mt-1 text-white text-[10px]" style={{ backgroundColor: bmiData.status.color }}>{bmiData.status.label}</Badge>
                                    </div>
                                </CardContent>
                                <CardFooter><Button type="submit" className="w-full rounded-2xl" disabled={isUpdatingProfile}>{isUpdatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar Perfil</Button></CardFooter>
                            </Card>
                        </form>
                    </div>
                )}
            </div>

            {/* MODAL DE LISTA DE USUÁRIOS (SEGUIDORES/SEGUINDO) */}
            <AnimatePresence>
                {showUserListModal && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"
                        >
                            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                                <h2 className="text-lg font-bold">{userListTitle}</h2>
                                <Button variant="ghost" size="icon" onClick={() => setShowUserListModal(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            
                            <ScrollArea className="flex-1 p-4">
                                {isUserListLoading ? (
                                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-red-600" /></div>
                                ) : userList.length > 0 ? (
                                    <div className="space-y-4">
                                        {userList.map((u) => (
                                            <div key={u.id} className="flex items-center gap-3 hover:bg-slate-50 p-2 rounded-lg transition-colors cursor-pointer" onClick={() => {
                                                window.location.href = `/dashboard?tab=perfil&userId=${u.id}`; // Recarrega para o perfil clicado (ou use router.push e lógica de estado)
                                            }}>
                                                <Avatar className="h-10 w-10 border">
                                                    {u.avatarUrl && <AvatarImage src={`${UPLOAD_URL}/${u.avatarUrl}`} className="object-cover" />}
                                                    <AvatarFallback className="bg-slate-100 text-slate-600">{u.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{u.nome}</span>
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
        </>
    )
}