"use client"

import React, { useState, useEffect } from "react"
import { Award, Users, Flame, Zap, Trophy, ShieldCheck, PlusCircle, Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

// Fallback para localhost caso a env não esteja definida
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

// --- Interfaces ---
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

export function ChallengesPage() {
  // --- Estados de Dados ---
  const [availableChallenges, setAvailableChallenges] = useState<Challenge[]>([])
  const [myChallenges, setMyChallenges] = useState<UserChallenge[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  // --- Estados de UI ---
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // --- Form Estado ---
  const [newChallenge, setNewChallenge] = useState({
    title: "", 
    description: "", 
    category: "Bem-Estar", 
    duration: "7 dias", 
    totalTarget: 7, 
    reward: "🏆 Conquista"
  })

  // --- Efeitos ---
  useEffect(() => {
    const init = async () => {
      const storedUser = localStorage.getItem('dagym_user')
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser)
          setCurrentUser(user)
          await fetchData(user.id)
        } catch (e) {
          console.error("Erro ao ler usuário do cache", e)
          await fetchPublicOnly()
        }
      } else {
        // Se não tiver usuário logado, carrega apenas a lista pública para não travar a tela
        await fetchPublicOnly()
      }
    }
    init()
  }, [])

  // --- Funções de Busca ---

  // Busca dados completos (Comunidade + Meus Desafios)
  const fetchData = async (userId: number) => {
    setIsLoading(true)
    try {
      // 1. Buscar todos os desafios da plataforma
      const allRes = await fetch(`${API_URL}/api/challenges`)
      let allData: Challenge[] = []
      if (allRes.ok) allData = await allRes.json()

      // 2. Buscar desafios que o usuário já participa
      const myRes = await fetch(`${API_URL}/api/challenges/user/${userId}`)
      let myData: UserChallenge[] = []
      if (myRes.ok) myData = await myRes.json()

      setMyChallenges(myData)

      // 3. Filtrar: Disponíveis são aqueles que o usuário AINDA NÃO tem
      const myChallengeIds = new Set(myData.map(uc => uc.challenge.id))
      const available = allData.filter((c: Challenge) => !myChallengeIds.has(c.id))
      
      setAvailableChallenges(available)

    } catch (error) {
      console.error("Erro ao buscar dados:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Busca apenas dados públicos (Caso usuário não esteja logado)
  const fetchPublicOnly = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/challenges`)
      if (res.ok) {
        const data = await res.json()
        setAvailableChallenges(data)
      }
    } catch (error) {
      console.error("Erro ao buscar desafios públicos:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // --- Handlers (Ações) ---

  const handleAcceptChallenge = async (challengeId: number) => {
    if (!currentUser) {
        alert("Você precisa fazer login para aceitar um desafio.")
        return
    }

    try {
      const res = await fetch(`${API_URL}/api/challenges/${challengeId}/accept/${currentUser.id}`, {
        method: "POST"
      })
      
      if (res.ok) {
        // Recarrega os dados para mover o card de "Disponível" para "Meus Desafios"
        fetchData(currentUser.id) 
      } else {
        const errorMsg = await res.text()
        alert(`Não foi possível aceitar: ${errorMsg}`)
      }
    } catch (error) {
      alert("Erro de conexão ao aceitar desafio.")
    }
  }

  const handleCreateChallenge = async () => {
    if (!currentUser) return alert("Faça login para criar desafios.")
    
    setIsSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/api/challenges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newChallenge)
      })

      if (res.ok) {
        setIsCreateModalOpen(false)
        // Reset do form
        setNewChallenge({ title: "", description: "", category: "Bem-Estar", duration: "7 dias", totalTarget: 7, reward: "🏆 Conquista" })
        // Atualiza a lista
        fetchData(currentUser.id)
      } else {
        alert("Erro ao criar desafio. Verifique os dados.")
      }
    } catch (error) {
      alert("Erro de conexão.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleProgressUpdate = async (userChallengeId: number) => {
     try {
        const res = await fetch(`${API_URL}/api/challenges/${userChallengeId}/progress`, { method: "PUT" })
        if (res.ok && currentUser) {
            // Atualiza UI para refletir novo progresso
            fetchData(currentUser.id)
        }
     } catch (e) { 
         console.error("Erro ao atualizar progresso", e) 
     }
  }

  // --- Cálculos de UI ---
  const activeChallenges = Array.isArray(myChallenges) ? myChallenges.filter(c => c.status === "active") : []
  const completedChallenges = Array.isArray(myChallenges) ? myChallenges.filter(c => c.status === "completed") : []

  // --- Renderização ---

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-96">
            <Loader2 className="animate-spin h-10 w-10 text-red-600"/>
        </div>
    )
  }

  return (
    <div className="space-y-8 pb-20 container mx-auto px-4">
      
      {/* CABEÇALHO */}
      <div className="flex justify-between items-center mt-6">
         <h2 className="text-2xl font-bold">Central de Desafios</h2>
         <Button onClick={() => setIsCreateModalOpen(true)} className="bg-red-800 hover:bg-red-900 text-white">
            <PlusCircle className="mr-2 h-4 w-4"/> Criar Desafio
         </Button>
      </div>

      {/* 1. MEUS DESAFIOS ATIVOS */}
      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary">
            <Flame className="text-orange-500 fill-orange-500"/> Meus Desafios Ativos
        </h3>
        
        {activeChallenges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeChallenges.map((uc) => (
              <Card key={uc.id} className="border-red-700/30 border-2 shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{uc.challenge.title}</CardTitle>
                      <CardDescription>{uc.challenge.duration}</CardDescription>
                    </div>
                    <Badge variant="destructive">{uc.challenge.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{uc.challenge.description}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold">Progresso</span>
                      <span>{uc.progress} / {uc.challenge.totalTarget} dias</span>
                    </div>
                    <Progress value={(uc.progress / uc.challenge.totalTarget) * 100} className="h-2" />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center bg-secondary/20 pt-4 rounded-b-lg">
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Trophy className="h-4 w-4 mr-2 text-yellow-600" /> {uc.challenge.reward}
                  </div>
                  <Button size="sm" variant="default" onClick={() => handleProgressUpdate(uc.id)}>
                    <Zap className="h-3 w-3 mr-2"/> Check-in Diário
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 bg-muted/30 rounded-lg border border-dashed">
            <p className="text-muted-foreground">Você não está participando de nenhum desafio no momento.</p>
            <p className="text-sm text-muted-foreground mt-1">Escolha um desafio abaixo para começar!</p>
          </div>
        )}
      </div>

      {/* 2. DESAFIOS DA COMUNIDADE (Disponíveis) */}
      <div className="pt-4">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="text-blue-500"/> Explorar Comunidade
        </h3>
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="Cardio">Cardio</TabsTrigger>
            <TabsTrigger value="Força">Força</TabsTrigger>
            <TabsTrigger value="Bem-Estar">Bem-Estar</TabsTrigger>
            <TabsTrigger value="Flexibilidade">Flexibilidade</TabsTrigger>
          </TabsList>
          
          {["all", "Cardio", "Força", "Bem-Estar", "Flexibilidade"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-6 animate-in fade-in-50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableChallenges
                    .filter(c => tab === "all" || c.category === tab)
                    .map((challenge) => (
                    <Card key={challenge.id} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg line-clamp-1">{challenge.title}</CardTitle>
                                    <CardDescription>{challenge.duration}</CardDescription>
                                </div>
                                <Badge variant="secondary">{challenge.category}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="h-24">
                            <p className="text-sm text-muted-foreground line-clamp-3">{challenge.description}</p>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-3 border-t pt-4">
                            <div className="w-full flex justify-between text-sm text-muted-foreground">
                                <span className="flex items-center"><Users className="h-3 w-3 mr-1" /> {challenge.participantsCount}</span>
                                <span className="flex items-center"><Trophy className="h-3 w-3 mr-1 text-yellow-500" /> {challenge.reward}</span>
                            </div>
                            <Button className="w-full" variant="outline" onClick={() => handleAcceptChallenge(challenge.id)}>
                                Aceitar Desafio
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
                
                {availableChallenges.filter(c => tab === "all" || c.category === tab).length === 0 && (
                    <div className="col-span-full py-12 text-center">
                        <p className="text-muted-foreground">Nenhum desafio encontrado nesta categoria.</p>
                    </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* 3. DESAFIOS CONCLUÍDOS */}
      {completedChallenges.length > 0 && (
        <div className="pt-8 border-t">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-600">
                <Award className="text-yellow-500"/> Conquistas Desbloqueadas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {completedChallenges.map((uc) => (
                <Card key={uc.id} className="bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-900">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                    <CardTitle className="text-base text-muted-foreground line-through decoration-green-500/50">
                        {uc.challenge.title}
                    </CardTitle>
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                    </div>
                </CardHeader>
                <CardFooter className="text-xs font-bold text-green-700 pt-2">
                    Conquistado: {uc.challenge.reward}
                </CardFooter>
                </Card>
            ))}
            </div>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
                <DialogTitle>Criar Novo Desafio</DialogTitle>
                <DialogDescription>Motive a comunidade Dagym criando um desafio público.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label>Título do Desafio</Label>
                    <Input 
                        value={newChallenge.title} 
                        onChange={e => setNewChallenge({...newChallenge, title: e.target.value})}
                        placeholder="Ex: 30 Dias Sem Açúcar"
                    />
                </div>
                <div className="grid gap-2">
                    <Label>Descrição e Regras</Label>
                    <Textarea 
                        value={newChallenge.description} 
                        onChange={e => setNewChallenge({...newChallenge, description: e.target.value})}
                        placeholder="Explique como funciona o desafio..."
                        className="h-24"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label>Categoria</Label>
                        <Select 
                            value={newChallenge.category} 
                            onValueChange={v => setNewChallenge({...newChallenge, category: v})}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Cardio">Cardio</SelectItem>
                                <SelectItem value="Força">Força</SelectItem>
                                <SelectItem value="Bem-Estar">Bem-Estar</SelectItem>
                                <SelectItem value="Flexibilidade">Flexibilidade</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Meta (Dias)</Label>
                        <Input 
                            type="number"
                            min="1"
                            value={newChallenge.totalTarget} 
                            onChange={e => setNewChallenge({
                                ...newChallenge, 
                                totalTarget: Number(e.target.value), 
                                duration: `${e.target.value} dias`
                            })}
                        />
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label>Nome da Recompensa (Badge)</Label>
                    <Input 
                        value={newChallenge.reward} 
                        onChange={e => setNewChallenge({...newChallenge, reward: e.target.value})}
                        placeholder="Ex: Mestre Zen 🧘"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateChallenge} disabled={isSubmitting} className="bg-red-700 hover:bg-red-800">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} 
                    Criar Desafio
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}