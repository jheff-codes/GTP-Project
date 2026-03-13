import * as React from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
    Calendar,
    Settings,
    User,
    Users,
    Building2,
    LayoutDashboard,
    Loader2,
    MessageCircle
} from "lucide-react"

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command"

import { supabase } from "@/lib/supabase"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { ChatModal } from "@/components/chat/ChatModal"

interface SearchClient {
    id: number
    name: string | null
    phone: string | null
    owner_id: string | null
    status: string | null
    profiles: { name: string | null } | null
}

interface SearchImovel {
    id: number
    nome_do_imovel: string | null
    bairro: string | null
    cidade: string | null
}

export function CommandPalette({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const navigate = useNavigate()
    const location = useLocation()
    const { data: currentUser } = useCurrentUser()
    const [query, setQuery] = React.useState("")
    const [loading, setLoading] = React.useState(false)
    const [results, setResults] = React.useState<{ clients: SearchClient[], imoveis: SearchImovel[] }>({ clients: [], imoveis: [] })
    const [chatClient, setChatClient] = React.useState<any>(null)
    const [chatOpen, setChatOpen] = React.useState(false)

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                onOpenChange(!open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [onOpenChange, open])

    React.useEffect(() => {
        if (!open) {
            setQuery("")
            setResults({ clients: [], imoveis: [] })
        }
    }, [open])

    React.useEffect(() => {
        if (query.length < 2 || !currentUser) {
            setResults({ clients: [], imoveis: [] })
            return
        }

        const agencyId = currentUser.agency_id || currentUser.id

        const timer = setTimeout(async () => {
            setLoading(true)
            try {
                const [clientsReq, imoveisReq] = await Promise.all([
                    supabase
                        .from('clients')
                        .select('id, name, phone, owner_id, status, profiles(name)')
                        .eq('agency_id', agencyId)
                        .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
                        .limit(5),
                    supabase
                        .from('imoveis')
                        .select('id, nome_do_imovel, bairro, cidade')
                        .ilike('nome_do_imovel', `%${query}%`)
                        .limit(5)
                ])

                setResults({
                    clients: (clientsReq.data as any[]) || [],
                    imoveis: (imoveisReq.data as any[]) || []
                })
            } catch (error) {
                console.error("Search error:", error)
            } finally {
                setLoading(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [query, currentUser])

    const runCommand = React.useCallback((command: () => unknown) => {
        onOpenChange(false)
        command()
    }, [onOpenChange])

    const handleClientClick = (client: SearchClient) => {
        onOpenChange(false)
        setChatClient(client)
        setChatOpen(true)
    }

    const getBrokerName = (client: SearchClient): string => {
        if (!client.profiles) return 'Sem corretor'
        return client.profiles.name || 'Sem corretor'
    }

    return (
        <>
            <CommandDialog open={open} onOpenChange={onOpenChange} shouldFilter={false}>
                <CommandInput
                    placeholder="Busque por clientes, imóveis ou comandos..."
                    value={query}
                    onValueChange={setQuery}
                />
                <CommandList>
                    <CommandEmpty>
                        {loading ? (
                            <div className="flex items-center justify-center gap-2 py-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Buscando...</span>
                            </div>
                        ) : "Nenhum resultado encontrado."}
                    </CommandEmpty>

                    {/* Client Results */}
                    {results.clients.length > 0 && (
                        <CommandGroup heading="Clientes">
                            {results.clients.map(client => (
                                <CommandItem
                                    key={client.id}
                                    onSelect={() => runCommand(() => handleClientClick(client))}
                                    value={`client-${client.id}-${client.name}-${client.phone}`}
                                >
                                    <User className="mr-2 h-4 w-4 shrink-0" />
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className="truncate">{client.name || 'Sem nome'}</span>
                                        <span className="text-xs text-muted-foreground truncate">{client.phone}</span>
                                    </div>
                                    <span className="ml-auto text-[10px] text-muted-foreground uppercase tracking-wider shrink-0">
                                        {getBrokerName(client)}
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {/* Property Results */}
                    {results.imoveis.length > 0 && (
                        <CommandGroup heading="Imóveis">
                            {results.imoveis.map(imovel => (
                                <CommandItem
                                    key={imovel.id}
                                    onSelect={() => runCommand(() => navigate(`/properties?id=${imovel.id}`))}
                                    value={`imovel-${imovel.id}-${imovel.nome_do_imovel}`}
                                >
                                    <Building2 className="mr-2 h-4 w-4 shrink-0" />
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className="truncate">{imovel.nome_do_imovel}</span>
                                        {(imovel.bairro || imovel.cidade) && (
                                            <span className="text-xs text-muted-foreground truncate">
                                                {[imovel.bairro, imovel.cidade].filter(Boolean).join(', ')}
                                            </span>
                                        )}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {(results.clients.length > 0 || results.imoveis.length > 0) && <CommandSeparator />}

                    {/* Quick Navigation */}
                    <CommandGroup heading="Sugestões">
                        <CommandItem onSelect={() => runCommand(() => navigate("/leads"))}>
                            <Users className="mr-2 h-4 w-4" />
                            <span>Todos os Clientes</span>
                            <CommandShortcut>C</CommandShortcut>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate("/properties"))}>
                            <Building2 className="mr-2 h-4 w-4" />
                            <span>Todos os Imóveis</span>
                            <CommandShortcut>I</CommandShortcut>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate("/agenda"))}>
                            <Calendar className="mr-2 h-4 w-4" />
                            <span>Agenda</span>
                        </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Sistema">
                        <CommandItem onSelect={() => runCommand(() => navigate("/"))}>
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate("/team"))}>
                            <Users className="mr-2 h-4 w-4" />
                            <span>Equipes</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate("/settings"))}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Configurações</span>
                            <CommandShortcut>⌘S</CommandShortcut>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
            <ChatModal
                client={chatClient}
                open={chatOpen}
                onClose={() => {
                    setChatOpen(false)
                    setChatClient(null)
                }}
            />
        </>
    )
}
