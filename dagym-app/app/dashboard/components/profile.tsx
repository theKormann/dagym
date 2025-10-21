"use client"

import { useMemo, useState, useEffect, FormEvent } from "react"
// ATUALIZAÇÃO: Importar o useRouter
import { useRouter } from "next/navigation" 
import {
  Heart,
  MessageSquare,
  Image as ImageIcon,
  Send,
  Loader2,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// ATUALIZAÇÃO: Removido o USER_ID fixo
// const USER_ID = 1; 
const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
}

interface Post {
  id: number;
  imageUrl: string;
  caption: string;
  likes: number;
  comments: number;
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


export function ProfilePage() {
  // ATUALIZAÇÃO: Adicionar o router
  const router = useRouter(); 

  // --- Estados de Dados ---
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([]) 
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // --- Estados dos Formulários ---
  const [weight, setWeight] = useState(0)
  const [height, setHeight] = useState(0) 
  const [newPassword, setNewPassword] = useState("")
  const [postCaption, setPostCaption] = useState("")
  
  // --- Estado de Loading dos Botões ---
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isUpdatingCreds, setIsUpdatingCreds] = useState(false)
  const [isCreatingPost, setIsCreatingPost] = useState(false)


  // --- Efeito para Buscar Dados Iniciais ---
  useEffect(() => {
    if (!API_URL) {
      setError("A URL da API não está configurada. Verifique o .env.local");
      setIsLoading(false);
      return;
    }

    // --- LÓGICA DE AUTENTICAÇÃO ATUALIZADA ---
    
    // 1. Tentar ler o usuário do localStorage
    const storedUser = localStorage.getItem('dagym_user');
    if (!storedUser) {
        setError("Usuário não autenticado. Redirecionando para login...");
        setIsLoading(false);
        router.push('/dashboard');
        return;
    }

    // 2. Parsear os dados e pegar o ID
    let dynamicUserId: number;
    try {
        const userData: User = JSON.parse(storedUser);
        dynamicUserId = userData.id;
        if (!dynamicUserId) throw new Error("ID de usuário inválido.");
    } catch (e) {
        setError("Erro ao ler dados do usuário. Faça login novamente.");
        setIsLoading(false);
        localStorage.removeItem('dagym_user'); // Limpa o dado corrompido
        router.push('/login');
        return;
    }
    // --- FIM DA LÓGICA DE AUTENTICAÇÃO ---

    const fetchUserData = async () => {
      try {
        setIsLoading(true)

        // 3. Usar o ID dinâmico para buscar os dados
        const userRes = await fetch(`${API_URL}/api/dashboard/${dynamicUserId}`) // <-- CORREÇÃO AQUI

        if (!userRes.ok) throw new Error(`Falha ao buscar dados do usuário. (Status: ${userRes.status})`)
        
        const userData: User = await userRes.json()
        setUser(userData)
        
        setWeight(userData.weight || 0)
        setHeight(userData.height || 0)
        setPosts([]) 
        setError(null) 

      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [API_URL, router]) // ATUALIZAÇÃO: Adicionar dependências

  // --- Cálculo de IMC Memoizado ---
  const bmiData = useMemo(() => {
    const bmiValue = calculateBmi(weight, height)
    return {
      value: bmiValue.toFixed(1),
      status: getBmiStatus(bmiValue),
    }
  }, [weight, height])

  
  // --- Handlers de Submissão (PUT) ---

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    setIsUpdatingProfile(true)
    
    try {
      // Esta URL estava correta, pois já usava user.id
      const res = await fetch(`${API_URL}/api/dashboard/${user.id}/profile`, { 
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight: weight,
          height: height,
        }),
      })
      if (!res.ok) throw new Error("Falha ao salvar IMC.")
      
      const updatedUser = await res.json()
      setUser(updatedUser) 
       // ATUALIZAÇÃO: Salva os dados atualizados no localStorage também
       localStorage.setItem('dagym_user', JSON.stringify(updatedUser));
      alert("Perfil salvo com sucesso!")

    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleUpdateCredentials = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !newPassword) {
      alert("Por favor, digite a nova senha.")
      return
    }
    setIsUpdatingCreds(true)

    try {
      // Esta URL também estava correta
      const res = await fetch(`${API_URL}/auth/${user.id}`, { 
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email, 
          password: newPassword,
        }),
      })
      if (!res.ok) throw new Error("Falha ao salvar nova senha.")
      
