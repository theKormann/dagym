"use client"

import { useMemo, useState, useEffect, FormEvent, useRef } from "react"
import { useRouter } from "next/navigation"
import {
    Heart,
    MessageSquare,
    Image as ImageIcon,
    Send,
    Loader2,
    X,
    Camera,
    Dumbbell, // Ícone para o treino
    Copy,     // Ícone para espelhar
    CheckCircle
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const UPLOAD_URL = "http://localhost:8080/uploads";

// --- Interfaces Adicionais para o Treino ---
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

// ... (Interfaces BackendPostResponse, User, Post MANTIDAS IGUAIS) ...
interface BackendPostResponse {
    id: number;
    description: string;
    photoUrl: string | null;
    publicationDate: string;
    author: { id: number; name: string; username: string; avatarUrl: string; };
    likeCount: number;
    commentCount: number;
}

interface User {
    id: number;
    nome: string;
    username: string;
    email: string;
    description?: string;
    weight?: number;
    height?: number;
    diet?: string;
    workout?: string; // JSON String
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

    // --- Estados ---
    const [user, setUser] = useState<User | null>(null)
    const [loggedUser, setLoggedUser] = useState<User | null>(null) // Para saber quem está logado
    const [isOwner, setIsOwner] = useState(false)
    const [posts, setPosts] = useState<Post[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // --- Estados de Controle de UI ---
    const [activeTab, setActiveTab] = useState<'posts' | 'workout'>('posts')
    const [selectedWorkoutDay, setSelectedWorkoutDay] = useState(weekDays[0])
    const [parsedWorkout, setParsedWorkout] = useState<WorkoutPlan | null>(null)

    // --- Estados de Formulário ---
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

    useEffect(() => {
        if (!API_URL) {
            setError("API URL missing.");
            setIsLoading(false);
            return;
        }

        const storedUserStr = localStorage.getItem('dagym_user');
        if (!storedUserStr) {
            router.push('/dashboard');
            return;
        }
        
        let currentLoggedUser: User;
        try {
            currentLoggedUser = JSON.parse(storedUserStr);
            setLoggedUser(currentLoggedUser);
        } catch (e) {
            router.push('/login');
            return;
        }

        const targetUserId = profileId || currentLoggedUser.id;
        const ownerStatus = targetUserId === currentLoggedUser.id;
        setIsOwner(ownerStatus);

        const fetchProfileData = async () => {
            try {
                setIsLoading(true)
                const userRes = await fetch(`${API_URL}/api/dashboard/${targetUserId}`)
                if (!userRes.ok) throw new Error(`Falha ao buscar perfil (Status: ${userRes.status})`)
                const userData: User = await userRes.json()
                setUser(userData)

                // Preencher forms
                setWeight(userData.weight || 0)
                setHeight(userData.height || 0)
                setDescription(userData.description || "")
                setDiet(userData.diet || "")
                setWorkout(userData.workout || "")

                // Parse do Workout JSON se existir
                if (userData.workout) {
                    try {
                        const parsed = JSON.parse(userData.workout);
                        setParsedWorkout(parsed);
                    } catch (e) {
                        console.error("Erro ao ler JSON do treino", e);
                        setParsedWorkout(null);
                    }
                }

                // Buscar Posts
                const postsRes = await fetch(`${API_URL}/api/posts`);
                if (!postsRes.ok) throw new Error("Falha ao buscar publicações.");
                const allBackendPosts: BackendPostResponse[] = await postsRes.json();

                const userPosts = allBackendPosts
                    .filter(post => post.author.id === targetUserId)
                    .map(mapBackendToProfilePost);

                setPosts(userPosts);
                setError(null)

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
        return {
            value: bmiValue.toFixed(1),
            status: getBmiStatus(bmiValue),
        }
    }, [weight, height])

    // ... (Handlers de Avatar, Update Profile, Create Post, Update Creds MANTIDOS IGUAIS) ...
    // (Vou omitir para economizar espaço, mas devem ser mantidos no seu código final)
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
            if (!res.ok) throw new Error("Falha ao enviar foto");
            const updatedUser: User = await res.json();
            setUser(updatedUser);
            if (isOwner) { localStorage.setItem('dagym_user', JSON.stringify(updatedUser)); window.dispatchEvent(new Event("storage")); }
            alert("Foto atualizada!");
        } catch (err) { alert("Erro ao atualizar foto"); } finally { setIsUploadingAvatar(false); if (avatarInputRef.current) avatarInputRef.current.value = ""; }
    };
    const handleUpdateProfile = async (e: FormEvent) => {
        e.preventDefault(); if(!user) return; setIsUpdatingProfile(true);
        try {
            const res = await fetch(`${API_URL}/api/dashboard/${user.id}/profile`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ weight, height, description, diet, workout }) });
            if(!res.ok) throw new Error(); const u = await res.json(); setUser(prev => prev ? { ...u, avatarUrl: prev.avatarUrl } : u);
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
    const handleUpdateCredentials = async (e: FormEvent) => {
        e.preventDefault(); if(!user || !newPassword) return; setIsUpdatingCreds(true);
        try { await fetch(`${API_URL}/auth/${user.id}`, { method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ email: user.email, password: newPassword }) }); alert("Senha atualizada!"); setNewPassword(""); }
        catch(e) { alert("Erro na senha"); } finally { setIsUpdatingCreds(false); }
    };


    // --- NOVO: Lógica para Espelhar Treino ---
    const handleMirrorWorkout = async () => {
        if (!loggedUser || !user || !parsedWorkout) return;

        if (!confirm(`Tem certeza que deseja copiar o treino "${parsedWorkout.title}" para o seu perfil? Isso substituirá seu treino atual.`)) {
            return;
        }

        setIsMirroring(true);
        try {
            // O backend espera um DTO com o campo workoutJson
            const payload = {
                workoutJson: user.workout // Enviamos a string JSON original
            };

            const res = await fetch(`${API_URL}/api/workout/${loggedUser.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Falha ao espelhar treino.");

            alert("Treino espelhado com sucesso! Visite sua página de treinos para ver os detalhes.");
            
        } catch (err) {
            alert("Erro ao copiar treino. Tente novamente.");
            console.error(err);
        } finally {
            setIsMirroring(false);
        }
    }

    if (isLoading) return <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin text-red-800" /></div>
    if (error || !user) return <p className="text-center text-red-600">{error || "Usuário não encontrado"}</p>

    // Dados para renderização do treino
    const dailyExercises = parsedWorkout?.weeklySchedule[selectedWorkoutDay] || [];

    return (
        <>
            {/* Cabeçalho do Perfil */}
            <Card className="mb-6">
                <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
                    
                    {/* Avatar e Info Básica (Sem alterações) */}
                    <div className="relative group">
                        <Avatar className="h-28 w-28 border-4 border-red-800">
                            {user.avatarUrl ? (
                                <AvatarImage src={`${UPLOAD_URL}/${user.avatarUrl}`} className="object-cover"/>
                            ) : null}
                            <AvatarFallback className="text-4xl">{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {isOwner && (
                             <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                                {isUploadingAvatar ? <Loader2 className="h-8 w-8 text-white animate-spin" /> : <Camera className="h-8 w-8 text-white" />}
                            </div>
                        )}
                         <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                    </div>

                    <div className="text-center sm:text-left flex-1">
                        <h2 className="text-2xl font-bold">{user.nome}</h2>
                        <p className="text-muted-foreground">@{user.username.toLowerCase()}</p>
                        {user.description && <p className="mt-2 text-sm max-w-lg">{user.description}</p>}
                        
                        <div className="mt-4 flex justify-center sm:justify-start gap-6">
                            <div className="text-center">
                                <p className="font-bold text-lg">{posts.length}</p>
                                <p className="text-sm text-muted-foreground">Posts</p>
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-lg">{parsedWorkout ? "Ativo" : "-"}</p>
                                <p className="text-sm text-muted-foreground">Plano de Treino</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Coluna Principal */}
                <div className={isOwner ? "lg:col-span-3 space-y-6" : "lg:col-span-4 space-y-6"}>

                    {/* Tabs / Navegação Interna */}
                    <div className="flex space-x-2 mb-4">
                        <Button 
                            variant={activeTab === 'posts' ? 'default' : 'outline'}
                            onClick={() => setActiveTab('posts')}
                            className="gap-2"
                        >
                            <ImageIcon className="w-4 h-4"/> Publicações
                        </Button>
                        <Button 
                            variant={activeTab === 'workout' ? 'default' : 'outline'}
                            onClick={() => setActiveTab('workout')}
                            className="gap-2"
                        >
                            <Dumbbell className="w-4 h-4"/> Rotina de Treino
                        </Button>
                    </div>

                    {/* CONTEÚDO: POSTS */}
                    {activeTab === 'posts' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Criar Post (Só se for Owner) */}
                            {isOwner && (
                                <form onSubmit={handleCreatePost}>
                                    <Card>
                                        <CardHeader><CardTitle>Criar Publicação</CardTitle></CardHeader>
                                        <CardContent>
                                            <div className="grid w-full gap-3">
                                                <Textarea placeholder="No que você está pensando hoje?" value={postCaption} onChange={(e) => setPostCaption(e.target.value)} disabled={isCreatingPost}/>
                                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
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

                            {/* Lista de Posts */}
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
                                        
                                        {/* Botão Espelhar (Só aparece se NÃO for o dono) */}
                                        {!isOwner && (
                                            <Button 
                                                onClick={handleMirrorWorkout} 
                                                disabled={isMirroring}
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                {isMirroring ? (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Copy className="mr-2 h-4 w-4" />
                                                )}
                                                Espelhar Treino
                                            </Button>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        {/* Navegação dos Dias */}
                                        <div className="flex items-center justify-start space-x-2 mb-6 overflow-x-auto pb-2">
                                            {weekDays.map((day) => (
                                                <Button
                                                    key={day}
                                                    variant={selectedWorkoutDay === day ? "default" : "outline"}
                                                    size="sm"
                                                    className={cn(
                                                        "rounded-lg flex-shrink-0",
                                                        selectedWorkoutDay === day && "bg-red-800 hover:bg-red-900",
                                                        (parsedWorkout.weeklySchedule[day] || []).length === 0 && "text-muted-foreground",
                                                    )}
                                                    onClick={() => setSelectedWorkoutDay(day)}
                                                >
                                                    {day.substring(0, 3)}
                                                </Button>
                                            ))}
                                        </div>

                                        {/* Lista de Exercícios (Read Only) */}
                                        <div className="space-y-4">
                                            {dailyExercises.length > 0 ? (
                                                dailyExercises.map((exercise, index) => (
                                                    <div key={index} className="flex items-center gap-4 p-3 bg-muted rounded-lg border">
                                                        <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden flex-shrink-0 relative">
                                                             {/* Fallback visual simples se não houver imagem real */}
                                                            {exercise.image && !exercise.image.includes("default") ? (
                                                                <img src={exercise.image} alt={exercise.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-gray-300">
                                                                    <Dumbbell className="text-gray-500 h-6 w-6"/>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold text-sm md:text-base">{exercise.name}</h4>
                                                            <p className="text-xs md:text-sm text-muted-foreground">
                                                                {exercise.sets} séries x {exercise.reps} repetições
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-8 bg-muted/50 rounded-lg border border-dashed">
                                                    <p className="font-medium text-muted-foreground">Descanso</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardContent className="py-10 text-center">
                                        <p className="text-muted-foreground">Este usuário ainda não configurou um plano de treino público.</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </div>

                {/* Coluna Lateral (Dados Físicos e Config) */}
                {isOwner && (
                    <div className="lg:col-span-1 space-y-6">
                        <form onSubmit={handleUpdateProfile}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Editar Dados</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Bio</Label>
                                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-2">
                                            <Label>Peso (kg)</Label>
                                            <Input type="number" step="0.1" value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Altura (m)</Label>
                                            <Input type="number" step="0.01" value={height} onChange={(e) => setHeight(Number(e.target.value))} />
                                        </div>
                                    </div>
                                    <div className="text-center pt-2 bg-muted rounded-lg py-2">
                                        <p className="text-xs text-muted-foreground uppercase font-bold">IMC Atual</p>
                                        <p className="text-2xl font-bold">{bmiData.value}</p>
                                        <Badge className="mt-1 text-white text-[10px]" style={{ backgroundColor: bmiData.status.color }}>{bmiData.status.label}</Badge>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" className="w-full rounded-2xl" disabled={isUpdatingProfile}>
                                        {isUpdatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar Perfil
                                    </Button>
                                </CardFooter>
                            </Card>
                        </form>
                        
                        {/* Form de Senha (Omitido detalhes para brevidade, manter o que já existia) */}
                        <form onSubmit={handleUpdateCredentials}>
                            <Card>
                                <CardHeader><CardTitle className="text-sm">Segurança</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    <Label>Nova Senha</Label>
                                    <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" variant="outline" className="w-full" disabled={isUpdatingCreds}>Atualizar Senha</Button>
                                </CardFooter>
                            </Card>
                        </form>
                    </div>
                )}
            </div>
        </>
    )
}