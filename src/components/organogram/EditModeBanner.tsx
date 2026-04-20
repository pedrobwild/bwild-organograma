import { motion } from "framer-motion";
import { GitBranch, X, MousePointer2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditModeBannerProps {
  onExit: () => void;
}

export function EditModeBanner({ onExit }: EditModeBannerProps) {
  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -40, opacity: 0 }}
      transition={{ type: "spring", damping: 24, stiffness: 280 }}
      className="absolute top-14 left-0 right-0 z-25 pointer-events-none"
    >
      <div
        className="mx-auto max-w-[1600px] px-4 py-2 flex items-center gap-3 pointer-events-auto"
        style={{
          background: "linear-gradient(90deg, rgba(245,158,11,0.95), rgba(217,119,6,0.95))",
          borderBottom: "1px solid rgba(0,0,0,0.1)",
          boxShadow: "0 6px 20px -6px rgba(245,158,11,0.4)",
        }}
      >
        <div className="flex items-center gap-2 text-white">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
            <GitBranch className="w-3.5 h-3.5" />
          </div>
          <div className="leading-tight">
            <p className="text-xs font-bold">Modo de edição da estrutura</p>
            <p className="text-[10px] text-white/85 flex items-center gap-1">
              <MousePointer2 className="w-2.5 h-2.5" />
              Arraste um card sobre outro para definir o novo superior
            </p>
          </div>
        </div>

        <div className="flex-1" />

        <Button
          size="sm"
          variant="ghost"
          onClick={onExit}
          className="h-7 text-white hover:bg-white/15 text-[11px] gap-1.5"
        >
          <X className="w-3 h-3" />
          Sair do modo edição
        </Button>
      </div>
    </motion.div>
  );
}
