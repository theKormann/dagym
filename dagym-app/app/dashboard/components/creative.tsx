"use client"

import { useState, useEffect, useRef, FormEvent } from "react"
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
    Bell,
    UserPlus,
    Camera,
    RefreshCw,
    LogOut,
    Settings,
    MessageCircle,
    Send 
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
import { CommunityPage } from "./community"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const UPLOAD_URL = "http://localhost:8080/uploads";

// --- TIPOS ---

interface AppNotification {
    id: string;
    type: 'follow' | 'story' | 'system';
    user: {
        id: number;
        username: string;
        avatarUrl?: string;
    };
    text: string;
    time: string;
    read: boolean;
}

interface User {
    id: number;
    username: string;
    avatarUrl?: string;
    lastMeasurementUpdate?: string;
}

interface UserSearchDTO {
    id: number;
    nome: string;
    username: string;
    avatarUrl?: string | null;
    isFollowing?: boolean;
    isProcessing?: boolean;
}

interface InboxChat {
    userId: number;
    username: string;
    avatarUrl?: string;
    lastMessage: string;
    timestamp: string;
}

interface ChatMessage {
    id: string;
    senderId: number;
    text: string;
    timestamp: Date;
    isMine: boolean;
}

interface ChatWindowProps {
    currentUser: User;
    targetUser: { id: number; username: string; avatarUrl?: string };
    onClose: () => void;
}

