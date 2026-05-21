import { useEffect, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "./Button";

interface ImageUploadProps {
  label?: string;
  accept?: string;
  currentImageUrl?: string;
  onFileChange?: (file: File | null) => void;
  helperText?: string;
}

export function ImageUpload({
  label = "Upload image",
  accept = "image/*",
  currentImageUrl,
  onFileChange,
  helperText,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentImageUrl) return;
    setPreview(currentImageUrl);
  }, [currentImageUrl]);

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith("blob:")) {
        window.URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    if (!selectedFile) {
      setPreview(currentImageUrl || null);
      setFileName(null);
      onFileChange?.(null);
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, JPEG, or GIF). ");
      event.target.value = "";
      return;
    }

    const previewUrl = window.URL.createObjectURL(selectedFile);
    setPreview(previewUrl);
    setFileName(selectedFile.name);
    onFileChange?.(selectedFile);
  };

  const handleRemove = () => {
    setPreview(currentImageUrl || null);
    setFileName(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onFileChange?.(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-700">{label}</p>
          {helperText ? <p className="text-xs text-slate-500">{helperText}</p> : null}
        </div>
        <Button type="button" onClick={() => inputRef.current?.click()} className="bg-slate-900 text-white text-sm rounded-xl px-4 py-2">
          <Upload className="w-4 h-4" />
          Browse image
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
        {preview ? (
          <div className="flex flex-col gap-3">
            <img src={preview} alt="Selected" className="h-40 w-full rounded-2xl object-cover border border-slate-200" />
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">{fileName || "Selected image"}</p>
                <p className="text-xs text-slate-500">Accepted formats: PNG, JPG, JPEG, GIF</p>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-3.5 h-3.5" /> Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            <p className="text-sm font-semibold">No image selected yet</p>
            <p className="text-xs text-slate-400">Choose an image file to preview it here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
