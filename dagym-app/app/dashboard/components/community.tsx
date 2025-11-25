"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Users, 
    Plus, 
    Search, 
    MapPin, 
    Trophy,
    Dumbbell,
    X,
    Loader2,
    User as UserIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const UPLOAD_URL = "http://localhost:8080/uploads";

// Interface do Grupo
interface Group {
    id: number;
    name: string;
    description: string;
    category: "Calistenia" | "Musculação" | "Corrida" | "Yoga" | "Outros";
    membersCount: number;
    isMember: boolean;
    location?: string;
}

// Interface do Membro (Usuário)
interface GroupMember {
    id: number;
    nome: string;
    username: string;
    avatarUrl?: string | null;
}

export function CommunityPage() {
    // States Principais
    const [groups, setGroups] = useState<Group[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    // States do Modal de Criação
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupDesc, setNewGroupDesc] = useState("");
    const [newGroupCategory, setNewGroupCategory] = useState<Group['category']>("Calistenia");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // States do Modal de Membros
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);

    // 1. Carregar Usuário Logado
    useEffect(() => {
        const storedUser = localStorage.getItem('dagym_user');
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            setCurrentUserId(parsed.id);
        }
    }, []);

    // 2. Buscar Grupos
    const fetchGroups = async (query = "") => {
        if (!currentUserId) return; 
        
        setIsLoading(true);
        try {
            let url = `${API_URL}/api/groups?userId=${currentUserId}`;
            if (query) {
                url += `&q=${query}`;
            }
            
            const res = await fetch(url);
            
            if (!res.ok) {
                setGroups([]); 
                return;
            }

            const data = await res.json();
            setGroups(data);
            
        } catch (error) {
            console.error("Erro de conexão:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // 3. Buscar Membros de um Grupo Específico
    const handleShowMembers = async (group: Group) => {
        setSelectedGroup(group);
        setIsMembersModalOpen(true);
        setIsLoadingMembers(true);
        setGroupMembers([]); // Limpa lista anterior

        try {
            const res = await fetch(`${API_URL}/api/groups/${group.id}/members`);
            if (res.ok) {
                const data = await res.json();
                setGroupMembers(data);
            }
        } catch (error) {
            console.error("Erro ao buscar membros:", error);
        } finally {
            setIsLoadingMembers(false);
        }
    };

    useEffect(() => {
        if (currentUserId) {
            fetchGroups();
        }
    }, [currentUserId]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentUserId) fetchGroups(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);


    // Ação de Entrar/Sair
    const toggleMembership = async (groupId: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Impede que o clique abra o modal de membros se clicar no botão erradamente
        if (!currentUserId) return;

        setGroups(prev => prev.map(g => {
            if (g.id === groupId) {
                return {
                    ...g,
                    isMember: !g.isMember,
                    membersCount: g.isMember ? g.membersCount - 1 : g.membersCount + 1
                };
            }
            return g;
        }));

        try {
            await fetch(`${API_URL}/api/groups/${groupId}/toggle-member?userId=${currentUserId}`, {
                method: "POST"
            });
            // Se o modal de membros estiver aberto, atualiza a lista também
            if (isMembersModalOpen && selectedGroup?.id === groupId) {
                handleShowMembers(selectedGroup);
            }
        } catch (error) {
            console.error("Erro de conexão:", error);
        }
    };

    // Ação de Criar Grupo
    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUserId) return;

        setIsSubmitting(true);

        const newGroupData = {
            name: newGroupName,
            description: newGroupDesc,
            category: newGroupCategory,
            location: "Brasil"
        };

        try {
            const res = await fetch(`${API_URL}/api/groups?userId=${currentUserId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newGroupData)
            });

            if (res.ok) {
                const createdGroup: Group = await res.json();
                setGroups([createdGroup, ...groups]);
                setIsCreateModalOpen(false);
                setNewGroupName("");
                setNewGroupDesc("");
            }
        } catch (error) {
            console.error("Erro ao criar grupo:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 md:p-0 max-w-6xl mx-auto space-y-6 pb-20">
            
            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Comunidades DaGym</h1>
                    <p className="text-muted-foreground">Encontre, treine junto e evolua.</p>
                </div>
                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-[#8e0501] hover:bg-[#6b0401] text-white gap-2"
                >
                    <Plus className="h-4 w-4" /> Criar Grupo
                </Button>
            </div>

            {/* Busca */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Buscar grupos de calistenia, corrida..." 
                    className="pl-10 bg-white border-gray-200 h-12"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Lista de Grupos */}
            {isLoading && groups.length === 0 ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-red-600" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groups.map((group) => (
                        <motion.div 
                            key={group.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                        >
                            <div className={cn("h-24 w-full relative", 
                                group.category === 'Calistenia' ? "bg-slate-900" : 
                                group.category === 'Yoga' ? "bg-orange-100" : "bg-gray-100"
                            )}>
                                <div className="absolute top-2 right-2">
                                    <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-md">
                                        {group.category}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 flex-1 flex flex-col gap-3 -mt-8">
                                <div className="flex justify-between items-end">
                                    <Avatar className="h-14 w-14 border-4 border-white shadow-sm">
                                        <AvatarFallback className={cn(
                                            "text-lg font-bold",
                                            group.category === 'Calistenia' ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
                                        )}>
                                            {group.name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    {group.isMember && (
                                        <div className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                            <Trophy className="h-3 w-3" /> Membro
                                        </div>
                                    )}
                                </div>
                                
                                <div>
                                    <h3 className="font-bold text-lg leading-tight">{group.name}</h3>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                        <MapPin className="h-3 w-3" /> {group.location || "Global"}
                                    </div>
                                </div>

                                <p className="text-sm text-gray-600 line-clamp-2 flex-1">
                                    {group.description}
                                </p>

                                <div className="pt-3 border-t mt-2 flex items-center justify-between">
                                    {/* BOTÃO PARA ABRIR MEMBROS */}
                                    <button 
                                        onClick={() => handleShowMembers(group)}
                                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-red-600 hover:underline transition-colors cursor-pointer"
                                    >
                                        <Users className="h-4 w-4" />
                                        <span>{group.membersCount} membros</span>
                                    </button>
                                    
                                    <Button 
                                        size="sm" 
                                        variant={group.isMember ? "outline" : "default"}
                                        className={cn(
                                            group.isMember 
                                                ? "border-red-200 text-red-700 hover:bg-red-50" 
                                                : "bg-slate-900 text-white hover:bg-slate-800"
                                        )}
                                        onClick={(e) => toggleMembership(group.id, e)}
                                    >
                                        {group.isMember ? "Sair" : "Entrar"}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {!isLoading && groups.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                    <Dumbbell className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Nenhum grupo encontrado.</p>
                </div>
            )}

            {/* --- MODAL DE CRIAÇÃO --- */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-4 border-b flex justify-between items-center">
                                <h2 className="text-lg font-bold">Criar Novo Grupo</h2>
                                <Button variant="ghost" size="icon" onClick={() => setIsCreateModalOpen(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            
                            <form onSubmit={handleCreateGroup} className="p-4 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nome do Grupo</label>
                                    <Input 
                                        placeholder="Ex: Calistenia Iniciante" 
                                        required
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Categoria</label>
                                    <select 
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                                        value={newGroupCategory}
                                        onChange={(e) => setNewGroupCategory(e.target.value as any)}
                                    >
                                        <option value="Calistenia">Calistenia</option>
                                        <option value="Musculação">Musculação</option>
                                        <option value="Corrida">Corrida</option>
                                        <option value="Yoga">Yoga</option>
                                        <option value="Outros">Outros</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Descrição</label>
                                    <textarea 
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                                        placeholder="Descreva o objetivo do grupo..."
                                        required
                                        value={newGroupDesc}
                                        onChange={(e) => setNewGroupDesc(e.target.value)}
                                    />
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => setIsCreateModalOpen(false)}>
                                        Cancelar
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        className="flex-1 bg-[#8e0501] hover:bg-[#6b0401] text-white"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar Grupo"}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- MODAL DE MEMBROS --- */}
            <AnimatePresence>
                {isMembersModalOpen && selectedGroup && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"
                        >
                            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                                <div>
                                    <h2 className="text-lg font-bold">Membros</h2>
                                    <p className="text-xs text-muted-foreground">{selectedGroup.name}</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setIsMembersModalOpen(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            
                            <ScrollArea className="flex-1 p-4">
                                {isLoadingMembers ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-red-600" />
                                    </div>
                                ) : groupMembers.length > 0 ? (
                                    <div className="space-y-4">
                                        {groupMembers.map((member) => (
                                            <div key={member.id} className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border">
                                                    {member.avatarUrl && (
                                                        <AvatarImage 
                                                            src={`${UPLOAD_URL}/${member.avatarUrl}`} 
                                                            className="object-cover"
                                                        />
                                                    )}
                                                    <AvatarFallback className="bg-slate-100 text-slate-600">
                                                        {member.username.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{member.nome}</span>
                                                    <span className="text-xs text-muted-foreground">@{member.username}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <UserIcon className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">Nenhum membro encontrado.</p>
                                    </div>
                                )}
                            </ScrollArea>
                            
                            <div className="p-4 border-t bg-slate-50 text-center">
                                <p className="text-xs text-muted-foreground">
                                    Total de {groupMembers.length} participantes
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}