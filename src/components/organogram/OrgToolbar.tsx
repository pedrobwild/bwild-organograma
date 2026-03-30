import { useCallback } from "react";
import {
  Download,
  List,
  Maximize,
  Maximize2,
  Minimize,
  Network,
  Search,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface OrgToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  showDesligados: boolean;
  onToggleDesligados: (v: boolean) => void;
  viewMode: "tree" | "list";
  onViewModeChange: (v: "tree" | "list") => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  chartRef: React.RefObject<HTMLDivElement>;
}

export function OrgToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  searchQuery,
  onSearchChange,
  showDesligados,
  onToggleDesligados,
  viewMode,
  onViewModeChange,
  isFullscreen,
  onToggleFullscreen,
  chartRef,
}: OrgToolbarProps) {
  const handleExport = useCallback(async () => {
    const el = chartRef.current;
    if (!el) return;
    try {
      toast.info("Gerando imagem...");
      const dataUrl = await toPng(el, {
        backgroundColor: "#0a1e3c",
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = "organograma-bwild.png";
      link.href = dataUrl;
      link.click();
      toast.success("Imagem exportada!");
    } catch {
      toast.error("Erro ao exportar imagem.");
    }
  }, [chartRef]);

  return (
    <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
      <div
        className="mx-auto max-w-[1600px] px-4 py-3 flex items-center gap-3 flex-wrap pointer-events-auto"
        style={{
          background: "rgba(10,30,60,0.65)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Sidebar trigger */}
        <SidebarTrigger className="text-white/60 hover:text-white hover:bg-white/10 flex-shrink-0" />

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar colaborador..."
            className="pl-9 h-8 text-xs bg-white/8 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20"
          />
        </div>

        {/* Desligados toggle */}
        <div className="flex items-center gap-2">
          <Switch
            checked={showDesligados}
            onCheckedChange={onToggleDesligados}
            className="data-[state=checked]:bg-white/20 h-5 w-9"
          />
          <Label className="text-[11px] text-white/50 font-medium cursor-pointer whitespace-nowrap">
            Desligados
          </Label>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* View toggle */}
        <div
          className="flex items-center gap-0.5 p-0.5 rounded-lg"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          <button
            onClick={() => onViewModeChange("tree")}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all",
              viewMode === "tree"
                ? "bg-white/15 text-white"
                : "text-white/40 hover:text-white/60"
            )}
          >
            <Network className="w-3 h-3" />
            Árvore
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all",
              viewMode === "list"
                ? "bg-white/15 text-white"
                : "text-white/40 hover:text-white/60"
            )}
          >
            <List className="w-3 h-3" />
            Lista
          </button>
        </div>

        {/* Zoom controls */}
        <div
          className="flex items-center gap-0.5 p-0.5 rounded-lg"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={onZoomOut}
            className="w-7 h-7 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <span className="text-[10px] font-semibold text-white/45 w-8 text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onZoomIn}
            className="w-7 h-7 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onReset}
            className="w-7 h-7 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Fullscreen */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleFullscreen}
          className="w-7 h-7 text-white/60 hover:bg-white/10 hover:text-white"
          title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
        >
          {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
        </Button>

        {/* Export */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleExport}
          className="w-7 h-7 text-white/60 hover:bg-white/10 hover:text-white"
          title="Exportar como PNG"
        >
          <Download className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
