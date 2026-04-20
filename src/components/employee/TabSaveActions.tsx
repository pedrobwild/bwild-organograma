import { Button } from "@/components/ui/button";

interface TabSaveActionsProps {
  onSave: () => void;
  saving?: boolean;
  label?: string;
}

export function TabSaveActions({
  onSave,
  saving = false,
  label = "Salvar alterações",
}: TabSaveActionsProps) {
  return (
    <div className="sticky bottom-0 pt-4">
      <div className="flex justify-end border-t border-border bg-background/95 pt-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <Button type="button" onClick={onSave} disabled={saving}>
          {saving ? "Salvando..." : label}
        </Button>
      </div>
    </div>
  );
}
