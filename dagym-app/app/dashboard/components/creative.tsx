// creative.tsx

"use client"

// 1. Importar o useEffect
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dumbbell,
  Salad,
  Users,
  Flame,
  Bell,
  Menu,
  PanelLeft,
  Settings,
  Award,
  User as UserIcon,
  UserPlus,
  Heart,
  MessageSquare,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

import { ProfilePage } from "./profile"
import { HomePage } from "./home"
import { WorkoutPage } from "./workout"
import { DietPage } from "./diet"
import { ChallengesPage } from "./challenges"

// ... (Tipos Notification e NotificationAction) ...
type NotificationAction = {
  type: 'tab';
  value: string;
};

type Notification = {
  id: string;
  icon: React.ReactNode;
  title: string;
  time: string;
  read: boolean;
  action: NotificationAction;
};

// ... (initialNotifications) ...
const initialNotifications: Notification[] = [
  {
    id: 'notif1',
    icon: <UserPlus className="h-5 w-5 text-blue-500" />,
    title: "Julia Santos começou a seguir você.",
    time: "5m atrás",
    read: false,
    action: { type: 'tab', value: 'comunidade' }
  },
  {
    id: 'notif2',
    icon: <Heart className="h-5 w-5 text-red-500" />,
    title: "Carlos Andrade curtiu sua publicação.",
    time: "1h atrás",
    read: false,
    action: { type: 'tab', value: 'home' }
  },
  {
    id: 'notif3',
    icon: <MessageSquare className="h-5 w-5 text-green-500" />,
    title: "Ana Pereira comentou: 'Ótima dica! Vou tentar.'",
    time: "3h atrás",
    read: false,
    action: { type: 'tab', value: 'home' }
  },
  {
    id: 'notif4',
    icon: <Award className="h-5 w-5 text-yellow-500" />,
    title: "Você completou o Desafio Semanal de Corrida!",
    time: "Ontem",
    read: true,
    action: { type: 'tab', value: 'desafios' }
  }
]

// 2. Adicionar uma interface de Usuário (mínima)
interface User {
  username: string;
  // Adicione outros campos se necessário, ex: profileImageUrl
}

