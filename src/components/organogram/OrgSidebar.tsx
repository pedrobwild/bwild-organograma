import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  Briefcase,
  Building2,
  CheckCircle2,
  User,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Colaborador } from "@/types/organogram";
import { getDeptColor } from "@/lib/deptColors";
import { getInitials } from "@/lib/organogram";

interface OrgSidebarProps {
  person: Colaborador;
  byId: Map<string, Colaborador>;
  onClose: () => void;
  onNavigate: (person: Colaborador) => void;
}

export function OrgSidebar({
  person,
  byId,
  onClose,
  onNavigate,
}: OrgSidebarProps) {
  const superior = person.superior ? byId.get(person.superior) : null;
  const subordinados = person.subordinados
    .map((id) => byId.get(id))
    .filter(Boolean) as Colaborador[];

  const colors = getDeptColor(person.departamento);
  const initials = getInitials(person.nome);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40"
        style={{ background: "rgba(5,15,30,0.6)", backdropFilter: "blur(4px)" }}
      />

      <motion.div
        initial={{ x: 420, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 420, opacity: 0 }}
        transition={{ type: "spring", damping: 32, stiffness: 320 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-[420px] z-50 flex flex-col"
        style={{
          background: "linear-gradient(180deg, #ffffff 0%, #f8f9fb 100%)",
          boxShadow: "-20px 0 60px -10px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header — fixed */}
        <div
          className="relative px-6 pt-6 pb-8 flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.bg}dd 100%)`,
          }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full text-white hover:bg-white/20 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>

          <div className="flex flex-col items-center text-center pt-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 ring-4 ring-white/20"
              style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
            >
              {person.foto ? (
                <img src={person.foto} alt={person.nome} className="w-full h-full rounded-2xl object-cover" />
              ) : (
                <span className="font-display font-bold text-2xl leading-none">{initials}</span>
              )}
            </div>

            <h2 className="font-display text-xl font-bold text-white">
              {person.nome}
            </h2>

            <p className="text-sm text-white/70 mt-1">{person.cargo}</p>

            <Badge
              variant="secondary"
              className="mt-3 gap-1.5 bg-white/15 text-white/90 border-none hover:bg-white/20"
            >
              <Building2 className="w-3 h-3" />
              {person.departamento}
            </Badge>
          </div>
        </div>

        {/* Content — scrollable */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6 space-y-6">
          {/* Responsabilidades */}
          <div>
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#7a8ca0" }}>
              <Briefcase className="w-3.5 h-3.5" />
              Responsabilidades
            </h3>

            <div className="space-y-2">
              {person.funcoes.map((funcao, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg"
                  style={{ background: "#f4f6f9" }}
                >
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.bg }} />
                  <span className="text-sm break-words min-w-0" style={{ color: "#374151" }}>{funcao}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Superior */}
          {superior && (
            <div>
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#7a8ca0" }}>
                <ArrowUpRight className="w-3.5 h-3.5" />
                Superior direto
              </h3>

              <button
                onClick={() => onNavigate(superior)}
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold"
                  style={{ backgroundColor: getDeptColor(superior.departamento).bg, color: "white" }}
                >
                  {getInitials(superior.nome)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "#0f2137" }}>{superior.nome}</p>
                  <p className="text-xs truncate" style={{ color: "#7a8ca0" }}>{superior.cargo}</p>
                </div>
              </button>
            </div>
          )}

          {/* Subordinados */}
          {subordinados.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#7a8ca0" }}>
                <ArrowDownRight className="w-3.5 h-3.5" />
                Liderados diretos
              </h3>

              <div className="space-y-2">
                {subordinados.map((subordinado) => (
                  <button
                    key={subordinado.id}
                    onClick={() => onNavigate(subordinado)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold"
                      style={{ backgroundColor: getDeptColor(subordinado.departamento).bg, color: "white" }}
                    >
                      {subordinado.nome === "A definir"
                        ? <User className="w-5 h-5" />
                        : getInitials(subordinado.nome)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "#0f2137" }}>
                        {subordinado.nome}
                      </p>
                      <p className="text-xs truncate" style={{ color: "#7a8ca0" }}>
                        {subordinado.cargo}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
