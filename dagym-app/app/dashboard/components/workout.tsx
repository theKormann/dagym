"use client"

import React, { useState, useEffect } from "react"
// NOVO: Importar ícones e componentes de formulário/modal
import {
  CheckCircle,
  Loader2,
  Save,
  Pencil,
  Trash2,
  PlusCircle,
} from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
// NOVO: Imports do Dialog (Modal)
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose, // Para fechar o modal
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

// --- 1. DEFINIÇÃO DE TIPOS ---
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

interface User {
  id: number
  nome: string
  username: string
  email: string
  description?: string
  weight?: number
  height?: number
  diet?: string
  workout?: string
}

// --- 2. PLANOS PADRÃO (Templates) ---
// (Sem alterações aqui - omitido para brevidade, mas deve estar igual ao anterior)
const workoutTemplates: WorkoutPlan[] = [
  {
    id: "beginner",
    title: "Plano Iniciante",
    description: "Foco em construir uma base sólida com exercícios compostos.",
    level: "Iniciante",
    weeklySchedule: {
      Segunda: [
        { name: "Agachamento", sets: "3", reps: "10-12", image: "/execs/agachamento.png" },
        { name: "Supino Reto", sets: "3", reps: "10-12", image: "/execs/supino_reto_halteres.png" },
        { name: "Remada Curvada", sets: "3", reps: "10-12", image: "/execs/remada_curvada.png" },
      ],
      Quarta: [
        { name: "Levantamento Terra", sets: "3", reps: "8-10", image: "/execs/levantamento_terra.png" },
        { name: "Desenvolvimento Militar", sets: "3", reps: "10-12", image: "/execs/desenvolvimento.png" },
        { name: "Puxada Vertical", sets: "3", reps: "10-12", image: "/execs/puxada_vertical.png" },
      ],
      Sexta: [
        { name: "Agachamento", sets: "3", reps: "10-12", image: "/execs/agachamento.png" },
        { name: "Supino Inclinado", sets: "3", reps: "10-12", image: "/execs/supino_inclinado.png" },
        { name: "Remada Cavalinho", sets: "3", reps: "10-12", image: "/execs/remada_cavalinho.png" },
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
        { name: "Supino Reto c/ Halteres", sets: "4", reps: "8-10", image: "/execs/supino_reto_halteres.png" },
        { name: "Crucifixo Inclinado", sets: "3", reps: "12-15", image: "/execs/crucifixo_inclinado.png" },
        { name: "Tríceps Pulley", sets: "4", reps: "10-12", image: "/execs/triceps_pully.png" },
      ],
      Terça: [
        { name: "Agachamento Livre", sets: "4", reps: "8-10", image: "/execs/agachamento.png" },
        { name: "Leg Press 45", sets: "3", reps: "12-15", image: "/execs/leg_press.png" },
        { name: "Cadeira Extensora", sets: "4", reps: "10-12", image: "/execs/cadeira_extensora.png" },
      ],
      Quinta: [
        { name: "Barra Fixa", sets: "4", reps: "Falha", image: "/execs/barra_fixa.png" },
        { name: "Remada Unilateral", sets: "3", reps: "10-12", image: "/execs/remada_unilateral.png" },
        { name: "Rosca Direta", sets: "4", reps: "10-12", image: "/execs/rosca_direta.png" },
      ],
      Sexta: [
        { name: "Desenvolvimento Arnold", sets: "4", reps: "8-10", image: "/execs/desenvolvimento_arnold.png" },
        { name: "Elevação Lateral", sets: "3", reps: "12-15", image: "/execs/elevacao_lateral.png" },
        { name: "Panturrilha em Pé", sets: "4", reps: "15-20", image: "/execs/panturrilha_empe.png" },
      ],
      Quarta: [],
      Sábado: [],
      Domingo: [],
    },
  },
]



const weekDays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]
const API_URL = process.env.NEXT_PUBLIC_API_URL

