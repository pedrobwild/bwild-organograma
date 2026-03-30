import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDocumentos, useUploadDocumento, useDeleteDocumento } from "@/hooks/use-hr-data";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, FileText, Trash2, Upload } from "lucide-react";

const DOC_TIPOS = ["Contrato de Trabalho", "Distrato", "Aditivo Contratual", "Advertência", "Elogio", "Atestado", "Outros"];

interface Props {
  colaboradorId: string;
  isAdmin: boolean;
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function TabDocumentos({ colaboradorId, isAdmin }: Props) {
  const { user } = useAuth();
  const { data: docs = [], isLoading } = useDocumentos(colaboradorId);
  const uploadDoc = useUploadDocumento();
  const deleteDoc = useDeleteDocumento();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({ tipo: "", descricao: "", data: "" });
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!selectedFile || !uploadForm.tipo) { toast.error("Selecione um arquivo e tipo."); return; }
    try {
      await uploadDoc.mutateAsync({
        colaboradorId,
        file: selectedFile,
        tipo: uploadForm.tipo,
        descricao: uploadForm.descricao || undefined,
        dataDocumento: uploadForm.data || undefined,
        userId: user?.id,
      });
      toast.success("Documento enviado!");
      setUploadOpen(false);
      setSelectedFile(null);
      setUploadForm({ tipo: "", descricao: "", data: "" });
    } catch { toast.error("Erro ao enviar documento."); }
  };

  const handleDownload = async (storagePath: string, fileName: string) => {
    const { data, error } = await supabase.storage.from("documentos").download(storagePath);
    if (error || !data) { toast.error("Erro ao baixar arquivo."); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string, storagePath: string) => {
    if (!confirm("Tem certeza que deseja excluir este documento?")) return;
    try {
      await deleteDoc.mutateAsync({ id, storagePath, colaboradorId });
      toast.success("Documento excluído!");
    } catch { toast.error("Erro ao excluir documento."); }
  };

  // Group by tipo
  const grouped: Record<string, any[]> = {};
  docs.forEach((d: any) => {
    if (!grouped[d.tipo]) grouped[d.tipo] = [];
    grouped[d.tipo].push(d);
  });

  const contrato = grouped["Contrato de Trabalho"];
  const distrato = grouped["Distrato"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Documentos</h3>
        {isAdmin && (
          <Button size="sm" variant="outline" onClick={() => setUploadOpen(p => !p)}>
            <Upload className="w-3.5 h-3.5 mr-1" /> Upload
          </Button>
        )}
      </div>

      {/* Upload form */}
      {uploadOpen && (
        <div className="p-4 bg-slate-50 rounded-lg space-y-3 border">
          <div className="grid grid-cols-2 gap-3">
            <Select value={uploadForm.tipo} onValueChange={(v) => setUploadForm(p => ({ ...p, tipo: v }))}>
              <SelectTrigger><SelectValue placeholder="Tipo do documento" /></SelectTrigger>
              <SelectContent>{DOC_TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="date" value={uploadForm.data} onChange={(e) => setUploadForm(p => ({ ...p, data: e.target.value }))} />
          </div>
          <Input placeholder="Descrição (opcional)" value={uploadForm.descricao} onChange={(e) => setUploadForm(p => ({ ...p, descricao: e.target.value }))} />
          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
              {selectedFile ? selectedFile.name : "Selecionar arquivo"}
            </Button>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
            <Button size="sm" onClick={handleUpload} disabled={uploadDoc.isPending}>
              {uploadDoc.isPending ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </div>
      )}

      {/* Special highlights */}
      {(contrato || distrato) && (
        <div className="grid grid-cols-2 gap-3">
          {contrato && (
            <div className="p-3 border-2 border-emerald-200 bg-emerald-50 rounded-lg">
              <p className="text-xs font-bold text-emerald-700 uppercase mb-1">Contrato de Trabalho</p>
              <p className="text-sm">{contrato[0].nome_arquivo}</p>
              <button onClick={() => handleDownload(contrato[0].storage_path, contrato[0].nome_arquivo)} className="text-xs text-emerald-600 hover:underline mt-1 flex items-center gap-1">
                <Download className="w-3 h-3" /> Baixar
              </button>
            </div>
          )}
          {distrato && (
            <div className="p-3 border-2 border-red-200 bg-red-50 rounded-lg">
              <p className="text-xs font-bold text-red-700 uppercase mb-1">Distrato</p>
              <p className="text-sm">{distrato[0].nome_arquivo}</p>
              <button onClick={() => handleDownload(distrato[0].storage_path, distrato[0].nome_arquivo)} className="text-xs text-red-600 hover:underline mt-1 flex items-center gap-1">
                <Download className="w-3 h-3" /> Baixar
              </button>
            </div>
          )}
        </div>
      )}

      {/* All documents */}
      {isLoading ? (
        <p className="text-xs text-muted-foreground">Carregando...</p>
      ) : docs.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum documento encontrado.</p>
      ) : (
        Object.entries(grouped).map(([tipo, items]) => (
          <div key={tipo}>
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">{tipo}</p>
            <div className="space-y-1.5">
              {items.map((doc: any) => (
                <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-lg border bg-white hover:bg-slate-50 transition-colors">
                  <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{doc.nome_arquivo}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.data_documento ? new Date(doc.data_documento).toLocaleDateString("pt-BR") : ""} · {formatBytes(doc.tamanho_bytes)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(doc.storage_path, doc.nome_arquivo)}>
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                    {isAdmin && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(doc.id, doc.storage_path)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
