import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GitBranch, Palette, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Colaborador } from "@/types/organogram";
import { getDeptColor } from "@/lib/deptColors";
import { getInitials } from "@/lib/organogram";
import { useColaboradorFull } from "@/hooks/use-hr-data";
import { useUpdateColaborador } from "@/hooks/use-colaboradores";
import { useAuth } from "@/hooks/use-auth";

import { TabDadosPessoais } from "./tabs/TabDadosPessoais";
import { TabDadosProfissionais } from "./tabs/TabDadosProfissionais";
import { TabJobDescription } from "./tabs/TabJobDescription";
import { TabRemuneracao } from "./tabs/TabRemuneracao";
import { TabDocumentos } from "./tabs/TabDocumentos";
import { TabHistorico } from "./tabs/TabHistorico";
import { TabDadosBancarios } from "./tabs/TabDadosBancarios";
import { TabOnboarding } from "./tabs/TabOnboarding";
import { EmployeeActions } from "./EmployeeActions";
import { ExtraLeadersManager } from "./ExtraLeadersManager";
import { HierarchyEditDialog } from "@/components/organogram/HierarchyEditDialog";

interface EmployeeDrawerProps {
  person: Colaborador;
  allColaboradores: Colaborador[];
  onClose: () => void;
}

const PRESET_SWATCHES = [
  "#1B4F72", // azul profundo
  "#1A5276", // azul aço
  "#2874A6", // azul médio
  "#117A65", // verde esmeralda
  "#148F77", // verde teal
  "#B9770E", // âmbar
  "#CA6F1E", // laranja queimado
  "#922B21", // vinho
  "#6C3483", // roxo
  "#34495E", // grafite
  "#7B7D7D", // cinza neutro
  "#0E6655", // verde floresta
];