      alert("Senha atualizada com sucesso!")
      setNewPassword("") 

    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setIsUpdatingCreds(false)
    }
  }

  const handleCreatePost = async (e: FormEvent) => {
    e.preventDefault()
    if (!postCaption) return
    setIsCreatingPost(true)
    console.log("Enviando post:", postCaption)
    await new Promise(res => setTimeout(res, 1000)) 
    alert("Publicação criada (simulado)!")
    setPostCaption("")
    setIsCreatingPost(false)
  }
  
  
  // --- Renderização ---

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-red-800" />
      </div>
    )
  }

  if (error || !user) {
    return <p className="text-center text-red-600">{error || "Usuário não encontrado."}</p>
  }

  // O restante do JSX (return <>) permanece idêntico ao que você enviou.
  // ... (Cole o restante do seu return aqui) ...
  return (
    <>
      {/* Perfil Header */}
      <Card className="mb-6">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
          <Avatar className="h-28 w-28 border-4 border-red-800">
            <AvatarFallback className="text-4xl">{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold">{user.nome}</h2>
            <p className="text-muted-foreground">@{user.username.toLowerCase()}</p>
            <div className="mt-4 flex justify-center sm:justify-start gap-6">
              <div className="text-center">
                <p className="font-bold text-lg">{posts.length}</p>
                <p className="text-sm text-muted-foreground">Posts</p>
              </div>
            </div>
          </div>
          <Button className="ml-auto mt-4 sm:mt-0 rounded-2xl" variant="outline">
            Editar Perfil
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Coluna Principal: Criar Post e Feed */}
        <div className="lg:col-span-3 space-y-6">
          <form onSubmit={handleCreatePost}>
            <Card>
              <CardHeader>
                <CardTitle>Criar Publicação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid w-full gap-2">
                  <Textarea 
                    placeholder="No que você está pensando hoje?"
                    value={postCaption}
                    onChange={(e) => setPostCaption(e.target.value)}
                  />
                  <div className="flex justify-between items-center">
                    <Button variant="ghost" size="icon" type="button">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </Button>
                    <Button type="submit" className="rounded-2xl" disabled={isCreatingPost}>
                      {isCreatingPost ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      Publicar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>

          <div>
            <h3 className="text-xl font-bold mb-4">Minhas Publicações</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <Card key={post.id} className="overflow-hidden">
                    <img src={post.imageUrl} alt="Post image" className="aspect-video w-full object-cover" />
                    <CardContent className="p-4">
                      <p className="text-sm mb-2">{post.caption}</p>
                      <div className="flex items-center gap-4 text-muted-foreground text-sm">
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4" /> {post.likes}
                      	</span>
                      	<span className="flex items-center gap-1">
                      	  <MessageSquare className="h-4 w-4" /> {post.comments}
                      	</span>
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

  	{/* Coluna Lateral: IMC e Credenciais */}
  	<div className="lg:col-span-1 space-y-6">
  	  <form onSubmit={handleUpdateProfile}>
  	  	<Card>
  	  	  <CardHeader>
  	  	  	<CardTitle>Meu IMC</CardTitle>
  	  	  	<CardDescription>Acompanhe seu Índice de Massa Corporal.</CardDescription>
  	  	  </CardHeader>
  	  	  <CardContent className="space-y-4">
  	  	  	<div className="space-y-2">
  	  	  	  <Label htmlFor="weight">Peso (kg)</Label>
  	  	  	  <Input
  	  	  	  	id="weight"
  	  	  	  	type="number"
  	  	  	  	step="0.1"
  	  	  	  	value={weight}
  	  	  	  	onChange={(e) => setWeight(Number(e.target.value))}
  	  	  	  />
  	  	  	</div>
  	  	  	<div className="space-y-2">
  	  	  	  <Label htmlFor="height">Altura (m)</Label> 
  	  	  	  <Input
  	  	  	  	id="height"
  	  	  	  	type="number"
  	  	  	  	step="0.01"
  	  	  	  	placeholder="Ex: 1.80"
  	  	  	  	value={height}
  	  	  	  	onChange={(e) => setHeight(Number(e.target.value))}
  	  	  	  />
  	  	  	</div>
  	  	  	<div className="text-center pt-2">
  	  	  	  <p className="text-muted-foreground text-sm">Seu IMC é</p>
  	  	  	  <p className="text-4xl font-bold">{bmiData.value}</p>
  	  	  	  <Badge
  	  	  	  	className="mt-2 text-white" 
  	  	  	  	style={{ backgroundColor: bmiData.status.color }}
  	  	  	  >
  	  	  	  	{bmiData.status.label}
  	  	  	  </Badge>
  	  	  	</div>
  	  	  </CardContent>
  	  	  <CardFooter>
  	  	  	<Button type="submit" className="w-full rounded-2xl" disabled={isUpdatingProfile}>
  	  	  	  {isUpdatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  	  	  	  Salvar IMC
  	  	  	</Button>
  	  	  </CardFooter>
  	  	</Card>
  	  </form>

  	  <form onSubmit={handleUpdateCredentials}>
  	  	<Card>
  	  	  <CardHeader>
  	  	  	<CardTitle>Credenciais</CardTitle>
  	  	  </CardHeader>
  	  	  <CardContent className="space-y-4">
  	  	  	<div className="space-y-2">
  	  	  	  <Label htmlFor="username">Login</Label>
  	  	  	  <Input id="username" value={user.username} readOnly />
  	  	  	</div>
  	  	  	<div className="space-y-2">
  	  	  	  <Label htmlFor="password">Nova Senha</Label>
  	  	  	  <Input 
  	  	  	  	id="password" 
  	  	  	  	type="password" 
  	  	  	  	placeholder="••••••••"
  	  	  	  	value={newPassword}
  	  	  	  	onChange={(e) => setNewPassword(e.target.value)}
  	  	  	  />
  	  	  	</div>
  	  	  </CardContent>
  	  	  <CardFooter>
  	  	  	<Button type="submit" className="w-full rounded-2xl" disabled={isUpdatingCreds}>
  	  	  	  {isUpdatingCreds && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  	  	  	  Salvar Senha
  	  	  	</Button>
  	  	  </CardFooter>
  	  	</Card>
  	  </form>
  	</div>
    </div>
  </>
  )
}