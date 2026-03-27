import { motion } from "framer-motion";
import { X, User, ArrowUpRight, ArrowDownRight, Briefcase, CheckCircle2, Building2 } from "lucide-react";
import { Colaborador } from "./OrgChart";
import { getDeptColor } from "@/lib/deptColors";

interface PersonDetailProps {
  person: Colaborador;
  byId: Map<string, Colaborador>;
  onClose: () => void;
  onNavigate: (p: Colaborador) => void;
}

export function PersonDetail({ person, byId, onClose, onNavigate }: PersonDetailProps) {
  const superior = person.superior ? byId.get(person.superior) : null;
  const subordinados = person.subordinados
    .map((id) => byId.get(id))
    .filter(Boolean) as Colaborador[];
  const colors = getDeptColor(person.departamento);

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
        className="fixed right-0 top-0 bottom-0 w-full max-w-[420px] z-50 overflow-y-auto"
        style={{
          background: "linear-gradient(180deg, #ffffff 0%, #f8f9fb 100%)",
          boxShadow: "-20px 0 60px -10px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header with dept color */}
        <div
          className="relative px-6 pt-6 pb-8"
          style={{
            background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.bg}dd 100%)`,
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col items-center text-center pt-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
            >
              <User className="w-9 h-9" />
            </div>
            <h2 className="font-display text-xl font-bold text-white">
              {person.nome}
            </h2>
            <p className="text-sm text-white/70 mt-1">{person.cargo}</p>
            <div className="flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }}>
              <Building2 className="w-3 h-3 text-white/70" />
              <span className="text-[11px] font-semibold text-white/90">{person.departamento}</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Funções */}
          <div>
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#7a8ca0" }}>
              <Briefcase className="w-3.5 h-3.5" />
              Responsabilidades
            </h3>
            <div className="space-y-2">
              {person.funcoes.map((f, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg"
                  style={{ background: "#f4f6f9" }}
                >
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.bg }} />
                  <span className="text-sm" style={{ color: "#374151" }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Superior */}
          {superior && (
            <div>
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#7a8ca0" }}>
                <ArrowUpRight className="w-3.5 h-3.5" />
                Reporta a
              </h3>
              <button
                onClick={() => onNavigate(superior)}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:shadow-md"
                style={{ background: "#f4f6f9", border: "1px solid #e8ecf1" }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: getDeptColor(superior.departamento).bg, color: "white" }}
                >
                  <User className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold" style={{ color: "#0f2137" }}>{superior.nome}</p>
                  <p className="text-xs" style={{ color: "#7a8ca0" }}>{superior.cargo}</p>
                </div>
              </button>
            </div>
          )}

          {/* Subordinados */}
          {subordinados.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#7a8ca0" }}>
                <ArrowDownRight className="w-3.5 h-3.5" />
                Equipe direta ({subordinados.length})
              </h3>
              <div className="space-y-2">
                {subordinados.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => onNavigate(sub)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:shadow-md"
                    style={{ background: "#f4f6f9", border: "1px solid #e8ecf1" }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: getDeptColor(sub.departamento).bg, color: "white" }}
                    >
                      <User className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold" style={{ color: "#0f2137" }}>{sub.nome}</p>
                      <p className="text-xs" style={{ color: "#7a8ca0" }}>{sub.cargo}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer info */}
          <div className="pt-4" style={{ borderTop: "1px solid #e8ecf1" }}>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: "#7a8ca0" }}>Nível hierárquico</span>
              <span
                className="font-display font-bold px-2.5 py-0.5 rounded-md"
                style={{ background: colors.light, color: colors.bg }}
              >
                {person.nivel}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
