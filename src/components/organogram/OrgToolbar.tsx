import { ZoomIn, ZoomOut, Maximize } from "lucide-react";

interface OrgToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export function OrgToolbar({ zoom, onZoomIn, onZoomOut, onReset }: OrgToolbarProps) {
  const actions = [
    { icon: ZoomIn, action: onZoomIn, label: "Zoom in" },
    { icon: ZoomOut, action: onZoomOut, label: "Zoom out" },
    { icon: Maximize, action: onReset, label: "Reset" },
  ];

  return (
    <div className="absolute bottom-6 left-6 z-30 flex flex-col gap-1.5">
      {actions.map(({ icon: Icon, action, label }) => (
        <button
          key={label}
          onClick={action}
          title={label}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105"
          style={{
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "white",
          }}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
      <div
        className="text-center text-[10px] font-semibold mt-1 rounded-lg py-1"
        style={{ color: "rgba(255,255,255,0.6)" }}
      >
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
