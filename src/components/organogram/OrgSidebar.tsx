import { useRef, useState, useEffect, useCallback } from "react";
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 20);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    return () => el.removeEventListener("scroll", checkScroll);
  }, [checkScroll, person.id]);


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
        <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth scrollbar-thin px-6 py-6 space-y-6 relative">
          {/* Responsabilidades */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#7a8ca0" }}>
              <Briefcase className="w-3.5 h-3.5" />
              Responsabilidades
            </h3>

            <div className="space-y-2">
              {person.funcoes.map((funcao, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.04, duration: 0.25 }}
                  className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg"
                  style={{ background: "#f4f6f9" }}
                >
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.bg }} />
                  <span className="text-sm break-words min-w-0" style={{ color: "#374151" }}>{funcao}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Superior */}
          {superior && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
            >
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
            </motion.div>
          )}

          {/* Subordinados */}
          {subordinados.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#7a8ca0" }}>
                <ArrowDownRight className="w-3.5 h-3.5" />
                Liderados diretos
              </h3>

              <div className="space-y-2">
                {subordinados.map((subordinado, i) => (
                  <motion.button
                    key={subordinado.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.04, duration: 0.25 }}
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
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={false}
          animate={{ opacity: canScrollDown ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none z-10"
          style={{
            background: "linear-gradient(to top, rgba(248,249,251,1) 0%, rgba(248,249,251,0) 100%)",
          }}
        >
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5">
            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              <ArrowDownRight className="w-4 h-4 rotate-45" style={{ color: "#7a8ca0" }} />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