// --- 3. COMPONENTE PRINCIPAL ---
export function WorkoutPage() {
  const router = useRouter()

  // --- Estados Principais ---
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userWorkout, setUserWorkout] = useState<WorkoutPlan | null>(null)
  const [selectedDay, setSelectedDay] = useState(weekDays[0])
  
  // --- Estados de Controle --
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null)
  const [modalFormData, setModalFormData] = useState<Exercise>({
    name: "",
    sets: "",
    reps: "",
    image: "", 
  })

  useEffect(() => {
    const storedUser = localStorage.getItem('dagym_user')
    if (!storedUser) {
      setError("Usuário não autenticado.")
      setIsLoading(false)
      router.push('/dashboard')
      return
    }

    let userData: User
    try {
      userData = JSON.parse(storedUser)
      if (!userData || typeof userData.id !== 'number') {
        throw new Error("Dados do usuário inválidos no localStorage.");
      }
      setCurrentUser(userData)
    } catch (e) {
      setError("Erro ao ler dados do usuário. Faça login novamente.")
      localStorage.removeItem('dagym_user'); 
      setIsLoading(false)
      router.push('/login');
      return
    }

    const fetchUserWorkout = async () => {
      if (!API_URL) {
        setError("API URL não configurada")
        setIsLoading(false)
        return
      }

      try {
        const userId = userData.id;
        const fetchUrl = `${API_URL}/api/workout/${userId}`;

        const res = await fetch(fetchUrl);
        
        if (res.status === 404) {
          console.log("Usuário sem treino salvo. Carregando template padrão.");
          setUserWorkout(workoutTemplates[0]); 
          return;
        }
        
        if (!res.ok) {
          throw new Error(`Falha ao buscar treino. Status: ${res.status}`);
        }

        const workoutJson = await res.text() 

        if (workoutJson) {
          setUserWorkout(JSON.parse(workoutJson))
        } else {
          setUserWorkout(workoutTemplates[0])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido ao carregar treino")
        setUserWorkout(workoutTemplates[0])
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserWorkout()
  }, [router])

  const handleSaveWorkout = async () => {
    if (!currentUser || !userWorkout) {
      alert("Não foi possível salvar. Usuário ou treino não carregados.")
      return
    }
    
    if (!API_URL) {
      alert("Erro: API_URL não definida.");
      return;
    }

    setIsSaving(true)
    try {
      const workoutJson = JSON.stringify(userWorkout) 
      const userId = currentUser.id;
      const saveUrl = `${API_URL}/api/workout/${userId}`;
      
      const res = await fetch(saveUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workoutJson: workoutJson }),
      })

      if (!res.ok) {
        throw new Error(`Falha ao salvar o treino no servidor. Status: ${res.status}`);
      }

      alert("Treino salvo com sucesso!")

    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao salvar.")
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleSelectTemplate = (templateId: string) => {
    const template = workoutTemplates.find(t => t.id === templateId);
    if (template) {
      if (confirm(`Isso irá substituir seu treino atual pelo template "${template.title}". Deseja continuar?`)) {
        setUserWorkout(template);
      }
    }
  }


  const handleOpenModal = (index: number | null) => {
    if (index === null) {
      setEditingExerciseIndex(null)
      setModalFormData({ name: "", sets: "", reps: "", image: "/execs/custom.png" })
    } else {
      const exercise = userWorkout?.weeklySchedule[selectedDay][index]
      if (exercise) {
        setEditingExerciseIndex(index)
        setModalFormData(exercise) 
      }
    }
    setIsModalOpen(true)
  }

  const handleModalFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setModalFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleModalSubmit = () => {
    if (!userWorkout) return

    const newWorkout = JSON.parse(JSON.stringify(userWorkout)) as WorkoutPlan
    
    const exercisesForDay = newWorkout.weeklySchedule[selectedDay] || []

    if (editingExerciseIndex === null) {
      exercisesForDay.push(modalFormData)
    } else {
      exercisesForDay[editingExerciseIndex] = modalFormData
    }
    
    newWorkout.weeklySchedule[selectedDay] = exercisesForDay
    
    setUserWorkout(newWorkout)
    
    // 6. Fecha o modal
    setIsModalOpen(false)
  }

  /**
   * Exclui um exercício do dia selecionado
   */
  const handleDeleteExercise = (indexToDelete: number) => {
    if (!userWorkout) return
    
    if (!confirm("Tem certeza que deseja excluir este exercício?")) {
      return
    }

    const newWorkout = JSON.parse(JSON.stringify(userWorkout)) as WorkoutPlan
    
    // Filtra o array, removendo o item no 'indexToDelete'
    const updatedExercises = (newWorkout.weeklySchedule[selectedDay] || []).filter(
      (_, index) => index !== indexToDelete
    )
    
    newWorkout.weeklySchedule[selectedDay] = updatedExercises
    setUserWorkout(newWorkout)
  }

  // --- Lógica de Renderização (com adições) ---

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-red-800" />
      </div>
    )
  }

  if (error || !userWorkout) {
    // (Render de Erro - sem alterações)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Erro ao Carregar Treino</CardTitle>
          <CardDescription>Não foi possível carregar seu plano de treino.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-red-600">{error || "Plano de treino não encontrado."}</p>
          <Button onClick={() => window.location.reload()} className="mt-4 w-full">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Sucesso
  const dailyExercises = userWorkout.weeklySchedule[selectedDay] || []
  const totalExercises = Object.values(userWorkout.weeklySchedule || {}).flat().length
  const completedExercises = 0 // TODO: Salvar progresso

  return (
    // NOVO: Envolvemos com <Dialog> para que o modal possa ser controlado
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <div className="w-full">

        {/* Seleção de Template (Sem alterações) */}
        <div className="mb-4 flex flex-wrap gap-2">
          <p className="font-medium self-center text-sm">Usar um template:</p>
          <Button size="sm" variant="outline" onClick={() => handleSelectTemplate("beginner")}>Carregar Iniciante</Button>
          <Button size="sm" variant="outline" onClick={() => handleSelectTemplate("intermediate")}>Carregar Intermediário</Button>
        </div>
      
        <Card>
          <CardHeader>
            <CardTitle>{userWorkout.title}</CardTitle>
            <CardDescription>{userWorkout.description}</CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Progresso (Sem alterações) */}
            <div className="mb-6">
              {/* ... */}
            </div>

            {/* Seleção de Dias (Sem alterações) */}
            <div className="flex items-center justify-center space-x-2 mb-6 overflow-x-auto pb-2">
              {/* ... (map dos weekDays) ... */}
               {weekDays.map((day) => (
                <Button
                  key={day}
                  variant={selectedDay === day ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "rounded-lg flex-shrink-0",
                    selectedDay === day && "bg-red-800 hover:bg-red-900",
                    (userWorkout.weeklySchedule[day] || []).length === 0 && "text-muted-foreground",
                  )}
                  onClick={() => setSelectedDay(day)}
                >
                  {day.substring(0, 3)}
                </Button>
              ))}
            </div>

            {/* Lista de Exercícios (COM MUDANÇAS) */}
            <div className="space-y-4">
              {dailyExercises.length > 0 ? (
                dailyExercises.map((exercise, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-200 rounded-md overflow-hidden flex-shrink-0 relative">
                      <Image src={exercise.image} alt={exercise.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{exercise.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {exercise.sets} séries x {exercise.reps} repetições
                      </p>
                    </div>
                    
                    {/* NOVO: Botões de Editar e Excluir */}
                    <div className="flex flex-col md:flex-row gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-blue-500"
                        onClick={() => handleOpenModal(index)} // Abre modal para editar
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-red-500"
                        onClick={() => handleDeleteExercise(index)} // Exclui
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Botão de Check (Lógica de progresso) */}
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-green-500">
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
              
              {/* NOVO: Botão para Adicionar Exercício */}
              <Button
                variant="outline"
                className="w-full mt-4 border-dashed"
                onClick={() => handleOpenModal(null)} // Abre modal para adicionar
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Exercício
              </Button>
            </div>
          </CardContent>

          <CardFooter>
            {/* Botão Salvar (Sem alterações) */}
            <Button className="w-full rounded-2xl" onClick={handleSaveWorkout} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar Meu Treino
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* NOVO: Definição do Modal (Dialog) */}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editingExerciseIndex === null ? "Adicionar Exercício" : "Editar Exercício"}
          </DialogTitle>
          <DialogDescription>
            {editingExerciseIndex === null
              ? "Preencha os dados do novo exercício."
              : "Atualize os dados do exercício selecionado."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input
              id="name"
              name="name"
              value={modalFormData.name}
              onChange={handleModalFormChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sets" className="text-right">
              Séries
            </Label>
            <Input
              id="sets"
              name="sets"
              value={modalFormData.sets}
              onChange={handleModalFormChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reps" className="text-right">
              Reps
            </Label>
            <Input
              id="reps"
              name="reps"
              value={modalFormData.reps}
              onChange={handleModalFormChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="image" className="text-right">
              Imagem (URL)
            </Label>
            <Input
              id="image"
              name="image"
              value={modalFormData.image}
              onChange={handleModalFormChange}
              className="col-span-3"
              placeholder="/workouts/default.jpg"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleModalSubmit}>
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}