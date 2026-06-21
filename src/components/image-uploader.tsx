import { useEffect, useRef, useState } from "react";
import { Loader2, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Props = {
  bucket: string;
  folder?: string;
  value: string | null;
  onChange: (path: string | null) => void;
  label?: string;
  maxSizeMb?: number;
};

/**
 * Reusable image uploader matching the categories page UX.
 * Stores the storage path on the parent form via onChange.
 */
export function ImageUploader({
  bucket,
  folder,
  value,
  onChange,
  label = "Imagem",
  maxSizeMb = 5,
}: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value) { setPreviewUrl(null); return; }
    let cancel = false;
    (async () => {
      const { data } = await supabase.storage.from(bucket).createSignedUrl(value, 3600);
      if (!cancel) setPreviewUrl(data?.signedUrl ?? null);
    })();
    return () => { cancel = true; };
  }, [value, bucket]);

  const handleUpload = async (file: File) => {
    if (file.size > maxSizeMb * 1024 * 1024) {
      toast.error(`Imagem deve ter no máximo ${maxSizeMb} MB`);
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${folder ? folder.replace(/\/$/, "") + "/" : ""}${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      if (error) throw error;
      if (value) await supabase.storage.from(bucket).remove([value]).catch(() => {});
      onChange(path);
      toast.success("Imagem enviada");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-3">
        {previewUrl ? (
          <img src={previewUrl} alt="preview" className="h-24 w-24 rounded border object-cover" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded border bg-muted">
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {value ? "Trocar imagem" : "Enviar imagem"}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={async () => {
                await supabase.storage.from(bucket).remove([value]).catch(() => {});
                onChange(null);
              }}
            >
              Remover
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">JPG, PNG ou WebP até {maxSizeMb} MB.</p>
    </div>
  );
}

/**
 * Hook to resolve a list of storage paths to short-lived signed URLs.
 * Returns a map from path -> signed url.
 */
export function useSignedUrlsMap(bucket: string, paths: (string | null | undefined)[]) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = paths.filter(Boolean).join("|");
  useEffect(() => {
    const list = paths.filter((p): p is string => !!p);
    if (list.length === 0) { setUrls({}); return; }
    let cancel = false;
    (async () => {
      const { data } = await supabase.storage.from(bucket).createSignedUrls(list, 3600);
      if (cancel || !data) return;
      const map: Record<string, string> = {};
      data.forEach((d) => { if (d.path && d.signedUrl) map[d.path] = d.signedUrl; });
      setUrls(map);
    })();
    return () => { cancel = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucket, key]);
  return urls;
}
