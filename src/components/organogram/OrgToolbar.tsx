import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrgToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export function OrgToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
}: OrgToolbarProps) {
  return (
    <div className="absolute bottom-6 left-6 z-30 flex flex-col items-center gap-1">
      <div
        className="flex flex-col gap-1 rounded-xl p-1"
        style={{
          background: "rgba(255,255,255,0.12)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomIn}
          title="Zoom in"
          className="w-9 h-9 text-white hover:bg-white/15 hover:text-white"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomOut}
          title="Zoom out"
          className="w-9 h-9 text-white hover:bg-white/15 hover:text-white"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onReset}
          title="Reset view"
          className="w-9 h-9 text-white hover:bg-white/15 hover:text-white"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>

      <span
        className="text-[10px] font-semibold rounded-md py-0.5 px-2"
        style={{ color: "rgba(255,255,255,0.55)" }}
      >
        {Math.round(zoom * 100)}%
      </span>
    </div>
  );
}
