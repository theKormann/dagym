"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import {
    Dumbbell,
    Salad,
    Users,
    Flame,
    Menu,
    Award,
    User as UserIcon,
    Search,
    Loader2,
    X,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// Importação dos componentes das páginas
import { ProfilePage } from "./profile"
import { HomePage } from "./home"
import { WorkoutPage } from "./workout"
import { DietPage } from "./diet"
import { ChallengesPage } from "./challenges"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const UPLOAD_URL = "http://localhost:8080/uploads"; // Adicionado para construir URLs de imagem

// --- Tipos ---
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

const initialNotifications: Notification[] = []

interface User {
    username: string;
    // CORREÇÃO: Tipagem para suportar avatar no header
    avatarUrl?: string;
}

// CORREÇÃO: Adicionado avatarUrl na interface de busca
interface UserSearchDTO {
    id: number;
    nome: string;
    username: string;
    avatarUrl?: string | null; 
}

export function DesignaliCreative() {
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
    const [activeTab, setActiveTab] = useState("home");
    
    const [sidebarOpen, setSidebarOpen] = useState(false); 
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    // --- NOVOS ESTADOS PARA SUGESTÕES ---
    const [suggestedUsers, setSuggestedUsers] = useState<UserSearchDTO[]>([]);
    const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<UserSearchDTO[]>([]);
    const [isSearchLoading, setIsSearchLoading] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const [viewedProfileId, setViewedProfileId] = useState<number | null>(null);

    // Carregar Usuário Logado
    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('dagym_user');
            if (storedUser) {
                const userData: User = JSON.parse(storedUser);
                setUser(userData);
            }
        } catch (error) {
            console.error("Falha ao carregar dados do usuário:", error);
            setUser(null);
        }
    }, []);

    // Escutar evento "storage" para atualizar o avatar quando ele mudar no ProfilePage
    useEffect(() => {
        const handleStorageChange = () => {
            const storedUser = localStorage.getItem('dagym_user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // --- NOVO: Carregar Sugestões do Banco ---
    useEffect(() => {
        const fetchSuggestions = async () => {
            setIsSuggestionsLoading(true);
            try {
                const res = await fetch(`${API_URL}/api/users`);
                
                if (res.ok) {
                    const data: UserSearchDTO[] = await res.json();
                    const currentUser = user?.username;
                    const filtered = data
                        .filter(u => u.username !== currentUser)
                        .slice(0, 5);
                        
                    setSuggestedUsers(filtered);
                }
            } catch (error) {
                console.error("Erro ao carregar sugestões:", error);
            } finally {
                setIsSuggestionsLoading(false);
            }
        };

        fetchSuggestions();
    }, [user]);

    // Lógica de Busca (Search)
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setSearchResults([]);
            setIsSearchOpen(false);
            return;
        }
        const timer = setTimeout(async () => {
            setIsSearchLoading(true);
            try {
                const res = await fetch(`${API_URL}/api/users/search?q=${searchTerm}`);
                if (res.ok) {
                    const data: UserSearchDTO[] = await res.json();
                    setSearchResults(data);
                    setIsSearchOpen(true);
                } else {
                    setSearchResults([]);
                }
            } catch (error) {
                console.error("Erro na busca:", error);
                setSearchResults([]);
            }
            setIsSearchLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleProfileVisit = (userId: number) => {
        setViewedProfileId(userId);
        setActiveTab("perfil");
        setSearchTerm("");
        setSearchResults([]);
        setIsSearchOpen(false);
        setSidebarOpen(false);
    };

    return (
        <div className="relative min-h-screen bg-background flex">
            
            {/* ... SIDEBAR CODE ... (Sem alterações lógicas, apenas estilo) */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-black/50 md:hidden block"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 border-r bg-background transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex h-full flex-col">
                    <div className="flex h-20 items-center justify-center border-b px-6 bg-white/50">
                        <div className="relative w-40 h-12">
                            <Image src="/logo-dagym.png" alt="DaGym Logo" fill className="object-contain" priority />
                        </div>
                        
                        <Button 
                            variant="ghost" size="icon" className="md:hidden absolute right-2 top-5"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    <ScrollArea className="flex-1 px-3 py-4">
                        <div className="space-y-1">
                            {[
                                { title: "Home", icon: <Flame className="h-5 w-5" />, value: "home" },
                                { title: "Treinos", icon: <Dumbbell className="h-5 w-5" />, value: "treinos" },
                                { title: "Dietas", icon: <Salad className="h-5 w-5" />, value: "dietas" },
                                { title: "Desafios", icon: <Award className="h-5 w-5" />, value: "desafios" },
                                { title: "Comunidade", icon: <Users className="h-5 w-5" />, value: "comunidade" },
                                { title: "Perfil", icon: <UserIcon className="h-5 w-5" />, value: "perfil" },
                            ].map((item) => (
                                <button
                                    key={item.title}
                                    onClick={() => {
                                        setActiveTab(item.value);
                                        setSidebarOpen(false); 
                                        if (item.value === 'perfil') {
                                            setViewedProfileId(null);
                                        }
                                    }}
                                    className={cn(
                                        "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                                        activeTab === item.value 
                                            ? "bg-[#8e0501] text-white shadow-md shadow-red-200" 
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    {item.icon}
                                    <span>{item.title}</span>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                    
                    <div className="border-t p-4">
                         <p className="text-xs text-center text-muted-foreground">© 2024 DaGym App</p>
                    </div>
                </div>
            </aside>

            {/* --- CONTEÚDO PRINCIPAL --- */}
            <div className="flex-1 flex flex-col min-h-screen w-full overflow-hidden">
                
                {/* --- HEADER --- */}
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6 gap-4">
                    
                    <div className="flex items-center justify-start w-10 md:w-auto">
                        <Button variant="ghost" size="icon" className="md:hidden -ml-2" onClick={() => setSidebarOpen(true)}>
                            <Menu className="h-6 w-6" />
                        </Button>
                    </div>

                    <div className="flex-1 flex justify-center max-w-md mx-auto">
                        <div className="w-full">
                            <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                                <PopoverTrigger asChild>
                                    <div className="relative w-full">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        {isSearchLoading && !isSearchOpen && (
                                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                        )}
                                        <Input
                                            type="search"
                                            placeholder="Pesquisar..."
                                            className="w-full rounded-full bg-muted pl-9 h-10 focus-visible:ring-red-500 border-none"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onFocus={() => { if (searchTerm.trim() !== "") setIsSearchOpen(true); }}
                                        />
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] md:w-[400px] p-2 mt-2" align="center">
                                    <ScrollArea className="max-h-[300px]">
                                        {isSearchLoading ? (
                                            <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                                        ) : searchResults.length > 0 ? (
                                            searchResults.map((u) => (
                                                <button
                                                    key={u.id}
                                                    onClick={() => handleProfileVisit(u.id)}
                                                    className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-muted text-left transition-colors"
                                                >
                                                    {/* CORREÇÃO: Avatar na busca */}
                                                    <Avatar className="h-8 w-8">
                                                        {u.avatarUrl && (
                                                            <AvatarImage 
                                                                src={`${UPLOAD_URL}/${u.avatarUrl}`} 
                                                                className="object-cover"
                                                            />
                                                        )}
                                                        <AvatarFallback>{u.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-medium">{u.nome}</p>
                                                        <p className="text-xs text-muted-foreground">@{u.username}</p>
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <p className="p-2 text-center text-sm text-muted-foreground">Nenhum resultado.</p>
                                        )}
                                    </ScrollArea>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="flex items-center justify-end w-10 md:w-auto">
                        <button
                            onClick={() => {
                                setActiveTab("perfil");
                                setViewedProfileId(null);
                            }}
                            className="rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            {/* CORREÇÃO: Avatar do cabeçalho (Usuário Logado) */}
                            <Avatar className="h-9 w-9 border border-border">
                                {user?.avatarUrl && (
                                    <AvatarImage 
                                        src={`${UPLOAD_URL}/${user.avatarUrl}`} 
                                        className="object-cover" 
                                    />
                                )}
                                <AvatarFallback className="bg-red-100 text-red-700">
                                    {user ? user.username.substring(0, 2).toUpperCase() : "EU"}
                                </AvatarFallback>
                            </Avatar>
                        </button>
                    </div>
                </header>

                {/* --- MAIN AREA --- */}
                <main className="flex-1 p-0 md:p-6 lg:p-8 overflow-x-hidden bg-slate-50/50">
                    <Tabs defaultValue="home" value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
                        
                        {/* Tabs List Mobile */}
                        <div className="md:hidden w-full overflow-x-auto pb-2 no-scrollbar px-4 mt-4">
                            <TabsList className="w-auto inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground">
                                <TabsTrigger value="home">Home</TabsTrigger>
                                <TabsTrigger value="treinos">Treinos</TabsTrigger>
                                <TabsTrigger value="dietas">Dietas</TabsTrigger>
                                <TabsTrigger value="desafios">Desafios</TabsTrigger>
                                <TabsTrigger value="comunidade">Comunidade</TabsTrigger>
                                <TabsTrigger value="perfil">Perfil</TabsTrigger>
                            </TabsList>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="w-full max-w-7xl mx-auto px-4 md:px-0"
                            >
                                <TabsContent value="home" className="m-0">
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                        
                                        <div className="lg:col-span-8 w-full">
                                            <HomePage />
                                        </div>

                                        {/* --- SIDEBAR DE RECOMENDAÇÕES --- */}
                                        {(() => {
                                            const isSearching = searchTerm.trim() !== "";
                                            const displayList = isSearching ? searchResults : suggestedUsers;
                                            const isLoading = isSearching ? isSearchLoading : isSuggestionsLoading;
                                            
                                            return (
                                                <div className="hidden lg:block lg:col-span-4 sticky top-6">
                                                    {user && (
                                                        <div className="flex items-center justify-between mb-6 pl-2">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-12 w-12 border">
                                                                    {user.avatarUrl && (
                                                                        <AvatarImage 
                                                                            src={`${UPLOAD_URL}/${user.avatarUrl}`} 
                                                                            className="object-cover"
                                                                        />
                                                                    )}
                                                                    <AvatarFallback className="bg-red-100 text-red-700">
                                                                        {user.username.substring(0, 2).toUpperCase()}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex flex-col">
                                                                    <span className="font-semibold text-sm">{user.username}</span>
                                                                    <span className="text-xs text-muted-foreground">Conta Pessoal</span>
                                                                </div>
                                                            </div>
                                                            <Button variant="link" className="text-xs text-blue-500 font-semibold p-0 h-auto">
                                                                Mudar
                                                            </Button>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-between mb-4 pl-2">
                                                        <span className="text-sm font-semibold text-muted-foreground">
                                                            {isSearching ? "Resultados da busca" : "Sugestões para você"}
                                                        </span>
                                                        {!isSearching && (
                                                            <Button variant="ghost" className="text-xs font-semibold h-auto p-0 hover:bg-transparent text-black">
                                                                Ver tudo
                                                            </Button>
                                                        )}
                                                    </div>

                                                    <div className="space-y-4">
                                                        {isLoading ? (
                                                            <div className="flex justify-center py-4">
                                                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                                            </div>
                                                        ) : displayList.length > 0 ? (
                                                            displayList.map((u) => (
                                                                <div key={u.id} className="flex items-center justify-between pl-2 py-1">
                                                                    <div className="flex items-center gap-3">
                                                                        {/* CORREÇÃO: Avatar nas Sugestões */}
                                                                        <Avatar className="h-9 w-9">
                                                                            {u.avatarUrl && (
                                                                                <AvatarImage 
                                                                                    src={`${UPLOAD_URL}/${u.avatarUrl}`} 
                                                                                    className="object-cover"
                                                                                />
                                                                            )}
                                                                            <AvatarFallback className="text-xs">
                                                                                {u.username.substring(0, 2).toUpperCase()}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div className="flex flex-col">
                                                                            <span 
                                                                                className="text-sm font-semibold leading-none hover:underline cursor-pointer" 
                                                                                onClick={() => handleProfileVisit(u.id)}
                                                                            >
                                                                                {u.username}
                                                                            </span>
                                                                            <span className="text-xs text-muted-foreground mt-0.5">
                                                                                {isSearching ? u.nome : "Sugestão"}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        className="text-xs text-blue-500 hover:text-blue-700 hover:bg-transparent font-semibold p-0 h-auto"
                                                                    >
                                                                        Seguir
                                                                    </Button>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="pl-2 text-sm text-muted-foreground">
                                                                {isSearching ? "Nenhum usuário encontrado." : "Sem sugestões no momento."}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="mt-8 pl-2">
                                                        <p className="text-[11px] text-gray-300 leading-relaxed">
                                                            Sobre • Ajuda • Imprensa • API • Carreiras • Privacidade • Termos • Localizações • Idioma
                                                        </p>
                                                        <p className="text-[11px] text-gray-300 mt-4">
                                                            © 2025 DAGYM DO BRASIL
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                    </div>
                                </TabsContent>

                                <TabsContent value="treinos" className="m-0"> <WorkoutPage /> </TabsContent>
                                <TabsContent value="dietas" className="m-0"> <DietPage /> </TabsContent>
                                <TabsContent value="desafios" className="m-0"> <ChallengesPage /> </TabsContent>
                                <TabsContent value="perfil" className="m-0">
                                    <ProfilePage
                                        key={viewedProfileId || 'me'}
                                        profileId={viewedProfileId}
                                    />
                                </TabsContent>
                                <TabsContent value="comunidade" className="m-0">
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <Users className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
                                        <h3 className="text-lg font-semibold">Comunidade</h3>
                                        <p className="text-muted-foreground">Em breve você poderá interagir com grupos aqui.</p>
                                    </div>
                                </TabsContent>
                            </motion.div>
                        </AnimatePresence>
                    </Tabs>
                </main>
            </div>
        </div>
    )
}