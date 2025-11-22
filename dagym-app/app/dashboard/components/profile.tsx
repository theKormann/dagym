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
    Camera, // Importar ícone da câmera
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const UPLOAD_URL = "http://localhost:8080/uploads";

// ... (Interfaces BackendPostResponse, User, Post, ProfilePageProps e mapBackendToProfilePost MANTIDAS IGUAIS) ...

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
    workout?: string;
    avatarUrl?: string; // Garantir que avatarUrl existe na interface
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

// ... (Funções calculateBmi e getBmiStatus MANTIDAS IGUAIS) ...
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

export function ProfilePage({ profileId }: ProfilePageProps) {
    const router = useRouter();

    // --- Estados ---
    const [user, setUser] = useState<User | null>(null)
    const [isOwner, setIsOwner] = useState(false)
    const [posts, setPosts] = useState<Post[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // --- Estados de Formulário ---
    const [weight, setWeight] = useState(0)
    const [height, setHeight] = useState(0)
    const [description, setDescription] = useState("")
    const [diet, setDiet] = useState("")
    const [workout, setWorkout] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [postCaption, setPostCaption] = useState("")
    
    // Post Upload states
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Avatar Upload states
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
    const [isUpdatingCreds, setIsUpdatingCreds] = useState(false)
    const [isCreatingPost, setIsCreatingPost] = useState(false)

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
        
        let loggedUserId: number;
        try {
            const loggedUser: User = JSON.parse(storedUserStr);
            loggedUserId = loggedUser.id;
        } catch (e) {
            router.push('/login');
            return;
        }

        const targetUserId = profileId || loggedUserId;
        const ownerStatus = targetUserId === loggedUserId;
        setIsOwner(ownerStatus);

        const fetchProfileData = async () => {
            try {
                setIsLoading(true)
                const userRes = await fetch(`${API_URL}/api/dashboard/${targetUserId}`)
                if (!userRes.ok) throw new Error(`Falha ao buscar perfil (Status: ${userRes.status})`)
                const userData: User = await userRes.json()
                setUser(userData)

                setWeight(userData.weight || 0)
                setHeight(userData.height || 0)
                setDescription(userData.description || "")
                setDiet(userData.diet || "")
                setWorkout(userData.workout || "")

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

    // --- Upload de Post (Handlers existentes) ---
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const removeSelectedImage = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // --- NOVO: Handler para Upload de Avatar ---
    const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        setIsUploadingAvatar(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`${API_URL}/api/users/${user.id}/avatar`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Falha ao enviar foto de perfil");

            const updatedUser: User = await res.json();
            setUser(updatedUser); // Atualiza o estado local para mostrar a nova foto
            
            // Atualiza localStorage se for o dono
            if (isOwner) {
                localStorage.setItem('dagym_user', JSON.stringify(updatedUser));
                // Dispara um evento para outros componentes (como a sidebar) saberem que mudou
                window.dispatchEvent(new Event("storage")); 
            }
            
            alert("Foto de perfil atualizada com sucesso!");
        } catch (err) {
            alert(err instanceof Error ? err.message : "Erro ao atualizar foto");
        } finally {
            setIsUploadingAvatar(false);
            // Limpa o input
            if (avatarInputRef.current) avatarInputRef.current.value = "";
        }
    };

    const handleUpdateProfile = async (e: FormEvent) => {
        e.preventDefault()
        if (!user) return
        setIsUpdatingProfile(true)
        try {
            const res = await fetch(`${API_URL}/api/dashboard/${user.id}/profile`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ weight, height, description, diet, workout }),
            })
            if (!res.ok) throw new Error("Falha ao salvar.")
            const updatedUser = await res.json()
            // Preserva o avatarUrl antigo se o backend não devolver ou se a lógica de update profile não incluir avatar
            setUser(prev => prev ? { ...updatedUser, avatarUrl: prev.avatarUrl } : updatedUser)
            
            if (isOwner) localStorage.setItem('dagym_user', JSON.stringify(updatedUser));
            alert("Perfil atualizado!")
        } catch (err) { alert(err instanceof Error ? err.message : "Erro") } 
        finally { setIsUpdatingProfile(false) }
    }

    const handleCreatePost = async (e: FormEvent) => {
        e.preventDefault()
        if ((!postCaption.trim() && !selectedFile) || !user) return
        setIsCreatingPost(true)
        const formData = new FormData();
        formData.append('description', postCaption);
        if (selectedFile) formData.append('imageFile', selectedFile);

        try {
            const res = await fetch(`${API_URL}/api/posts/user/${user.id}`, {
                method: 'POST',
                body: formData,
            });
            if (!res.ok) throw new Error("Falha ao criar post.");
            const newBackendPost = await res.json();
            const newFrontendPost = mapBackendToProfilePost(newBackendPost);
            setPosts([newFrontendPost, ...posts]);
            setPostCaption("");
            removeSelectedImage();
        } catch (err) { alert(err instanceof Error ? err.message : "Erro") } 
        finally { setIsCreatingPost(false) }
    }

    const handleUpdateCredentials = async (e: FormEvent) => {
        e.preventDefault()
        if (!user || !newPassword) return
        setIsUpdatingCreds(true)
        try {
            const res = await fetch(`${API_URL}/auth/${user.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email, password: newPassword, }),
            })
            if (!res.ok) throw new Error("Falha senha.")
            alert("Senha ok!")
            setNewPassword("")
        } catch (err) { alert(err instanceof Error ? err.message : "Erro") }
        finally { setIsUpdatingCreds(false) }
    }

    if (isLoading) return <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin text-red-800" /></div>
    if (error || !user) return <p className="text-center text-red-600">{error || "Usuário não encontrado"}</p>

    return (
        <>
            {/* Cabeçalho do Perfil */}
            <Card className="mb-6">
                <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
                    
                    {/* AVATAR COM UPLOAD */}
                    <div className="relative group">
                        <Avatar className="h-28 w-28 border-4 border-red-800">
                            {user.avatarUrl ? (
                                <AvatarImage 
                                    src={`${UPLOAD_URL}/${user.avatarUrl}`} 
                                    alt={user.nome} 
                                    className="object-cover"
                                />
                            ) : null}
                            <AvatarFallback className="text-4xl">
                                {user.username.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>

                        {/* Botão de troca de foto (Apenas para o dono) */}
                        {isOwner && (
                            <>
                                <div 
                                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    onClick={() => avatarInputRef.current?.click()}
                                >
                                    {isUploadingAvatar ? (
                                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                                    ) : (
                                        <Camera className="h-8 w-8 text-white" />
                                    )}
                                </div>
                                <input 
                                    type="file" 
                                    ref={avatarInputRef} 
                                    onChange={handleAvatarChange} 
                                    className="hidden" 
                                    accept="image/*" 
                                />
                            </>
                        )}
                    </div>

                    <div className="text-center sm:text-left">
                        <h2 className="text-2xl font-bold">{user.nome}</h2>
                        <p className="text-muted-foreground">@{user.username.toLowerCase()}</p>
                        {user.description && <p className="mt-2 text-sm max-w-lg">{user.description}</p>}
                        
                        <div className="mt-4 flex justify-center sm:justify-start gap-6">
                            <div className="text-center">
                                <p className="font-bold text-lg">{posts.length}</p>
                                <p className="text-sm text-muted-foreground">Posts</p>
                            </div>
                        </div>
                    </div>
                    
                    {isOwner && (
                        <Button className="ml-auto mt-4 sm:mt-0 rounded-2xl" variant="outline">
                            Editar Perfil
                        </Button>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Coluna Principal (Posts) */}
                <div className={isOwner ? "lg:col-span-3 space-y-6" : "lg:col-span-4 space-y-6"}>

                    {/* Criar Post - SÓ SE FOR DONO */}
                    {isOwner && (
                        <form onSubmit={handleCreatePost}>
                            <Card>
                                <CardHeader><CardTitle>Criar Publicação</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="grid w-full gap-3">
                                        <Textarea 
                                            placeholder="No que você está pensando hoje?" 
                                            value={postCaption} 
                                            onChange={(e) => setPostCaption(e.target.value)} 
                                            disabled={isCreatingPost}
                                        />
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
                    <div>
                        <h3 className="text-xl font-bold mb-4">{isOwner ? "Minhas Publicações" : `Publicações de ${user.nome}`}</h3>
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
                                <p className="text-muted-foreground col-span-full">Nenhuma publicação encontrada.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Coluna Lateral (Dados Físicos e Config) - MANTIDA IGUAL */}
                {isOwner && (
                    <div className="lg:col-span-1 space-y-6">
                        <form onSubmit={handleUpdateProfile}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Completar Perfil</CardTitle>
                                    <CardDescription>Edite seus dados.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Bio</Label>
                                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Peso (kg)</Label>
                                        <Input type="number" step="0.1" value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Altura (m)</Label>
                                        <Input type="number" step="0.01" value={height} onChange={(e) => setHeight(Number(e.target.value))} />
                                    </div>
                                    <div className="text-center pt-2">
                                        <p className="text-muted-foreground text-sm">IMC</p>
                                        <p className="text-4xl font-bold">{bmiData.value}</p>
                                        <Badge className="mt-2 text-white" style={{ backgroundColor: bmiData.status.color }}>{bmiData.status.label}</Badge>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" className="w-full rounded-2xl" disabled={isUpdatingProfile}>
                                        {isUpdatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
                                    </Button>
                                </CardFooter>
                            </Card>
                        </form>

                        <form onSubmit={handleUpdateCredentials}>
                             {/* (Mantido igual ao original) */}
                            <Card>
                                <CardHeader><CardTitle>Credenciais</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Login</Label>
                                        <Input value={user.username} readOnly disabled />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Nova Senha</Label>
                                        <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" className="w-full rounded-2xl" disabled={isUpdatingCreds}>
                                        {isUpdatingCreds && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar Senha
                                    </Button>
                                </CardFooter>
                            </Card>
                        </form>
                    </div>
                )}
            </div>
        </>
    )
}