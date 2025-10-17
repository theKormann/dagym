// profile.tsx

"use client"

import { useMemo, useState } from "react"
import {
  Heart,
  MessageSquare,
  Image as ImageIcon,
  Send,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// --- DADOS E LÓGICA ESPECÍFICOS DO PERFIL ---

const user = {
  name: "Matheus Kormann",
  username: "MK",
  avatar: "https://github.com/shadcn.png",
  followers: 1250,
  following: 340,
  email: "matheus.kormann@example.com",
  weightKg: 75,
  heightCm: 180,
}

const mockPosts = [
    {
    id: 1,
    imageUrl: "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=2070",
    caption: "Treino de hoje finalizado! Foco total no objetivo. 💪 #fitness #gymlife",
    likes: 128,
    comments: 12,
  },
  {
    id: 2,
    imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2070",
    caption: "Nova rotina de exercícios. Sentindo a evolução a cada dia!",
    likes: 215,
    comments: 25,
  },
  {
    id: 3,
    imageUrl: "https://images.unsplash.com/photo-1594737625787-a8a259be4a03?q=80&w=1932",
    caption: "Dia de descanso também é importante. Recuperando as energias.",
    likes: 98,
    comments: 8,
  },
]

const calculateBmi = (weight: number, height: number) => {
  if (height <= 0) return 0
  const heightInMeters = height / 100
  return weight / (heightInMeters * heightInMeters)
}

const getBmiStatus = (bmi: number) => {
  if (bmi < 18.5) return { label: "Abaixo do Peso", color: "blue" }
  if (bmi < 24.9) return { label: "Peso Ideal", color: "green" }
  if (bmi < 29.9) return { label: "Sobrepeso", color: "yellow" }
  if (bmi < 34.9) return { label: "Obesidade Grau I", color: "orange" }
  if (bmi < 39.9) return { label: "Obesidade Grau II", color: "red" }
  return { label: "Obesidade Grau III", color: "darkred" }
}

// --- COMPONENTE DO PERFIL ---

export function ProfilePage() {
  const [weight, setWeight] = useState(user.weightKg)
  const [height, setHeight] = useState(user.heightCm)

  const bmiData = useMemo(() => {
    const bmiValue = calculateBmi(weight, height)
    return {
      value: bmiValue.toFixed(1),
      status: getBmiStatus(bmiValue),
    }
  }, [weight, height])

  return (
    <>
      {/* Perfil Header */}
      <Card className="mb-6">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
          <Avatar className="h-28 w-28 border-4 border-red-800">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="text-4xl">{user.username}</AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-muted-foreground">@{user.username.toLowerCase()}</p>
            <div className="mt-4 flex justify-center sm:justify-start gap-6">
              <div className="text-center">
                <p className="font-bold text-lg">{mockPosts.length}</p>
                <p className="text-sm text-muted-foreground">Posts</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{user.followers}</p>
                <p className="text-sm text-muted-foreground">Seguidores</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{user.following}</p>
                <p className="text-sm text-muted-foreground">Seguindo</p>
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
          <Card>
            <CardHeader>
              <CardTitle>Criar Publicação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid w-full gap-2">
                <Textarea placeholder="No que você está pensando hoje?" />
                <div className="flex justify-between items-center">
                  <Button variant="ghost" size="icon">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  </Button>
                  <Button className="rounded-2xl">
                    Publicar <Send className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <h3 className="text-xl font-bold mb-4">Minhas Publicações</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mockPosts.map((post) => (
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
              ))}
            </div>
          </div>
        </div>

        {/* Coluna Lateral: IMC e Credenciais */}
        <div className="lg:col-span-1 space-y-6">
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
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Altura (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                />
              </div>
              <div className="text-center pt-2">
                <p className="text-muted-foreground text-sm">Seu IMC é</p>
                <p className="text-4xl font-bold">{bmiData.value}</p>
                <Badge
                  className="mt-2"
                  style={{ backgroundColor: bmiData.status.color, color: "white" }}
                >
                  {bmiData.status.label}
                </Badge>
              </div>
            </CardContent>
          </Card>

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
                <Input id="password" type="password" placeholder="••••••••" />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full rounded-2xl">Salvar</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  )
}