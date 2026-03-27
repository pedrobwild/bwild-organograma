import { motion } from "framer-motion";
import { X, User, ArrowUp, ArrowDown, Briefcase, CheckCircle2 } from "lucide-react";
import { Colaborador, getDeptClass } from "./OrgChart";

interface PersonDetailProps {
  person: Colaborador;
  byId: Map<string, Colaborador>;
  onClose: () => void;
}

export function PersonDetail({ person, byId, onClose }: PersonDetailProps) {
  const superior = person.superior ? byId.get(person.superior) : null;
  const subordinados = person.subordinados
    .map((id) => byId.get(id))
    .filter(Boolean) as Colaborador[];
  const deptClass = getDeptClass(person.departamento);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
      />

      {/* Panel */}
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border z-50 overflow-y-auto"
      >
        <div className="p-6">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Avatar & info */}
          <div className="flex flex-col items-center text-center mt-4">
            <div
              className={`w-20 h-20 rounded-2xl flex items-center justify-center bg-dept-${deptClass.replace("dept-", "")}/15 text-dept-${deptClass.replace("dept-", "")} mb-4`}
            >
              <User className="w-8 h-8" />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground">
              {person.nome}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{person.cargo}</p>
            <span
              className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-dept-${deptClass.replace("dept-", "")}/15 text-dept-${deptClass.replace("dept-", "")}`}
            >
              {person.departamento}
            </span>
          </div>

          {/* Funções */}
          <div className="mt-8">
            <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <Briefcase className="w-4 h-4 text-primary" />
              Funções & Responsabilidades
            </h3>
            <ul className="space-y-2">
              {person.funcoes.map((f, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-secondary-foreground"
                >
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Superior */}
          {superior && (
            <div className="mt-6">
              <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <ArrowUp className="w-4 h-4 text-primary" />
                Reporta a
              </h3>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary border border-border">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{superior.nome}</p>
                  <p className="text-xs text-muted-foreground">{superior.cargo}</p>
                </div>
              </div>
            </div>
          )}

          {/* Subordinados */}
          {subordinados.length > 0 && (
            <div className="mt-6">
              <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <ArrowDown className="w-4 h-4 text-primary" />
                Subordinados ({subordinados.length})
              </h3>
              <div className="space-y-2">
                {subordinados.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary border border-border"
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{sub.nome}</p>
                      <p className="text-xs text-muted-foreground">{sub.cargo}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nível */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Nível hierárquico</span>
              <span className="font-display font-semibold text-foreground">{person.nivel}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