export function DesignaliCreative() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // 3. Adicionar estado para o usuário
  const [user, setUser] = useState<User | null>(null);

  // 4. Adicionar useEffect para carregar o usuário do localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('dagym_user');
      if (storedUser) {
        const userData: User = JSON.parse(storedUser);
        setUser(userData);
      }
    } catch (error) {
      console.error("Falha ao carregar dados do usuário no layout:", error);
      setUser(null); // Garante que o estado é nulo em caso de erro de parse
    }
  }, []); // O array vazio [] faz com que rode apenas uma vez, na montagem

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(n =>
        n.id === notification.id ? { ...n, read: true } : n
      )
    );

    if (notification.action.type === 'tab') {
      setActiveTab(notification.action.value);
    }

    setPopoverOpen(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* ... (Animação de background e sidebar) ... */}
      <motion.div
        className="absolute inset-0 -z-10 opacity-20"
        animate={{
          background: [
            "radial-gradient(circle at 50% 50%, rgba(128,0,32,0.6) 0%, rgba(178,34,34,0.5) 50%, rgba(0,0,0,0) 100%)",
            "radial-gradient(circle at 30% 70%, rgba(139,0,0,0.6) 0%, rgba(165,42,42,0.5) 50%, rgba(0,0,0,0) 100%)",
          ],
        }}
        transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      />
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden w-64 transform border-r bg-background transition-transform duration-300 ease-in-out md:block",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex aspect-square size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-red-900 to-red-700 text-white">
                <Dumbbell className="size-5" />
              </div>
              <div>
                <h2 className="font-semibold">Dagym Fitness</h2>
                <p className="text-xs text-muted-foreground">Rede Social</p>
              </div>
            </div>
          </div>
          <ScrollArea className="flex-1 px-3 py-2">
            <div className="space-y-1">
              {[
                { title: "Home", icon: <Flame />, value: "home" },
                { title: "Treinos", icon: <Dumbbell />, value: "treinos" },
                { title: "Dietas", icon: <Salad />, value: "dietas" },
                { title: "Desafios", icon: <Award />, value: "desafios" },
                { title: "Comunidade", icon: <Users />, value: "comunidade" },
                { title: "Perfil", icon: <UserIcon />, value: "perfil" },
              ].map((item) => (
                <button
                  key={item.title}
                  onClick={() => setActiveTab(item.value)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium",
                    activeTab === item.value ? "bg-red-900/10 text-red-900" : "hover:bg-muted",
                  )}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
          <div className="border-t p-3">
            <button className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium hover:bg-muted">
              <Settings className="h-5 w-5" />
              <span>Configurações</span>
            </button>
          </div>
        </div>
      </div>

      <div className={cn("min-h-screen transition-all duration-300 ease-in-out", sidebarOpen ? "md:pl-64" : "md:pl-0")}>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(true)}> <Menu className="h-5 w-5" /> </Button>
          <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => setSidebarOpen(!sidebarOpen)}> <PanelLeft className="h-5 w-5" /> </Button>
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-xl font-semibold">Dagym Fitness</h1>
            <div className="flex items-center gap-3">

              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-2xl relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-700 text-xs text-white">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 mr-4 mt-2" align="end">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold">Notificações</h4>
                      <Button variant="link" size="sm" className="text-xs -mr-3">Marcar como lidas</Button>
                    </div>
                    <ScrollArea className="h-[300px]">
                      <div className="pr-4 space-y-2">
                        _               {notifications.map((notif) => (
                          <button
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className="flex w-full items-start gap-3 rounded-lg p-2 text-left hover:bg-muted transition-colors"
                          >
                            <div className="mt-1">{notif.icon}</div>
                            <div className="flex-1">
                              <p className="text-sm">{notif.title}</p>
                              <p className="text-xs text-muted-foreground">{notif.time}</p>
                            </div>
                            {!notif.read && (
                              <div className="mt-1 size-2 rounded-full bg-red-700 shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                    <Button variant="outline" className="w-full">Ver todas as notificações</Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* --- 5. ALTERAÇÃO DO AVATAR --- */}
              <button
                onClick={() => setActiveTab("perfil")}
                className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
              >
                <Avatar className="h-9 w-9 border-2 border-red-800">
                  {/*                     Removido AvatarImage para seguir o padrão do profile.tsx,
                    que só exibe o fallback com as iniciais.
                    (Você pode adicionar <AvatarImage src={user.profileImageUrl} /> se tiver uma URL) 
                  */}
                  <AvatarFallback>
                    {user ? user.username.substring(0, 2).toUpperCase() : "DG"}
                  </AvatarFallback>
                </Avatar>
              </button>
              {/* --- FIM DA ALTERAÇÃO --- */}

            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Tabs defaultValue="home" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-[700px] grid-cols-3 sm:grid-cols-6 rounded-2xl p-1">
              <TabsTrigger value="home">Home</TabsTrigger>
              <TabsTrigger value="treinos">Treinos</TabsTrigger>
              <TabsTrigger value="dietas">Dietas</TabsTrigger>
              <TabsTrigger value="desafios">Desafios</TabsTrigger>
              <TabsTrigger value="comunidade">Comunidade</TabsTrigger>
              <TabsTrigger value="perfil">Perfil</TabsTrigger>
            </TabsList>
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <TabsContent value="home" className="mt-6"> <HomePage /> </TabsContent>
                <TabsContent value="treinos" className="mt-6"> <WorkoutPage /> </TabsContent>
                <TabsContent value="dietas" className="mt-6"> <DietPage /> </TabsContent>
                <TabsContent value="desafios" className="mt-6"> <ChallengesPage /> </TabsContent>
                <TabsContent value="perfil" className="mt-6"> <ProfilePage /> </TabsContent>
                <TabsContent value="comunidade"> <div className="mt-6 text-center">Página da Comunidade em construção...</div> </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </main>
      </div>
    </div>
  )
}