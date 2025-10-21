"use client"

import React, { useState } from "react"
import { CheckCircle } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

// --- DADOS DE EXEMPLO PARA OS TREINOS ---
const workoutPlans = [
  {
    id: "beginner",
    title: "Plano Iniciante",
    description: "Foco em construir uma base sólida com exercícios compostos.",
    level: "Iniciante",
    weeklySchedule: {
      Segunda: [
        { name: "Agachamento", sets: "3", reps: "10-12", image: "/workouts/squat.jpg" },
        { name: "Supino Reto", sets: "3", reps: "10-12", image: "/workouts/bench-press.jpg" },
        { name: "Remada Curvada", sets: "3", reps: "10-12", image: "/workouts/row.jpg" },
      ],
      Quarta: [
        { name: "Levantamento Terra", sets: "3", reps: "8-10", image: "/workouts/deadlift.jpg" },
        { name: "Desenvolvimento Militar", sets: "3", reps: "10-12", image: "/workouts/shoulder-press.jpg" },
        { name: "Puxada Vertical", sets: "3", reps: "10-12", image: "/workouts/pull-down.jpg" },
      ],
      Sexta: [
        { name: "Agachamento", sets: "3", reps: "10-12", image: "/workouts/squat.jpg" },
        { name: "Supino Inclinado", sets: "3", reps: "10-12", image: "/workouts/incline-press.jpg" },
        { name: "Remada Cavalinho", sets: "3", reps: "10-12", image: "/workouts/t-bar-row.jpg" },
      ],
      Terça: [],
      Quinta: [],
      Sábado: [],
      Domingo: [],
    },
  },
  {
    id: "intermediate",
    title: "Plano Intermediário",
    description: "Aumente a intensidade e o volume para maximizar a hipertrofia.",
    level: "Intermediário",
    weeklySchedule: {
      Segunda: [
        { name: "Supino Reto c/ Halteres", sets: "4", reps: "8-10", image: "/workouts/db-press.jpg" },
        { name: "Crucifixo Inclinado", sets: "3", reps: "12-15", image: "/workouts/db-fly.jpg" },
        { name: "Tríceps Pulley", sets: "4", reps: "10-12", image: "/workouts/triceps-pulley.jpg" },
      ],
      Terça: [
        { name: "Agachamento Livre", sets: "4", reps: "8-10", image: "/workouts/squat.jpg" },
        { name: "Leg Press 45", sets: "3", reps: "12-15", image: "/workouts/leg-press.jpg" },
        { name: "Cadeira Extensora", sets: "4", reps: "10-12", image: "/workouts/leg-extension.jpg" },
      ],
      Quinta: [
        { name: "Barra Fixa", sets: "4", reps: "Falha", image: "/workouts/pull-up.jpg" },
        { name: "Remada Unilateral", sets: "3", reps: "10-12", image: "/workouts/one-arm-row.jpg" },
        { name: "Rosca Direta", sets: "4", reps: "10-12", image: "/workouts/bicep-curl.jpg" },
      ],
      Sexta: [
        { name: "Desenvolvimento Arnold", sets: "4", reps: "8-10", image: "/workouts/arnold-press.jpg" },
        { name: "Elevação Lateral", sets: "3", reps: "12-15", image: "/workouts/lat-raise.jpg" },
        { name: "Panturrilha em Pé", sets: "4", reps: "15-20", image: "/workouts/calf-raise.jpg" },
      ],
      Quarta: [],
      Sábado: [],
      Domingo: [],
    },
  },
]

const weekDays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]

export function WorkoutPage() {
  const [selectedPlanId, setSelectedPlanId] = useState(workoutPlans[0].id)
  const [selectedDay, setSelectedDay] = useState(weekDays[0])

  const selectedPlan = workoutPlans.find((p) => p.id === selectedPlanId)
  const dailyExercises = selectedPlan?.weeklySchedule[selectedDay] || []

  const totalExercises = Object.values(selectedPlan?.weeklySchedule || {}).flat().length
  const completedExercises = 12 // Exemplo estático

  return (
    <Tabs defaultValue={selectedPlanId} onValueChange={setSelectedPlanId} className="w-full">
      <TabsList className="grid w-full grid-cols-2 lg:w-1/3">
        {workoutPlans.map((plan) => (
          <TabsTrigger key={plan.id} value={plan.id}>
            {plan.level}
          </TabsTrigger>
        ))}
      </TabsList>

      {workoutPlans.map((plan) => (
        <TabsContent key={plan.id} value={plan.id} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{plan.title}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Progresso Semanal</h3>
                  <span className="text-sm font-bold text-red-700">
                    {Math.round((completedExercises / totalExercises) * 100)}%
                  </span>
                </div>
                <Progress value={(completedExercises / totalExercises) * 100} className="w-full [&>*]:bg-red-700" />
              </div>

              <div className="flex items-center justify-center space-x-2 mb-6">
                {weekDays.map((day) => (
                  <Button
                    key={day}
                    variant={selectedDay === day ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "rounded-lg",
                      selectedDay === day && "bg-red-800 hover:bg-red-900",
                      (plan.weeklySchedule[day] || []).length === 0 && "text-muted-foreground",
                    )}
                    onClick={() => setSelectedDay(day)}
                  >
                    {day.substring(0, 3)}
                  </Button>
                ))}
              </div>

              <div className="space-y-4">
                {dailyExercises.length > 0 ? (
                  dailyExercises.map((exercise, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                      <div className="w-24 h-24 bg-gray-200 rounded-md overflow-hidden flex-shrink-0 relative">
                        <Image src={exercise.image} alt={exercise.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{exercise.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {exercise.sets} séries x {exercise.reps} repetições
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="text-green-500">
                        <CheckCircle />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <p className="font-semibold">Dia de Descanso</p>
                    <p className="text-sm text-muted-foreground">Aproveite para recuperar!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  )
}