export function EmployeeDrawer({ person, allColaboradores, onClose }: EmployeeDrawerProps) {
  const { isAdmin } = useAuth();
  const [editing, setEditing] = useState(false);
  const [showHierarchyEdit, setShowHierarchyEdit] = useState(false);
  const { data: fullData, isLoading } = useColaboradorFull(person.id);
  const updateColab = useUpdateColaborador();
  const deptColors = getDeptColor(person.departamento);
  const customBg = person.cor_card?.trim() || null;
  const colors = customBg ? { ...deptColors, bg: customBg } : deptColors;
  const initials = getInitials(person.nome);
  const [pickerColor, setPickerColor] = useState(customBg || deptColors.bg);

  const status = fullData?.status ?? "ativo";

  const handleSaveColor = async (bg: string | null) => {
    try {
      await updateColab.mutateAsync({ id: person.id, cor_card: bg });
      toast.success(bg ? "Cor do card atualizada!" : "Cor do card resetada para o padrão do departamento.");
    } catch (err: any) {
      toast.error(`Erro ao salvar cor: ${err?.message ?? "desconhecido"}`);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40"
        style={{ background: "rgba(5,15,30,0.6)", backdropFilter: "blur(4px)" }}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: 740, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 740, opacity: 0 }}
        transition={{ type: "spring", damping: 32, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-[720px] z-50 flex flex-col bg-card shadow-2xl md:max-w-[720px]"
      >
        {/* Header */}
        <div
          className="relative px-8 pt-6 pb-6 flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.bg}cc 100%)`,
          }}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {isAdmin && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHierarchyEdit(true)}
                  className="text-white/80 hover:text-white hover:bg-white/15 text-xs gap-1"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  Hierarquia
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white/80 hover:text-white hover:bg-white/15 text-xs gap-1"
                    >
                      <Palette className="w-3.5 h-3.5" />
                      Cor do card
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-4 z-[60]" align="end" sideOffset={8}>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-card-foreground">Cor do card</p>
                        <p className="text-xs text-muted-foreground">Personalize a cor deste colaborador no organograma.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={pickerColor}
                          onChange={(e) => setPickerColor(e.target.value)}
                          className="w-12 h-10 rounded border cursor-pointer flex-shrink-0"
                        />
                        <input
                          type="text"
                          value={pickerColor}
                          onChange={(e) => setPickerColor(e.target.value)}
                          className="flex-1 h-10 px-2 rounded border text-xs font-mono bg-background text-foreground"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Paleta sugerida</p>
                        <div className="grid grid-cols-6 gap-1.5">
                          {PRESET_SWATCHES.map((swatch) => {
                            const isActive = pickerColor.toLowerCase() === swatch.toLowerCase();
                            return (
                              <button
                                key={swatch}
                                type="button"
                                onClick={() => setPickerColor(swatch)}
                                title={swatch}
                                className={`w-full aspect-square rounded-md border-2 transition-transform hover:scale-110 ${isActive ? "border-foreground ring-2 ring-foreground/20" : "border-border"}`}
                                style={{ background: swatch }}
                              />
                            );
                          })}
                        </div>
                      </div>
                      <div
                        className="rounded-lg p-3 text-xs font-medium text-white text-center"
                        style={{ background: pickerColor }}
                      >
                        Pré-visualização
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1" onClick={() => handleSaveColor(pickerColor)} disabled={updateColab.isPending}>
                          Salvar
                        </Button>
                        {customBg && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPickerColor(deptColors.bg);
                              handleSaveColor(null);
                            }}
                            disabled={updateColab.isPending}
                            title="Resetar para cor do departamento"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing((p) => !p)}
                  className="text-white/80 hover:text-white hover:bg-white/15 text-xs"
                >
                  {editing ? "Cancelar edição" : "Editar"}
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="w-8 h-8 rounded-full text-white hover:bg-white/20 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-5">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center ring-4 ring-white/20 flex-shrink-0 overflow-hidden"
              style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
            >
              {person.foto ? (
                <img src={person.foto} alt={person.nome} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <span className="font-display font-bold text-2xl">{initials}</span>
              )}
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-white">{person.nome}</h2>
              <p className="text-sm text-white/70 mt-0.5">{person.cargo} · {person.departamento}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  className={
                    status === "ativo"
                      ? "bg-emerald-500/20 text-emerald-100 border-emerald-400/30 hover:bg-emerald-500/30"
                      : "bg-red-500/20 text-red-100 border-red-400/30 hover:bg-red-500/30"
                  }
                >
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === "ativo" ? "bg-emerald-400" : "bg-red-400"}`} />
                  {status === "ativo" ? "Ativo" : "Desligado"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-sm text-muted-foreground">Carregando dados...</p>
            </div>
          ) : (
            <Tabs defaultValue="jd" className="h-full flex flex-col">
              <div className="px-8 pt-4">
                <ExtraLeadersManager person={person} allColaboradores={allColaboradores} isAdmin={isAdmin} />
              </div>
              <TabsList className="mx-8 mt-4 mb-0 justify-start bg-slate-100 p-1 rounded-xl flex-shrink-0 flex-wrap">
                <TabsTrigger value="jd" className="text-xs rounded-lg">Descrição de Cargo</TabsTrigger>
                <TabsTrigger value="pessoais" className="text-xs rounded-lg">Pessoais</TabsTrigger>
                <TabsTrigger value="profissionais" className="text-xs rounded-lg">Profissionais</TabsTrigger>
                <TabsTrigger value="remuneracao" className="text-xs rounded-lg">Remuneração</TabsTrigger>
                <TabsTrigger value="documentos" className="text-xs rounded-lg">Documentos</TabsTrigger>
                <TabsTrigger value="historico" className="text-xs rounded-lg">Histórico</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto px-8 py-6">
                <TabsContent value="jd" className="mt-0">
                  <TabJobDescription data={fullData} person={person} editing={editing} colaboradorId={person.id} />
                </TabsContent>
                <TabsContent value="pessoais" className="mt-0">
                  <TabDadosPessoais data={fullData} editing={editing} colaboradorId={person.id} />
                </TabsContent>
                <TabsContent value="profissionais" className="mt-0">
                  <TabDadosProfissionais data={fullData} person={person} editing={editing} colaboradorId={person.id} allColaboradores={allColaboradores} />
                </TabsContent>
                <TabsContent value="remuneracao" className="mt-0">
                  <TabRemuneracao data={fullData} editing={editing} colaboradorId={person.id} isAdmin={isAdmin} />
                </TabsContent>
                <TabsContent value="documentos" className="mt-0">
                  <TabDocumentos colaboradorId={person.id} isAdmin={isAdmin} />
                </TabsContent>
                <TabsContent value="historico" className="mt-0">
                  <TabHistorico colaboradorId={person.id} />
                </TabsContent>
                <TabsContent value="bancarios" className="mt-0">
                  <TabDadosBancarios data={fullData} editing={editing} colaboradorId={person.id} />
                </TabsContent>
                <TabsContent value="onboarding" className="mt-0">
                  <TabOnboarding colaboradorId={person.id} isAdmin={isAdmin} dataInicio={fullData?.data_inicio} />
                </TabsContent>
              </div>
            </Tabs>
          )}
        </div>

        {/* Bottom actions */}
        {isAdmin && fullData && (
          <EmployeeActions
            colaboradorId={person.id}
            status={status}
            editing={editing}
            data={fullData}
            onClose={onClose}
          />
        )}
      </motion.div>

      {/* Hierarchy edit dialog */}
      <AnimatePresence>
        {showHierarchyEdit && (
          <HierarchyEditDialog
            person={person}
            allColaboradores={allColaboradores}
            onClose={() => setShowHierarchyEdit(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}