function ChatWindow({ currentUser, targetUser, onClose }: ChatWindowProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await fetch(`${API_URL}/api/messages/${currentUser.id}/${targetUser.id}`);
                if (res.ok) {
                    const data = await res.json();
                    const formatted: ChatMessage[] = data.map((m: any) => ({
                        id: m.id,
                        senderId: m.senderId,
                        text: m.content,
                        timestamp: new Date(m.timestamp),
                        isMine: m.senderId === currentUser.id
                    }));
                    setMessages(formatted);
                }
            } catch (err) {
                console.error("Erro ao carregar chat", err);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [currentUser.id, targetUser.id]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSend = async (e: FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const textToSend = newMessage;
        setNewMessage("");

        try {
            await fetch(`${API_URL}/api/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    senderId: currentUser.id,
                    receiverId: targetUser.id,
                    content: textToSend
                })
            });

            const optimisticMsg: ChatMessage = {
                id: Date.now().toString(),
                senderId: currentUser.id,
                text: textToSend,
                timestamp: new Date(),
                isMine: true
            };
            setMessages(prev => [...prev, optimisticMsg]);

            const updateInboxLocalStorage = (me: User, other: any, lastText: string) => {
                const inboxKey = 'dagym_inbox_chats';
                const existingStr = localStorage.getItem(inboxKey);
                let chats = existingStr ? JSON.parse(existingStr) : [];
                // Remove duplicatas e a própria entrada se existir
                chats = chats.filter((c: any) => c.userId !== other.id && c.userId !== me.id);
                
                chats.unshift({
                    userId: other.id,
                    username: other.username,
                    avatarUrl: other.avatarUrl,
                    lastMessage: lastText,
                    timestamp: new Date().toISOString()
                });
                localStorage.setItem(inboxKey, JSON.stringify(chats));
                window.dispatchEvent(new Event('storage'));
            };
            updateInboxLocalStorage(currentUser, targetUser, textToSend);

        } catch (err) {
            console.error("Erro ao enviar mensagem", err);
        }
    };

    return (
        <div className="fixed bottom-0 right-4 w-80 bg-white border border-gray-200 shadow-2xl rounded-t-xl z-[60] flex flex-col overflow-hidden font-sans animate-in slide-in-from-bottom-5">

            <div className="bg-[#8e0501] text-white p-3 flex justify-between items-center cursor-pointer shadow-sm" onClick={onClose}>
                <div className="flex items-center gap-2">
                    <div className="relative h-8 w-8">
                        <Avatar className="h-8 w-8 border border-white/20">
                            {targetUser.avatarUrl && <AvatarImage src={`${UPLOAD_URL}/${targetUser.avatarUrl}`} className="object-cover" />}
                            <AvatarFallback className="text-black bg-white">{targetUser.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-[#8e0501] rounded-full"></span>
                    </div>
                    <span className="font-semibold text-sm">{targetUser.username}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="hover:bg-white/10 p-1 rounded">
                    <X className="h-4 w-4 text-white" />
                </button>
            </div>

            <div className="flex-1 h-80 overflow-y-auto p-4 bg-slate-50 space-y-4 scrollbar-thin scrollbar-thumb-gray-300">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                        <MessageCircle className="h-8 w-8 mb-2" />
                        <p className="text-xs text-center">Diga olá para {targetUser.username}!</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex w-full items-end gap-2", msg.isMine ? "justify-end" : "justify-start")}>

                        {!msg.isMine && (
                            <Avatar className="h-6 w-6 shrink-0 border border-gray-200 mb-1">
                                {targetUser.avatarUrl && <AvatarImage src={`${UPLOAD_URL}/${targetUser.avatarUrl}`} className="object-cover" />}
                                <AvatarFallback className="text-[9px] bg-gray-100 text-gray-500">
                                    {targetUser.username.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        )}

                        <div className={cn(
                            "max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm break-words",
                            msg.isMine
                                ? "bg-blue-600 text-white rounded-br-none"
                                : "bg-white text-gray-800 border rounded-bl-none"
                        )}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={scrollRef} />
            </div>

            <form onSubmit={handleSend} className="p-3 bg-white border-t flex gap-2">
                <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Mensagem..."
                    className="flex-1 h-9 text-sm rounded-full bg-slate-100 border-0 focus-visible:ring-1 focus-visible:ring-blue-500"
                />
                <Button type="submit" size="icon" className="h-9 w-9 rounded-full bg-blue-600 hover:bg-blue-700 shrink-0">
                    <Send className="h-4 w-4 text-white ml-0.5" />
                </Button>
            </form>
        </div>
    );
}


// --- COMPONENTE PRINCIPAL ---

export function DesignaliCreative() {
    // --- Estados de Notificação ---
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const unreadCount = notifications.filter(n => !n.read).length;

    // --- Estados Principais ---
    const [activeTab, setActiveTab] = useState("home");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    // --- Estados de Busca ---
    const [suggestedUsers, setSuggestedUsers] = useState<UserSearchDTO[]>([]);
    const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<UserSearchDTO[]>([]);
    const [isSearchLoading, setIsSearchLoading] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // --- Estados de Menu e Perfil ---
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [viewedProfileId, setViewedProfileId] = useState<number | null>(null);

    // --- Estados do Inbox ---
    const [inboxMessages, setInboxMessages] = useState<InboxChat[]>([]);

    // --- NOVO: Estado do Chat Ativo ---
    const [activeChatUser, setActiveChatUser] = useState<{ id: number, username: string, avatarUrl?: string } | null>(null);

    // Carregar Usuário e Inbox
    useEffect(() => {
        const loadUser = () => {
            try {
                const storedUser = localStorage.getItem('dagym_user');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } catch (error) {
                console.error("Falha ao carregar usuário:", error);
                setUser(null);
            }
        };

        const loadInbox = () => {
            try {
                const savedChats = localStorage.getItem('dagym_inbox_chats');
                if (savedChats) {
                    const chats = JSON.parse(savedChats);
                    setInboxMessages(chats);
                }
            } catch (error) {
                console.error("Erro inbox:", error);
            }
        };

        loadUser();
        loadInbox();

        const handleStorageChange = (event: StorageEvent | Event) => {
            if (event instanceof StorageEvent) {
                if (event.key === 'dagym_user') loadUser();
                if (event.key === 'dagym_inbox_chats') loadInbox();
            } else {
                loadUser();
                loadInbox();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // --- LIMPEZA AUTOMÁTICA DE CHATS "BUGADOS" (EU COMIGO MESMO) ---
    useEffect(() => {
        if (user && inboxMessages.length > 0) {
            const clean = inboxMessages.filter(c => c.userId !== user.id);
            if (clean.length !== inboxMessages.length) {
                console.log("Limpando chats inválidos (self-chat)...");
                setInboxMessages(clean);
                localStorage.setItem('dagym_inbox_chats', JSON.stringify(clean));
            }
        }
    }, [user, inboxMessages]);


    // Notificação Inteligente (15 dias)
    useEffect(() => {
        if (!user) return;
        const checkProfileStatus = () => {
            const SNOOZE_KEY = `dagym_update_snooze_${user.id}`;
            const now = new Date();
            const lastSnoozeStr = localStorage.getItem(SNOOZE_KEY);

            if (lastSnoozeStr) {
                const lastSnoozeDate = new Date(lastSnoozeStr);
                if ((now.getTime() - lastSnoozeDate.getTime()) / (1000 * 60 * 60) < 24) return;
            }

            let daysSinceUpdate = 16;
            if (user.lastMeasurementUpdate) {
                const lastUpdateDate = new Date(user.lastMeasurementUpdate);
                const diffTime = Math.abs(now.getTime() - lastUpdateDate.getTime());
                daysSinceUpdate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }

            if (daysSinceUpdate >= 15) {
                const newNotif: AppNotification = {
                    id: `sys-update-${Date.now()}`,
                    type: "system",
                    user: { id: 0, username: "DaGym Coach", avatarUrl: undefined },
                    text: `Atualize suas medidas. Vamos registrar o progresso?`,
                    time: "Agora",
                    read: false
                };

                setNotifications(prev => {
                    const exists = prev.some(n => n.text.includes("atualiza suas medidas"));
                    return exists ? prev : [newNotif, ...prev];
                });
                localStorage.setItem(SNOOZE_KEY, now.toISOString());
            }
        };
        const timer = setTimeout(() => checkProfileStatus(), 3000);
        return () => clearTimeout(timer);
    }, [user]);

    // Carregar Sugestões
    useEffect(() => {
        const fetchSuggestions = async () => {
            setIsSuggestionsLoading(true);
            try {
                const res = await fetch(`${API_URL}/api/users`);
                if (res.ok) {
                    const data: UserSearchDTO[] = await res.json();
                    const filtered = data
                        .filter(u => u.username !== user?.username)
                        .map(u => ({ ...u, isFollowing: false, isProcessing: false }))
                        .slice(0, 5);
                    setSuggestedUsers(filtered);
                }
            } catch (error) { console.error(error); }
            finally { setIsSuggestionsLoading(false); }
        };
        if (user) fetchSuggestions();
    }, [user]);

    // Busca (Debounce)
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setSearchResults([]); setIsSearchOpen(false); return;
        }
        const timer = setTimeout(async () => {
            setIsSearchLoading(true);
            try {
                const res = await fetch(`${API_URL}/api/users/search?q=${searchTerm}`);
                if (res.ok) {
                    const data: UserSearchDTO[] = await res.json();
                    setSearchResults(data.map(u => ({ ...u, isFollowing: false, isProcessing: false })));
                    setIsSearchOpen(true);
                } else setSearchResults([]);
            } catch (error) { setSearchResults([]); }
            setIsSearchLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // --- Handlers ---

    const handleSidebarFollow = async (targetUserId: number) => {
        if (!user) return;
        const updateLists = (id: number, updates: Partial<UserSearchDTO>) => {
            setSuggestedUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
            setSearchResults(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
        };
        updateLists(targetUserId, { isProcessing: true });
        try {
            const res = await fetch(`${API_URL}/api/users/${targetUserId}/follow?followerId=${user.id}`, { method: "POST" });
            if (!res.ok) throw new Error("Erro");
            setSuggestedUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, isFollowing: !u.isFollowing, isProcessing: false } : u));
            setSearchResults(prev => prev.map(u => u.id === targetUserId ? { ...u, isFollowing: !u.isFollowing, isProcessing: false } : u));
        } catch { updateLists(targetUserId, { isProcessing: false }); }
    };

    const handleProfileVisit = (userId: number) => {
        setViewedProfileId(userId);
        setActiveTab("perfil");
        setSearchTerm("");
        setSearchResults([]);
        setIsSearchOpen(false);
        setSidebarOpen(false);
    };

    const handleOpenChat = (userId: number, username: string, avatarUrl?: string) => {
        if (user && user.id === userId) {
            console.warn("Tentativa de abrir chat com o próprio usuário bloqueada.");
            return;
        }
        setActiveChatUser({ id: userId, username, avatarUrl });
    };

    const handleNotificationClick = (notification: AppNotification) => {
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
        if (notification.type === 'system') {
            setViewedProfileId(null);
            setActiveTab("perfil");
        } else {
            handleProfileVisit(notification.user.id);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('dagym_user');
        window.location.href = "/";
    };

    return (
        <div className="relative min-h-screen bg-background flex">
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 bg-black/50 md:hidden block" onClick={() => setSidebarOpen(false)} />
            )}

            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 border-r bg-background transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex h-full flex-col">
                    <div className="flex h-20 items-center justify-center border-b px-6 bg-white/50">
                        <div className="relative w-40 h-12">
                            <Image src="/logo-dagym.png" alt="DaGym Logo" fill className="object-contain" priority />
                        </div>
                        <Button variant="ghost" size="icon" className="md:hidden absolute right-2 top-5" onClick={() => setSidebarOpen(false)}>
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
                                        if (item.value === 'perfil') setViewedProfileId(null);
                                    }}
                                    className={cn(
                                        "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                                        activeTab === item.value ? "bg-[#8e0501] text-white shadow-md shadow-red-200" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    {item.icon}
                                    <span>{item.title}</span>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                    <div className="border-t p-4"><p className="text-xs text-center text-muted-foreground">© 2024 DaGym App</p></div>
                </div>
            </aside>

            {/* --- CONTEÚDO PRINCIPAL --- */}
            <div className="flex-1 flex flex-col min-h-screen w-full overflow-hidden">
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
                                        {isSearchLoading && !isSearchOpen && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                                        <Input
                                            type="search" placeholder="Pesquisar..."
                                            className="w-full rounded-full bg-muted pl-9 h-10 focus-visible:ring-red-500 border-none"
                                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
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
                                                <div key={u.id} className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted transition-colors">
                                                    <button onClick={() => handleProfileVisit(u.id)} className="flex items-center gap-3 flex-1 text-left">
                                                        <Avatar className="h-8 w-8">
                                                            {u.avatarUrl && <AvatarImage src={`${UPLOAD_URL}/${u.avatarUrl}`} className="object-cover" />}
                                                            <AvatarFallback>{u.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-sm font-medium">{u.nome}</p>
                                                            <p className="text-xs text-muted-foreground">@{u.username}</p>
                                                        </div>
                                                    </button>
                                                    <div className="flex items-center gap-1">
                                                        {/* NOVO: Botão de Mensagem na Busca */}
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-blue-50" onClick={(e) => { e.stopPropagation(); handleOpenChat(u.id, u.username, u.avatarUrl || undefined); }}>
                                                            <MessageCircle className="h-4 w-4 text-blue-500" />
                                                        </Button>

                                                        <Button variant="ghost" size="sm" disabled={u.isProcessing} onClick={(e) => { e.stopPropagation(); handleSidebarFollow(u.id); }}
                                                            className={cn("text-xs font-semibold h-auto p-1 ml-1", u.isFollowing ? "text-muted-foreground" : "text-blue-500 hover:text-blue-700")}>
                                                            {u.isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : u.isFollowing ? "Seguindo" : "Seguir"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : <p className="p-2 text-center text-sm text-muted-foreground">Nenhum resultado.</p>}
                                    </ScrollArea>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 md:gap-4 w-auto">
                        {/* --- INBOX (CHATS) --- */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-muted">
                                    <MessageCircle className="h-5 w-5 text-muted-foreground" />
                                    {inboxMessages.length > 0 && <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-blue-600 border-2 border-background animate-pulse" />}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-80 p-0 shadow-xl border-muted">
                                <div className="p-4 border-b flex justify-between items-center">
                                    <h3 className="font-semibold leading-none">Mensagens</h3>
                                    <span className="text-xs text-muted-foreground">{inboxMessages.length} conversas</span>
                                </div>
                                <ScrollArea className="h-[300px]">
                                    {inboxMessages.length > 0 ? (
                                        <div className="flex flex-col">
                                            {inboxMessages.map((chat) => (
                                                <button
                                                    key={chat.userId}
                                                    onClick={() => handleOpenChat(chat.userId, chat.username, chat.avatarUrl)}
                                                    className="flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors border-b border-muted/50 last:border-0"
                                                >
                                                    <div className="relative">
                                                        <Avatar className="h-10 w-10 border">
                                                            {chat.avatarUrl && <AvatarImage src={`${UPLOAD_URL}/${chat.avatarUrl}`} />}
                                                            <AvatarFallback>{chat.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-baseline mb-1">
                                                            <span className="font-semibold text-sm truncate">{chat.username}</span>
                                                            <span className="text-[10px] text-muted-foreground ml-2">Recente</span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {chat.lastMessage}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                                            <MessageCircle className="h-8 w-8 mb-2 opacity-20" />
                                            <p className="text-sm">Sua caixa de entrada está vazia.</p>
                                        </div>
                                    )}
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>

                        {/* --- NOTIFICAÇÕES (BELL) --- */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-muted">
                                    <Bell className="h-5 w-5 text-muted-foreground" />
                                    {unreadCount > 0 && <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-600 border-2 border-background animate-pulse" />}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-80 p-0 shadow-xl border-muted">
                                <div className="p-4 border-b"><h3 className="font-semibold leading-none">Notificações</h3></div>
                                <ScrollArea className="h-[300px]">
                                    {notifications.length > 0 ? (
                                        <div className="flex flex-col">
                                            {notifications.map((notification) => (
                                                <button key={notification.id} onClick={() => handleNotificationClick(notification)}
                                                    className={cn("flex items-start gap-3 p-4 text-left hover:bg-muted/50 transition-colors border-b border-muted/50 last:border-0", !notification.read && "bg-blue-50/50")}>
                                                    <div className="relative">
                                                        {notification.type === 'system' ? (
                                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200"><RefreshCw className="h-5 w-5 text-slate-600" /></div>
                                                        ) : (
                                                            <Avatar className="h-10 w-10 border">
                                                                {notification.user.avatarUrl && <AvatarImage src={`${UPLOAD_URL}/${notification.user.avatarUrl}`} />}
                                                                <AvatarFallback>{notification.user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                            </Avatar>
                                                        )}
                                                        <div className={cn("absolute -bottom-1 -right-1 rounded-full p-0.5 border-2 border-background text-white", notification.type === 'follow' ? "bg-blue-500" : notification.type === 'story' ? "bg-gradient-to-tr from-yellow-500 to-red-500" : "bg-green-500")}>
                                                            {notification.type === 'follow' && <UserPlus className="h-3 w-3" />}
                                                            {notification.type === 'story' && <Camera className="h-3 w-3" />}
                                                            {notification.type === 'system' && <RefreshCw className="h-3 w-3" />}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <p className="text-sm leading-tight"><span className="font-semibold text-foreground">{notification.user.username}</span> <span className="text-muted-foreground">{notification.text}</span></p>
                                                        <p className="text-xs text-muted-foreground">{notification.time}</p>
                                                    </div>
                                                    {!notification.read && <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />}
                                                </button>
                                            ))}
                                        </div>
                                    ) : <div className="p-8 text-center text-muted-foreground"><p className="text-sm">Nenhuma notificação.</p></div>}
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>

                        {/* --- PROFILE DROPDOWN --- */}
                        <Popover open={isProfileMenuOpen} onOpenChange={setIsProfileMenuOpen}>
                            <PopoverTrigger asChild>
                                <button className="rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                    <Avatar className="h-9 w-9 border border-border">
                                        {user?.avatarUrl && <AvatarImage src={`${UPLOAD_URL}/${user.avatarUrl}`} className="object-cover" />}
                                        <AvatarFallback className="bg-red-100 text-red-700">{user ? user.username.substring(0, 2).toUpperCase() : "EU"}</AvatarFallback>
                                    </Avatar>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-56 p-2">
                                <div className="flex flex-col space-y-1">
                                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground border-b mb-1">{user ? `@${user.username}` : "Minha Conta"}</div>
                                    <button onClick={() => { setActiveTab("perfil"); setViewedProfileId(null); setIsProfileMenuOpen(false); }} className="flex items-center gap-2 w-full px-2 py-2 text-sm rounded-md hover:bg-muted text-left transition-colors">
                                        <UserIcon className="h-4 w-4" /><span>Meu Perfil</span>
                                    </button>
                                    <button disabled className="flex items-center gap-2 w-full px-2 py-2 text-sm rounded-md hover:bg-muted text-left opacity-50 cursor-not-allowed">
                                        <Settings className="h-4 w-4" /><span>Configurações</span>
                                    </button>
                                    <button onClick={handleLogout} className="flex items-center gap-2 w-full px-2 py-2 text-sm rounded-md hover:bg-red-50 text-red-600 text-left transition-colors mt-1 border-t">
                                        <LogOut className="h-4 w-4" /><span>Sair</span>
                                    </button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </header>

                <main className="flex-1 p-0 md:p-6 lg:p-8 overflow-x-hidden bg-slate-50/50">
                    <Tabs defaultValue="home" value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
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
                            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="w-full max-w-7xl mx-auto px-4 md:px-0">
                                <TabsContent value="home" className="m-0">
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                        <div className="lg:col-span-8 w-full"><HomePage /></div>
                                        <div className="hidden lg:block lg:col-span-4 sticky top-6">
                                            {user && (
                                                <div className="flex items-center justify-between mb-6 pl-2">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-12 w-12 border">
                                                            {user.avatarUrl && <AvatarImage src={`${UPLOAD_URL}/${user.avatarUrl}`} className="object-cover" />}
                                                            <AvatarFallback className="bg-red-100 text-red-700">{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col"><span className="font-semibold text-sm">{user.username}</span><span className="text-xs text-muted-foreground">Conta Pessoal</span></div>
                                                    </div>
                                                    <button onClick={handleLogout} className="text-xs text-blue-500 font-semibold p-0 h-auto hover:underline">Sair</button>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between mb-4 pl-2">
                                                <span className="text-sm font-semibold text-muted-foreground">{searchTerm ? "Resultados da busca" : "Sugestões para você"}</span>
                                            </div>
                                            <div className="space-y-4">
                                                {(searchTerm ? isSearchLoading : isSuggestionsLoading) ? (
                                                    <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                                                ) : (searchTerm ? searchResults : suggestedUsers).length > 0 ? (
                                                    (searchTerm ? searchResults : suggestedUsers).map((u) => (
                                                        <div key={u.id} className="flex items-center justify-between pl-2 py-1">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-9 w-9">
                                                                    {u.avatarUrl && <AvatarImage src={`${UPLOAD_URL}/${u.avatarUrl}`} className="object-cover" />}
                                                                    <AvatarFallback className="text-xs">{u.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-semibold leading-none hover:underline cursor-pointer" onClick={() => handleProfileVisit(u.id)}>{u.username}</span>
                                                                    <span className="text-xs text-muted-foreground mt-0.5">{searchTerm ? u.nome : "Sugestão"}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                 {/* NOVO: Botão de Mensagem nas Sugestões */}
                                                                 <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-blue-50" onClick={(e) => { e.stopPropagation(); handleOpenChat(u.id, u.username, u.avatarUrl || undefined); }}>
                                                                    <MessageCircle className="h-4 w-4 text-blue-500" />
                                                                </Button>

                                                                <Button variant="ghost" disabled={u.isProcessing} onClick={() => handleSidebarFollow(u.id)} className={cn("text-xs font-semibold p-0 h-auto hover:bg-transparent", u.isFollowing ? "text-muted-foreground hover:text-black" : "text-blue-500 hover:text-blue-700")}>
                                                                    {u.isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : u.isFollowing ? "Seguindo" : "Seguir"}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : <div className="pl-2 text-sm text-muted-foreground">{searchTerm ? "Nenhum usuário encontrado." : "Sem sugestões no momento."}</div>}
                                            </div>
                                            <div className="mt-8 pl-2">
                                                <p className="text-[11px] text-gray-300 leading-relaxed">Sobre • Ajuda • Imprensa • API • Carreiras • Privacidade • Termos</p>
                                                <p className="text-[11px] text-gray-300 mt-4">© 2025 DAGYM DO BRASIL</p>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="treinos" className="m-0"> <WorkoutPage /> </TabsContent>
                                <TabsContent value="dietas" className="m-0"> <DietPage /> </TabsContent>
                                <TabsContent value="desafios" className="m-0"> <ChallengesPage /> </TabsContent>
                                <TabsContent value="perfil" className="m-0"> <ProfilePage key={viewedProfileId || 'me'} profileId={viewedProfileId} /> </TabsContent>
                                <TabsContent value="comunidade" className="m-0"> <CommunityPage /> </TabsContent>
                            </motion.div>
                        </AnimatePresence>
                    </Tabs>
                </main>
            </div>

            {user && activeChatUser && (
                <ChatWindow
                    currentUser={user}
                    targetUser={activeChatUser}
                    onClose={() => setActiveChatUser(null)}
                />
            )}
        </div>
    )
}