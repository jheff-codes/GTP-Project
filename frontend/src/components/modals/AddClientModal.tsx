import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useCreateClient } from "@/hooks/useClients";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AddClientModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddClientModal({ open, onOpenChange }: AddClientModalProps) {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const createClient = useCreateClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createClient.mutateAsync({
                name,
                phone,
                status: "disparo",
            });
            toast.success("Cliente criado com sucesso!");
            onOpenChange(false);
            setName("");
            setPhone("");
        } catch (error) {
            toast.error("Erro ao criar cliente");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Novo Cliente</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nome do cliente"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="(00) 00000-0000"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={createClient.isPending}>
                            {createClient.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Criar
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
