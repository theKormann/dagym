"use client"

import React, { useMemo } from "react"
import { Award, Users, Flame, Zap, Trophy, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const allChallenges = [
  {
    id: "active1",
    title: "Maratona de Cardio - 30 Dias",
    description: "Complete 30 minutos de cardio todos os dias por um mês.",
    category: "Cardio",
    duration: "30 dias",
    reward: "Medalha de Resistência 🥉",
    participants: 1250,
    progress: 18,
    total: 30,
    status: "active",
  },
  {
    id: "active2",
    title: "Semana da Força Total",
    description: "Siga o plano de treino de força por 7 dias consecutivos.",
    category: "Força",
    duration: "7 dias",
    reward: "Emblema de Força 💪",
    participants: 890,
    progress: 4,
    total: 7,
    status: "active",
  },
  {
    id: "available1",
    title: "Desafio do Agachamento",
    description: "Faça 100 agachamentos por dia durante 15 dias.",
    category: "Força",
    duration: "15 dias",
    reward: "Ícone de Pernas de Aço 🦵",
    participants: 2345,
    status: "available",
  },
  {
    id: "available2",
    title: "Hidratação é Vida",
    description: "Beba 3 litros de água todos os dias por um mês.",
    category: "Bem-Estar",
    duration: "30 dias",
    reward: "Selo de Hidratação 💧",
    participants: 5821,
    status: "available",
  },
  {
    id: "available3",
    title: "Manhãs Milagrosas",
    description: "Acorde às 5h da manhã e faça uma atividade física por 10 dias.",
    category: "Disciplina",
    duration: "10 dias",
    reward: "Troféu Alvorada ☀️",
    participants: 450,
    status: "available",
  },
  {
    id: "completed1",
    title: "Desafio de 10.000 Passos",
    description: "Caminhe pelo menos 10.000 passos todos os dias por 2 semanas.",
    category: "Cardio",
    duration: "14 dias",
    reward: "Medalha de Caminhante 👟",
    status: "completed",
  },
]

export function ChallengesPage() {
  const activeChallenges = useMemo(() => allChallenges.filter((c) => c.status === "active"), [])
  const availableChallenges = useMemo(() => allChallenges.filter((c) => c.status === "available"), [])
  const completedChallenges = useMemo(() => allChallenges.filter((c) => c.status === "completed"), [])

  return (
    <div className="space-y-8">
      {/* Desafios Ativos */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Meus Desafios Ativos</h2>
        {activeChallenges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeChallenges.map((challenge) => (
              <Card key={challenge.id} className="border-red-700 border-2">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{challenge.title}</CardTitle>
                      <CardDescription>{challenge.duration}</CardDescription>
                    </div>
                    <Badge variant="destructive">{challenge.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{challenge.description}</p>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold">Progresso</span>
                      <span>
                        Dia {challenge.progress} de {challenge.total}
                      </span>
                    </div>
                    <Progress value={((challenge.progress ?? 0) / (challenge.total ?? 1)) * 100} className="[&>*]:bg-red-700" />
                  </div>
                </CardContent>
                <CardFooter className="text-sm text-muted-foreground">
                  <Trophy className="h-4 w-4 mr-2" /> Recompensa: {challenge.reward}
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Você não está participando de nenhum desafio no momento.</p>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Novos Desafios</h2>
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="Cardio">Cardio</TabsTrigger>
            <TabsTrigger value="Força">Força</TabsTrigger>
            <TabsTrigger value="Bem-Estar">Bem-Estar</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <ChallengeGrid challenges={availableChallenges} />
          </TabsContent>
          <TabsContent value="Cardio" className="mt-4">
            <ChallengeGrid challenges={availableChallenges.filter((c) => c.category === "Cardio")} />
          </TabsContent>
          <TabsContent value="Força" className="mt-4">
            <ChallengeGrid challenges={availableChallenges.filter((c) => c.category === "Força")} />
          </TabsContent>
          <TabsContent value="Bem-Estar" className="mt-4">
            <ChallengeGrid challenges={availableChallenges.filter((c) => c.category === "Bem-Estar")} />
          </TabsContent>
        </Tabs>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Desafios Concluídos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {completedChallenges.map((challenge) => (
            <Card key={challenge.id} className="bg-muted/50">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-muted-foreground">{challenge.title}</CardTitle>
                  <ShieldCheck className="h-6 w-6 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{challenge.description}</p>
              </CardContent>
              <CardFooter className="text-sm font-semibold text-green-600">
                <Trophy className="h-4 w-4 mr-2" />
                Recompensa Obtida: {challenge.reward}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

type Challenge = {
  id: string
  title: string
  description: string
  category: string
  duration: string
  reward: string
  participants?: number
  progress?: number
  total?: number
  status: string
}

const ChallengeGrid: React.FC<{ challenges: Challenge[] }> = ({ challenges }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {challenges.map((challenge) => (
      <Card key={challenge.id}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{challenge.title}</CardTitle>
              <CardDescription>{challenge.duration}</CardDescription>
            </div>
            <Badge variant="secondary">{challenge.category}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{challenge.description}</p>
          <div className="text-sm text-muted-foreground flex items-center">
            <Users className="h-4 w-4 mr-2" /> {challenge.participants} participantes
          </div>
        </CardContent>
        <CardFooter className="flex-col items-start gap-4">
          <div className="text-sm text-muted-foreground flex items-center">
            <Trophy className="h-4 w-4 mr-2" /> Recompensa: {challenge.reward}
          </div>
          <Button className="w-full">
            <Zap className="h-4 w-4 mr-2" /> Aceitar Desafio
          </Button>
        </CardFooter>
      </Card>
    ))}
  </div>
)