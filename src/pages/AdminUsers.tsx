import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Loader2, Plus, Shield, ShieldOff, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ManagedUser {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  roles: string[];
}

export default function AdminUsers() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [fetching, setFetching] = useState(true);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "user">("user");
  const [creating, setCreating] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Password dialog
  const [passwordTarget, setPasswordTarget] = useState<ManagedUser | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      toast.error("Acesso restrito a administradores");
      navigate("/login");
    }
  }, [loading, user, isAdmin, navigate]);

  const refresh = async () => {
    setFetching(true);
    const { data, error } = await supabase.functions.invoke("manage-users", {
      body: { type: "list" },
    });
    if (error) {
      toast.error("Erro ao carregar usuários");
    } else {
      setUsers((data?.users ?? []) as ManagedUser[]);
    }
    setFetching(false);
  };

  useEffect(() => {
    if (isAdmin) refresh();
  }, [isAdmin]);

  const handleCreate = async () => {
    if (!newEmail || newPassword.length < 8) {
      toast.error("Email obrigatório e senha com pelo menos 8 caracteres");
      return;
    }
    setCreating(true);
    const { error } = await supabase.functions.invoke("manage-users", {
      body: {
        type: "create",
        email: newEmail,
        password: newPassword,
        role: newRole,
      },
    });
    setCreating(false);
    if (error) {
      toast.error("Erro ao criar usuário");
      return;
    }
    toast.success(`Usuário ${newEmail} criado`);
    setCreateOpen(false);
    setNewEmail("");
    setNewPassword("");
    setNewRole("user");
    refresh();
  };

  const handleToggleAdmin = async (u: ManagedUser) => {
    const isCurrentlyAdmin = u.roles.includes("admin");
    const nextRole = isCurrentlyAdmin ? "user" : "admin";
    const { error } = await supabase.functions.invoke("manage-users", {
      body: { type: "set_role", user_id: u.id, role: nextRole },
    });
    if (error) {
      toast.error("Erro ao atualizar permissão");
      return;
    }
    toast.success(
      isCurrentlyAdmin
        ? `${u.email} agora é usuário comum`
        : `${u.email} agora é administrador`,
    );
    refresh();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.functions.invoke("manage-users", {
      body: { type: "delete", user_id: deleteTarget.id },
    });
    setDeleting(false);
    if (error) {
      toast.error("Erro ao remover usuário");
      return;
    }
    toast.success(`${deleteTarget.email} removido`);
    setDeleteTarget(null);
    refresh();
  };

  const handleUpdatePassword = async () => {
    if (!passwordTarget) return;
    if (newPasswordValue.length < 8) {
      toast.error("Senha deve ter pelo menos 8 caracteres");
      return;
    }
    setUpdatingPassword(true);
    const { error } = await supabase.functions.invoke("manage-users", {
      body: {
        type: "set_password",
        user_id: passwordTarget.id,
        password: newPasswordValue,
      },
    });
    setUpdatingPassword(false);
    if (error) {
      toast.error("Erro ao atualizar senha");
      return;
    }
    toast.success(`Senha de ${passwordTarget.email} atualizada`);
    setPasswordTarget(null);
    setNewPasswordValue("");
  };

  if (loading || !isAdmin) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Gestão de usuários
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Crie contas, defina permissões e remova acessos do painel.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Novo usuário
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Usuários cadastrados ({users.length})
            </CardTitle>
            <CardDescription>
              Administradores podem editar a estrutura do organograma e gerenciar dados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {fetching ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Permissão</TableHead>
                    <TableHead>Último acesso</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => {
                    const isUserAdmin = u.roles.includes("admin");
                    const isSelf = u.id === user?.id;
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          {u.email}
                          {isSelf && (
                            <span className="ml-2 text-[10px] text-muted-foreground">
                              (você)
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isUserAdmin ? (
                            <Badge className="bg-amber-500 hover:bg-amber-500/90 gap-1">
                              <Shield className="w-3 h-3" /> Admin
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Usuário</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {u.last_sign_in_at
                            ? new Date(u.last_sign_in_at).toLocaleString("pt-BR")
                            : "Nunca"}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleAdmin(u)}
                            disabled={isSelf}
                            className="gap-1.5"
                            title={
                              isSelf
                                ? "Você não pode alterar sua própria permissão"
                                : isUserAdmin
                                  ? "Remover privilégio admin"
                                  : "Tornar admin"
                            }
                          >
                            {isUserAdmin ? (
                              <>
                                <ShieldOff className="w-3.5 h-3.5" />
                                Remover admin
                              </>
                            ) : (
                              <>
                                <Shield className="w-3.5 h-3.5" />
                                Tornar admin
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setNewPasswordValue("");
                              setPasswordTarget(u);
                            }}
                            className="gap-1.5"
                            title="Editar senha"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            Senha
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(u)}
                            disabled={isSelf}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            title={
                              isSelf
                                ? "Você não pode remover a si mesmo"
                                : "Remover usuário"
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create user dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Novo usuário
            </DialogTitle>
            <DialogDescription>
              O usuário poderá acessar o sistema imediatamente com a senha definida.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-email">Email</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="usuario@bwild.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Senha temporária</Label>
              <Input
                id="new-password"
                type="text"
                placeholder="Mínimo 8 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Compartilhe a senha com o usuário e oriente a alterá-la no primeiro acesso.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Permissão</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as "admin" | "user")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário (somente visualização)</SelectItem>
                  <SelectItem value="admin">Administrador (acesso total)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Criando..." : "Criar usuário"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.email}</strong> perderá imediatamente todo
              acesso ao sistema. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit password dialog */}
      <Dialog
        open={!!passwordTarget}
        onOpenChange={(open) => {
          if (!open) {
            setPasswordTarget(null);
            setNewPasswordValue("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              Editar senha
            </DialogTitle>
            <DialogDescription>
              Defina uma nova senha para <strong>{passwordTarget?.email}</strong>.
              O usuário poderá entrar imediatamente com a nova senha.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="edit-password">Nova senha</Label>
            <Input
              id="edit-password"
              type="text"
              placeholder="Mínimo 8 caracteres"
              value={newPasswordValue}
              onChange={(e) => setNewPasswordValue(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              Compartilhe a nova senha com o usuário por um canal seguro.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setPasswordTarget(null);
                setNewPasswordValue("");
              }}
              disabled={updatingPassword}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdatePassword} disabled={updatingPassword}>
              {updatingPassword ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
