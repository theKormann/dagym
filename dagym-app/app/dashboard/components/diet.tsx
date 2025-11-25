"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Beef, 
  Wheat, 
  Lollipop, 
  PlusCircle, 
  Save, 
  Loader2,
  Trash2,
  Settings,
  Pencil
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// --- TIPOS ---
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

const weekDays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]
const mealTypes = ["Café da Manhã", "Almoço", "Lanche da Tarde", "Jantar", "Ceia"]
const API_URL = process.env.NEXT_PUBLIC_API_URL

// Template vazio para novos usuários
const emptyPlan: DietPlan = {
  name: "Meu Plano Alimentar",
  dailyGoal: { calories: 2000, protein: 150, carbs: 200, fats: 60 },
  week: {
    "Segunda": {}, "Terça": {}, "Quarta": {}, "Quinta": {}, "Sexta": {}, "Sábado": {}, "Domingo": {}
  }
}

export function DietPage() {
  const router = useRouter()

  // --- ESTADOS ---
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null)
  const [dayIndex, setDayIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Estados do Modal de Alimentos
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingContext, setEditingContext] = useState<{ mealName: string, foodIndex: number | null } | null>(null)
  const [foodForm, setFoodForm] = useState<FoodItem>({
    name: "", qty: "", calories: 0, protein: 0, carbs: 0, fats: 0
  })
  const [selectedMealType, setSelectedMealType] = useState(mealTypes[0])

  // --- NOVOS ESTADOS: Modal de Metas ---
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [goalForm, setGoalForm] = useState({
    calories: 0, protein: 0, carbs: 0, fats: 0
  })

  // --- CARREGAMENTO ---
  useEffect(() => {
    const storedUser = localStorage.getItem('dagym_user')
    if (!storedUser) {
      router.push('/login')
      return
    }
    
    const user = JSON.parse(storedUser)
    setCurrentUser(user)

    const fetchDiet = async () => {
      if (!API_URL) return
      try {
        const res = await fetch(`${API_URL}/api/diet/${user.id}`)
        if (res.ok) {
          const text = await res.text()
          if (text) {
            setDietPlan(JSON.parse(text))
          } else {
            setDietPlan(emptyPlan)
          }
        } else {
            setDietPlan(emptyPlan)
        }
      } catch (error) {
        console.error("Erro ao buscar dieta", error)
        setDietPlan(emptyPlan)
      } finally {
        setIsLoading(false)
      }
    }
    fetchDiet()
  }, [router])

  // --- LÓGICA DE CÁLCULO ---
  const currentDay = weekDays[dayIndex]
  
  const dailyTotals = useMemo(() => {
    let totals = { calories: 0, protein: 0, carbs: 0, fats: 0 }
    if (!dietPlan || !dietPlan.week[currentDay]) return totals

    const meals = dietPlan.week[currentDay]
    Object.values(meals).forEach((foods) => {
      foods.forEach((food) => {
        totals.calories += Number(food.calories) || 0
        totals.protein += Number(food.protein) || 0
        totals.carbs += Number(food.carbs) || 0
        totals.fats += Number(food.fats) || 0
      })
    })
    return totals
  }, [dietPlan, currentDay])


  const handleDayChange = (direction: number) => {
    setDayIndex((prev) => (prev + direction + weekDays.length) % weekDays.length)
  }

  const handleSaveDiet = async () => {
    if (!currentUser || !dietPlan) return
    setIsSaving(true)
    try {
      const res = await fetch(`${API_URL}/api/diet/${currentUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dietJson: JSON.stringify(dietPlan) })
      })
      
      if (!res.ok) throw new Error("Falha na requisição") 
      
      alert("Dieta salva com sucesso!")
    } catch (error) {
      console.error("Erro detalhado:", error) 
      alert("Erro ao salvar dieta.")
    } finally {
      setIsSaving(false)
    }
}

  // --- HANDLERS: METAS (GOALS) ---
  const openGoalModal = () => {
    if (dietPlan) {
      setGoalForm(dietPlan.dailyGoal)
      setIsGoalModalOpen(true)
    }
  }

  const saveGoals = () => {
    if (!dietPlan) return
    
    const newDiet = { 
      ...dietPlan, 
      dailyGoal: {
        calories: Number(goalForm.calories),
        protein: Number(goalForm.protein),
        carbs: Number(goalForm.carbs),
        fats: Number(goalForm.fats),
      }
    }
    
    setDietPlan(newDiet)
    setIsGoalModalOpen(false)
  }

  // --- HANDLERS: ALIMENTOS ---

  const openAddFoodModal = (mealName?: string) => {
    setFoodForm({ name: "", qty: "", calories: 0, protein: 0, carbs: 0, fats: 0 })
    setSelectedMealType(mealName || mealTypes[0])
    setEditingContext(mealName ? { mealName, foodIndex: null } : null) 
    setIsModalOpen(true)
  }

  const openEditFoodModal = (mealName: string, food: FoodItem, index: number) => {
    setFoodForm(food)
    setSelectedMealType(mealName)
    setEditingContext({ mealName, foodIndex: index })
    setIsModalOpen(true)
  }

  const deleteFood = (mealName: string, index: number) => {
    if (!dietPlan) return
    if (!confirm("Remover este alimento?")) return

    const newDiet = { ...dietPlan }
    const dayMeals = { ...newDiet.week[currentDay] }
    
    dayMeals[mealName] = dayMeals[mealName].filter((_, i) => i !== index)
    
    newDiet.week[currentDay] = dayMeals
    setDietPlan(newDiet)
  }

  const saveFood = () => {
    if (!dietPlan) return

    const newDiet = { ...dietPlan }
    // Garante que o objeto do dia existe
    if (!newDiet.week[currentDay]) newDiet.week[currentDay] = {}
    
    const targetMeal = editingContext?.mealName || selectedMealType
    
    // Garante que o array da refeição existe
    if (!newDiet.week[currentDay][targetMeal]) {
      newDiet.week[currentDay][targetMeal] = []
    }

    const foodData = {
        ...foodForm,
        calories: Number(foodForm.calories),
        protein: Number(foodForm.protein),
        carbs: Number(foodForm.carbs),
        fats: Number(foodForm.fats),
    }

    if (editingContext && editingContext.foodIndex !== null) {
      // Editar existente
      newDiet.week[currentDay][targetMeal][editingContext.foodIndex] = foodData
    } else {
      // Adicionar novo
      newDiet.week[currentDay][targetMeal].push(foodData)
    }

    setDietPlan(newDiet)
    setIsModalOpen(false)
  }

  if (isLoading) {
    return <div className="flex justify-center p-10"><Loader2 className="animate-spin h-8 w-8 text-red-600"/></div>
  }

  if (!dietPlan) return null

  // Ordenar as refeições para exibição
  const mealsOfDay = dietPlan.week[currentDay] || {}
  const sortedMealKeys = Object.keys(mealsOfDay).sort(
    (a, b) => mealTypes.indexOf(a) - mealTypes.indexOf(b)
  )

  return (
    <div className="space-y-6 pb-20">
      {/* CABEÇALHO DE MACROS */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="flex items-center gap-2">
                {dietPlan.name}
            </CardTitle>
            
            <div className="flex items-center gap-2 text-muted-foreground">
                <CardDescription>
                    Meta Diária: {dietPlan.dailyGoal.calories} kcal
                </CardDescription>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={openGoalModal}
                    title="Editar Metas da Dieta"
                >
                    <Settings className="h-4 w-4" />
                </Button>
            </div>

          </div>
          <Button onClick={handleSaveDiet} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
            {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Save className="mr-2 h-4 w-4"/>}
            Salvar Alterações
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <MacroCard 
            icon={<Flame className="h-6 w-6 text-red-500" />} 
            label="Calorias" 
            current={dailyTotals.calories} 
            total={dietPlan.dailyGoal.calories} 
            unit="kcal"
          />
          <MacroCard 
            icon={<Beef className="h-6 w-6 text-orange-500" />} 
            label="Proteínas" 
            current={dailyTotals.protein} 
            total={dietPlan.dailyGoal.protein} 
            unit="g"
          />
          <MacroCard 
            icon={<Wheat className="h-6 w-6 text-yellow-500" />} 
            label="Carboidratos" 
            current={dailyTotals.carbs} 
            total={dietPlan.dailyGoal.carbs} 
            unit="g"
          />
          <MacroCard 
            icon={<Lollipop className="h-6 w-6 text-purple-500" />} 
            label="Gorduras" 
            current={dailyTotals.fats} 
            total={dietPlan.dailyGoal.fats} 
            unit="g"
          />
        </CardContent>
      </Card>

      {/* NAVEGAÇÃO DE DIAS */}
      <div className="flex items-center justify-center gap-4 bg-muted p-2 rounded-lg">
        <Button variant="ghost" size="icon" onClick={() => handleDayChange(-1)}>
          <ChevronLeft />
        </Button>
        <h2 className="text-2xl font-bold w-32 text-center">{currentDay}</h2>
        <Button variant="ghost" size="icon" onClick={() => handleDayChange(1)}>
          <ChevronRight />
        </Button>
      </div>

      {/* LISTA DE REFEIÇÕES */}
      <div className="grid gap-6 md:grid-cols-1 xl:grid-cols-2">
        {sortedMealKeys.length > 0 ? (
            sortedMealKeys.map((mealName) => (
            <Card key={mealName}>
              <CardHeader className="flex flex-row items-center justify-between py-3 bg-muted/20">
                <CardTitle className="text-lg">{mealName}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => openAddFoodModal(mealName)}>
                    <PlusCircle className="h-4 w-4 mr-1"/> Add
                </Button>
              </CardHeader>
              <CardContent className="space-y-0 divide-y">
                {mealsOfDay[mealName].map((food, index) => (
                  <div key={index} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-semibold">{food.name}</p>
                      <p className="text-sm text-muted-foreground">{food.qty} • {food.calories} kcal</p>
                      <div className="flex gap-2 text-xs text-gray-400 mt-1">
                        <span>P: {food.protein}g</span>
                        <span>C: {food.carbs}g</span>
                        <span>G: {food.fats}g</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditFoodModal(mealName, food, index)}>
                            <Pencil className="h-4 w-4 text-blue-500"/>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteFood(mealName, index)}>
                            <Trash2 className="h-4 w-4 text-red-500"/>
                        </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-10 border-dashed border-2 rounded-lg">
            <p className="text-muted-foreground mb-4">Nenhuma refeição cadastrada para {currentDay}.</p>
            <Button onClick={() => openAddFoodModal()}>
                <PlusCircle className="mr-2 h-4 w-4"/> Adicionar Primeira Refeição
            </Button>
          </div>
        )}
        
        {/* Botão para adicionar nova refeição se já houver outras */}
        {sortedMealKeys.length > 0 && (
            <Button variant="outline" className="h-full min-h-[100px] border-dashed" onClick={() => openAddFoodModal()}>
                <PlusCircle className="mr-2 h-5 w-5"/> Adicionar Outra Refeição
            </Button>
        )}
      </div>

      {/* MODAL 1: ADICIONAR/EDITAR ALIMENTO */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingContext?.foodIndex !== null ? "Editar Alimento" : "Adicionar Alimento"}</DialogTitle>
            <DialogDescription>Insira os dados nutricionais.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Seleção de Refeição */}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Refeição</Label>
                <Select 
                    value={selectedMealType} 
                    onValueChange={setSelectedMealType} 
                    disabled={!!editingContext} 
                >
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                        {mealTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Nome</Label>
              <Input 
                value={foodForm.name} 
                onChange={(e) => setFoodForm({...foodForm, name: e.target.value})} 
                className="col-span-3" 
                placeholder="Ex: Ovos Mexidos"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Qtd</Label>
              <Input 
                value={foodForm.qty} 
                onChange={(e) => setFoodForm({...foodForm, qty: e.target.value})} 
                className="col-span-3" 
                placeholder="Ex: 2 unidades"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-red-500">Kcal</Label>
              <Input type="number" value={foodForm.calories} onChange={(e) => setFoodForm({...foodForm, calories: Number(e.target.value)})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-3 gap-2">
                <div>
                    <Label className="text-xs text-orange-500">Proteína (g)</Label>
                    <Input type="number" value={foodForm.protein} onChange={(e) => setFoodForm({...foodForm, protein: Number(e.target.value)})} />
                </div>
                <div>
                    <Label className="text-xs text-yellow-500">Carbo (g)</Label>
                    <Input type="number" value={foodForm.carbs} onChange={(e) => setFoodForm({...foodForm, carbs: Number(e.target.value)})} />
                </div>
                <div>
                    <Label className="text-xs text-purple-500">Gordura (g)</Label>
                    <Input type="number" value={foodForm.fats} onChange={(e) => setFoodForm({...foodForm, fats: Number(e.target.value)})} />
                </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveFood}>Salvar Alimento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: EDITAR METAS DIÁRIAS */}
      <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Configurar Metas Diárias</DialogTitle>
            <DialogDescription>Defina seus objetivos de macronutrientes.</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-bold">Calorias</Label>
              <Input 
                type="number" 
                value={goalForm.calories} 
                onChange={(e) => setGoalForm({...goalForm, calories: Number(e.target.value)})} 
                className="col-span-3" 
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-orange-500">Proteínas</Label>
              <Input 
                type="number" 
                value={goalForm.protein} 
                onChange={(e) => setGoalForm({...goalForm, protein: Number(e.target.value)})} 
                className="col-span-3" 
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-yellow-500">Carbos</Label>
              <Input 
                type="number" 
                value={goalForm.carbs} 
                onChange={(e) => setGoalForm({...goalForm, carbs: Number(e.target.value)})} 
                className="col-span-3" 
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-purple-500">Gorduras</Label>
              <Input 
                type="number" 
                value={goalForm.fats} 
                onChange={(e) => setGoalForm({...goalForm, fats: Number(e.target.value)})} 
                className="col-span-3" 
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGoalModalOpen(false)}>Cancelar</Button>
            <Button onClick={saveGoals}>Atualizar Metas</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Componente auxiliar para os cards de macro
function MacroCard({ icon, label, current, total, unit }: { icon: any, label: string, current: number, total: number, unit: string }) {
    const percentage = Math.min(100, (current / total) * 100) || 0
    return (
        <div className="flex flex-col items-center p-2 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
                {icon}
                <span className="text-sm font-medium">{label}</span>
            </div>
            <div className="text-xl font-bold mb-1">
                {current} <span className="text-xs text-muted-foreground">/ {total}{unit}</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    )
}
