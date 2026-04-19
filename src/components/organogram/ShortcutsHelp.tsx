import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Keyboard } from "lucide-react";

const SHORTCUTS: { key: string; description: string }[] = [
  { key: "⌘ K / Ctrl K", description: "Abrir paleta de comandos" },
  { key: "/", description: "Focar na busca" },
  { key: "+", description: "Aumentar zoom" },
  { key: "−", description: "Diminuir zoom" },
  { key: "0", description: "Resetar a visualização" },
  { key: "F", description: "Alternar tela cheia" },
  { key: "T", description: "Visualização em árvore (vertical)" },
  { key: "H", description: "Visualização em árvore (horizontal)" },
  { key: "L", description: "Visualização em lista" },
  { key: "D", description: "Alternar densidade" },
  { key: "Esc", description: "Fechar painel aberto" },
  { key: "?", description: "Mostrar esta ajuda" },
];

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleShow = () => setOpen(true);
    window.addEventListener("bwild:show-shortcuts", handleShow);
    return () => window.removeEventListener("bwild:show-shortcuts", handleShow);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement | null)?.tagName === "INPUT" ||
        (e.target as HTMLElement | null)?.tagName === "TEXTAREA"
      ) {
        return;
      }
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[60]"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: "spring", damping: 24, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-[92vw] max-w-[520px] rounded-2xl bg-white shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-semibold text-slate-900">Atalhos de teclado</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 grid grid-cols-1 gap-2">
              {SHORTCUTS.map((s) => (
                <div
                  key={s.key}
                  className="flex items-center justify-between text-sm py-1.5"
                >
                  <span className="text-slate-700">{s.description}</span>
                  <kbd className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-600 font-medium">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 bg-slate-50 border-t text-[11px] text-slate-500 text-center">
              Pressione{" "}
              <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-white font-mono text-[10px]">
                ?
              </kbd>{" "}
              a qualquer momento para abrir esta ajuda
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}