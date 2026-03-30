import { Label } from "@/components/ui/label";

interface FieldRowProps {
  label: string;
  span?: number;
  children: React.ReactNode;
}

export function FieldRow({ label, span, children }: FieldRowProps) {
  return (
    <div className={`space-y-1.5 ${span === 2 ? "col-span-2" : ""}`}>
      <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</Label>
      {children}
    </div>
  );
}

interface ReadOnlyFieldProps {
  label: string;
  value: string | null | undefined;
  span?: number;
}

export function ReadOnlyField({ label, value, span }: ReadOnlyFieldProps) {
  return (
    <div className={`space-y-1 ${span === 2 ? "col-span-2" : ""}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-sm text-slate-700">{value || "—"}</p>
    </div>
  );
}
