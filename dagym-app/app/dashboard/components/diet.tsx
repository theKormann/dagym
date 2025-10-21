// diet.tsx

"use client"

import React, { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, Flame, Beef, Wheat, Lollipop } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

// --- DADOS DE EXEMPLO PARA O PLANO DE DIETA ---

const dietPlan = {
  name: "Plano de Equilíbrio Nutricional",
  dailyGoal: { calories: 2200, protein: 150, carbs: 250, fats: 73 },
  week: {
    Segunda: {
      "Café da Manhã": [
        { name: "Ovos Mexidos", qty: "3 unidades", image: "/diet/eggs.jpg" },
        { name: "Pão Integral", qty: "2 fatias", image: "/diet/bread.jpg" },
        { name: "Abacate", qty: "1/2 unidade", image: "/diet/avocado.jpg" },
      ],
      "Almoço": [
        { name: "Frango Grelhado", qty: "150g", image: "/diet/chicken.jpg" },
        { name: "Arroz Integral", qty: "100g", image: "/diet/rice.jpg" },
        { name: "Salada de Folhas", qty: "A gosto", image: "/diet/salad.jpg" },
      ],
      "Lanche da Tarde": [{ name: "Iogurte Grego", qty: "1 pote", image: "/diet/yogurt.jpg" }],
      "Jantar": [
        { name: "Salmão Assado", qty: "150g", image: "/diet/salmon.jpg" },
        { name: "Batata Doce", qty: "100g", image: "/diet/sweet-potato.jpg" },
      ],
    },
    Terça: {
      "Café da Manhã": [
        { name: "Shake de Proteína", qty: "1 scoop", image: "/diet/shake.jpg" },
        { name: "Banana", qty: "1 unidade", image: "/diet/banana.jpg" },
      ],
      "Almoço": [
        { name: "Patinho Moído", qty: "150g", image: "/diet/beef.jpg" },
        { name: "Macarrão Integral", qty: "100g", image: "/diet/pasta.jpg" },
      ],
      "Lanche da Tarde": [{ name: "Mix de Castanhas", qty: "30g", image: "/diet/nuts.jpg" }],
      "Jantar": [
        { name: "Omelete de Queijo", qty: "3 ovos", image: "/diet/omelette.jpg" },
        { name: "Salada de Tomate", qty: "A gosto", image: "/diet/salad.jpg" },
      ],
    },
  },
}

const foodData = {
  "Ovos Mexidos": { calories: 210, protein: 18, carbs: 2, fats: 15 },
  "Pão Integral": { calories: 140, protein: 8, carbs: 26, fats: 2 },
  "Abacate": { calories: 160, protein: 2, carbs: 9, fats: 15 },
  "Frango Grelhado": { calories: 240, protein: 45, carbs: 0, fats: 6 },
  "Arroz Integral": { calories: 130, protein: 3, carbs: 28, fats: 1 },
  "Salada de Folhas": { calories: 20, protein: 1, carbs: 4, fats: 0 },
  "Iogurte Grego": { calories: 100, protein: 18, carbs: 7, fats: 0 },
  "Salmão Assado": { calories: 300, protein: 35, carbs: 0, fats: 18 },
  "Batata Doce": { calories: 110, protein: 2, carbs: 26, fats: 0 },
  "Shake de Proteína": { calories: 120, protein: 25, carbs: 3, fats: 1 },
  "Banana": { calories: 105, protein: 1, carbs: 27, fats: 0 },
  "Patinho Moído": { calories: 250, protein: 40, carbs: 0, fats: 10 },
  "Macarrão Integral": { calories: 150, protein: 6, carbs: 32, fats: 1 },
  "Mix de Castanhas": { calories: 180, protein: 5, carbs: 6, fats: 16 },
  "Omelete de Queijo": { calories: 350, protein: 25, carbs: 3, fats: 26 },
  "Salada de Tomate": { calories: 30, protein: 1, carbs: 7, fats: 0 },
}

const weekDays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]

export function DietPage() {
  const [dayIndex, setDayIndex] = useState(0)

  const handleDayChange = (direction: number) => {
    setDayIndex((prev) => (prev + direction + weekDays.length) % weekDays.length)
  }

  const currentDay = weekDays[dayIndex]
  const meals = dietPlan.week[currentDay] || {}

  const dailyTotals = useMemo(() => {
    let totals = { calories: 0, protein: 0, carbs: 0, fats: 0 }
    if (!meals) return totals

    for (const meal of Object.values(meals)) {
      for (const food of meal) {
        const data = foodData[food.name]
        if (data) {
          totals.calories += data.calories
          totals.protein += data.protein
          totals.carbs += data.carbs
          totals.fats += data.fats
        }
      }
    }
    return totals
  }, [meals])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{dietPlan.name}</CardTitle>
          <CardDescription>Seu plano alimentar personalizado para atingir seus objetivos.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="flex items-center gap-4">
            <Flame className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-sm text-muted-foreground">Calorias</p>
              <p className="text-lg font-bold">
                {dailyTotals.calories} / {dietPlan.dailyGoal.calories} kcal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Beef className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-sm text-muted-foreground">Proteínas</p>
              <p className="text-lg font-bold">
                {dailyTotals.protein}g / {dietPlan.dailyGoal.protein}g
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Wheat className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-sm text-muted-foreground">Carboidratos</p>
              <p className="text-lg font-bold">
                {dailyTotals.carbs}g / {dietPlan.dailyGoal.carbs}g
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Lollipop className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">Gorduras</p>
              <p className="text-lg font-bold">
                {dailyTotals.fats}g / {dietPlan.dailyGoal.fats}g
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" onClick={() => handleDayChange(-1)}>
          <ChevronLeft />
        </Button>
        <h2 className="text-2xl font-bold w-32 text-center">{currentDay}</h2>
        <Button variant="outline" size="icon" onClick={() => handleDayChange(1)}>
          <ChevronRight />
        </Button>
      </div>

      
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {Object.keys(meals).length > 0 ? (
          Object.entries(meals).map(([mealName, foods]) => (
            <Card key={mealName}>
              <CardHeader>
                <CardTitle>{mealName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {foods.map((food: { name: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; qty: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined }, index: React.Key | null | undefined) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                    </div>
                    <div>
                      <p className="font-semibold">{food.name}</p>
                      <p className="text-sm text-muted-foreground">{food.qty}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="md:col-span-2 xl:col-span-4 text-center py-10">
            <p className="font-semibold">Dia Livre ou de Descanso</p>
            <p className="text-sm text-muted-foreground">Nenhuma refeição planejada para hoje.</p>
          </div>
        )}
      </div>
    </div>
  )
}