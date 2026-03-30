import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { EmployeeDrawer } from "@/components/employee/EmployeeDrawer";
import type { Colaborador } from "@/types/organogram";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import {
  useColaboradores,
  useDepartmentColors,
  useUpdateColaborador,
  useCreateColaborador,
  useDeleteColaborador,
  useUpdateDepartmentColor,
  useCreateDepartmentColor,
} from "@/hooks/use-colaboradores";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft,
  Camera,
  LogOut,
  Palette,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import logoSrc from "@/assets/logo-bwild.png";

export default function Admin() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: colaboradores, isLoading: loadingColab } = useColaboradores();
  const { data: deptColors, isLoading: loadingColors } = useDepartmentColors();

  const updateColab = useUpdateColaborador();
  const createColab = useCreateColaborador();
  const deleteColab = useDeleteColaborador();
  const updateColor = useUpdateDepartmentColor();
  const createColor = useCreateDepartmentColor();

  const [editingColab, setEditingColab] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nome: "", cargo: "", departamento: "", funcoes: "" });
  const [newColabOpen, setNewColabOpen] = useState(false);
  const [newForm, setNewForm] = useState({ id: "", nome: "", cargo: "", departamento: "", nivel: "0", superior_id: "", funcoes: "" });
  const [newDeptOpen, setNewDeptOpen] = useState(false);
  const [newDeptForm, setNewDeptForm] = useState({ departamento: "", bg: "#1B4F72" });
  const [drawerPerson, setDrawerPerson] = useState<Colaborador | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <p className="text-muted-foreground">Acesso restrito a administradores.</p>
        <Button variant="outline" onClick={() => navigate("/login")}>Ir para login</Button>
      </div>
    );
  }

  const startEdit = (c: { id: string; nome: string; cargo: string; departamento: string; funcoes: string[] }) => {
    setEditingColab(c.id);
    setEditForm({ nome: c.nome, cargo: c.cargo, departamento: c.departamento, funcoes: c.funcoes.join("\n") });
  };

  const saveEdit = async () => {
    if (!editingColab) return;
    try {
      await updateColab.mutateAsync({
        id: editingColab,
        nome: editForm.nome,
        cargo: editForm.cargo,
        departamento: editForm.departamento,
        funcoes: editForm.funcoes.split("\n").filter(Boolean),
      });
      toast.success("Colaborador atualizado!");
      setEditingColab(null);
    } catch {
      toast.error("Erro ao atualizar colaborador.");
    }
  };

  const handleCreateColab = async () => {
    const slug = newForm.id || newForm.nome.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    try {
      await createColab.mutateAsync({
        id: slug,
        nome: newForm.nome,
        cargo: newForm.cargo,
        departamento: newForm.departamento,
        nivel: parseInt(newForm.nivel),
        funcoes: newForm.funcoes.split("\n").filter(Boolean),
        superior_id: newForm.superior_id || null,
      });
      toast.success("Colaborador criado!");
      setNewColabOpen(false);
      setNewForm({ id: "", nome: "", cargo: "", departamento: "", nivel: "0", superior_id: "", funcoes: "" });
    } catch {
      toast.error("Erro ao criar colaborador.");
    }
  };

  const handleDeleteColab = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este colaborador?")) return;
    try {
      await deleteColab.mutateAsync(id);
      toast.success("Colaborador removido!");
    } catch {
      toast.error("Erro ao remover. Verifique se não há subordinados vinculados.");
    }
  };

  const handleUploadPhoto = async (colabId: string, file: File) => {
    const ext = file.name.split(".").pop();
    const path = `${colabId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Erro ao enviar foto.");
      return;
    }

    const { data: urlData } = supabase.storage.from("photos").getPublicUrl(path);

    await updateColab.mutateAsync({ id: colabId, foto_url: urlData.publicUrl });
    toast.success("Foto atualizada!");
  };

  const handleSaveColor = async (id: string, bg: string) => {
    try {
      await updateColor.mutateAsync({ id, bg });
      toast.success("Cor atualizada!");
    } catch {
      toast.error("Erro ao atualizar cor.");
    }
  };

  const handleCreateDept = async () => {
    try {
      await createColor.mutateAsync({ departamento: newDeptForm.departamento, bg: newDeptForm.bg });
      toast.success("Departamento criado!");
      setNewDeptOpen(false);
      setNewDeptForm({ departamento: "", bg: "#1B4F72" });
    } catch {
      toast.error("Erro ao criar departamento.");
    }
  };

  const departments = deptColors?.map((d) => d.departamento) ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg overflow-hidden">
              <img src={logoSrc} alt="Bwild" className="h-full w-full object-cover" />
            </div>
            <h1 className="font-display text-lg font-bold" style={{ color: "#0f2137" }}>
              Admin — Organograma
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Ver organograma
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-1" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Tabs defaultValue="colaboradores">
          <TabsList className="mb-6">
            <TabsTrigger value="colaboradores" className="gap-1.5">
              <Users className="w-4 h-4" /> Colaboradores
            </TabsTrigger>
            <TabsTrigger value="departamentos" className="gap-1.5">
              <Palette className="w-4 h-4" /> Departamentos
            </TabsTrigger>
          </TabsList>

          {/* Colaboradores Tab */}
          <TabsContent value="colaboradores">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">
                {colaboradores?.length ?? 0} colaboradores
              </p>
              <Dialog open={newColabOpen} onOpenChange={setNewColabOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1" /> Novo colaborador
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5">
                    <DialogHeader>
                      <DialogTitle className="text-white flex items-center gap-2 text-base">
                        <Users className="w-4 h-4" /> Novo colaborador
                      </DialogTitle>
                      <p className="text-slate-300 text-xs mt-1">Preencha os dados para adicionar ao organograma</p>
                    </DialogHeader>
                  </div>
                  <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5 col-span-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Nome</Label>
                        <Input value={newForm.nome} onChange={(e) => setNewForm((p) => ({ ...p, nome: e.target.value }))} placeholder="Nome completo" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cargo</Label>
                        <Input value={newForm.cargo} onChange={(e) => setNewForm((p) => ({ ...p, cargo: e.target.value }))} placeholder="Ex: Gerente" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Nível</Label>
                        <Input type="number" min={0} max={10} value={newForm.nivel} onChange={(e) => setNewForm((p) => ({ ...p, nivel: e.target.value }))} />
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Departamento</Label>
                        <Select value={newForm.departamento} onValueChange={(v) => setNewForm((p) => ({ ...p, departamento: v }))}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {departments.map((d) => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Superior</Label>
                        <Select value={newForm.superior_id} onValueChange={(v) => setNewForm((p) => ({ ...p, superior_id: v }))}>
                          <SelectTrigger><SelectValue placeholder="Nenhum (raiz)" /></SelectTrigger>
                          <SelectContent>
                            {colaboradores?.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.nome} — {c.cargo}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Funções (uma por linha)</Label>
                      <textarea
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px] resize-none"
                        value={newForm.funcoes}
                        onChange={(e) => setNewForm((p) => ({ ...p, funcoes: e.target.value }))}
                        placeholder="Gestão de equipes&#10;Planejamento estratégico"
                      />
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setNewColabOpen(false)}>Cancelar</Button>
                    <Button size="sm" onClick={handleCreateColab}>Criar colaborador</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {loadingColab ? (
              <p className="text-muted-foreground text-sm">Carregando...</p>
            ) : (
              <div className="grid gap-3">
                {colaboradores?.map((c) => (
                  <Card key={c.id} className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setDrawerPerson(c)}>
                    <CardContent className="flex items-center gap-4 py-4">
                      {/* Photo */}
                      <div className="relative group">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden"
                          style={{
                            backgroundColor: c.foto ? undefined : "#1B4F72",
                            color: "white",
                          }}
                        >
                          {c.foto ? (
                            <img src={c.foto} alt={c.nome} className="w-full h-full object-cover" />
                          ) : (
                            c.nome.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
                          )}
                        </div>
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                          <Camera className="w-4 h-4 text-white" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadPhoto(c.id, file);
                            }}
                          />
                        </label>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        {editingColab === c.id ? (
                          <div className="space-y-3 bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1 col-span-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Nome</Label>
                                <Input value={editForm.nome} onChange={(e) => setEditForm((p) => ({ ...p, nome: e.target.value }))} placeholder="Nome" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cargo</Label>
                                <Input value={editForm.cargo} onChange={(e) => setEditForm((p) => ({ ...p, cargo: e.target.value }))} placeholder="Cargo" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Departamento</Label>
                                <Select value={editForm.departamento} onValueChange={(v) => setEditForm((p) => ({ ...p, departamento: v }))}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {departments.map((d) => (
                                      <SelectItem key={d} value={d}>{d}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Funções (uma por linha)</Label>
                              <textarea
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[60px] resize-none"
                                value={editForm.funcoes}
                                onChange={(e) => setEditForm((p) => ({ ...p, funcoes: e.target.value }))}
                                placeholder="Funções (uma por linha)"
                              />
                            </div>
                            <div className="flex gap-2 pt-1">
                              <Button size="sm" onClick={saveEdit}>Salvar</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingColab(null)}>Cancelar</Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="font-semibold text-sm truncate" style={{ color: "#0f2137" }}>{c.nome}</p>
                            <p className="text-xs text-muted-foreground">{c.cargo} • {c.departamento}</p>
                          </>
                        )}
                      </div>

                      {/* Actions */}
                      {editingColab !== c.id && (
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(c)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteColab(c.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Departamentos Tab */}
          <TabsContent value="departamentos">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">
                {deptColors?.length ?? 0} departamentos
              </p>
              <Dialog open={newDeptOpen} onOpenChange={setNewDeptOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1" /> Novo departamento
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[420px] p-0 gap-0 overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5">
                    <DialogHeader>
                      <DialogTitle className="text-white flex items-center gap-2 text-base">
                        <Palette className="w-4 h-4" /> Novo departamento
                      </DialogTitle>
                      <p className="text-slate-300 text-xs mt-1">Defina o nome e a cor do departamento</p>
                    </DialogHeader>
                  </div>
                  <div className="px-6 py-5 space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Nome do departamento</Label>
                      <Input value={newDeptForm.departamento} onChange={(e) => setNewDeptForm((p) => ({ ...p, departamento: e.target.value }))} placeholder="Ex: Financeiro" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cor</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={newDeptForm.bg}
                          onChange={(e) => setNewDeptForm((p) => ({ ...p, bg: e.target.value }))}
                          className="w-10 h-10 rounded-lg border border-input cursor-pointer"
                        />
                        <Input value={newDeptForm.bg} onChange={(e) => setNewDeptForm((p) => ({ ...p, bg: e.target.value }))} className="flex-1 font-mono text-xs" />
                        <div
                          className="px-3 py-1.5 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: newDeptForm.bg, color: "#fff" }}
                        >
                          Preview
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setNewDeptOpen(false)}>Cancelar</Button>
                    <Button size="sm" onClick={handleCreateDept}>Criar departamento</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {loadingColors ? (
              <p className="text-muted-foreground text-sm">Carregando...</p>
            ) : (
              <div className="grid gap-3">
                {deptColors?.map((dc) => (
                  <DeptColorCard key={dc.id} dc={dc} onSave={handleSaveColor} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <AnimatePresence>
        {drawerPerson && colaboradores && (
          <EmployeeDrawer
            person={drawerPerson}
            allColaboradores={colaboradores}
            onClose={() => setDrawerPerson(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function DeptColorCard({ dc, onSave }: { dc: { id: string; departamento: string; bg: string; text_color: string }; onSave: (id: string, bg: string) => void }) {
  const [localColor, setLocalColor] = useState(dc.bg);

  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-4">
        <input
          type="color"
          value={localColor}
          onInput={(e) => setLocalColor((e.target as HTMLInputElement).value)}
          onChange={(e) => onSave(dc.id, e.target.value)}
          className="w-10 h-10 rounded border cursor-pointer flex-shrink-0"
        />
        <div className="flex-1">
          <p className="font-semibold text-sm" style={{ color: "#0f2137" }}>{dc.departamento}</p>
          <p className="text-xs text-muted-foreground">{localColor}</p>
        </div>
        <div
          className="px-3 py-1 rounded-full text-xs font-semibold"
          style={{ backgroundColor: localColor, color: dc.text_color }}
        >
          Preview
        </div>
      </CardContent>
    </Card>
  );
}
