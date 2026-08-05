import { useRef, useState } from "react";
import { useDeleteRoute, useUploadRoute } from "../../hooks/useTrips";

interface RouteUploaderProps {
  tripId: string;
  hasRoute: boolean;
}

export default function RouteUploader({ tripId, hasRoute }: RouteUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadRoute = useUploadRoute(tripId);
  const deleteRoute = useDeleteRoute(tripId);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setError(null);
    setIsUploading(true);
    try {
      await uploadRoute.mutateAsync(file);
    } catch {
      setError("Could not import that route CSV.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete() {
    if (!window.confirm("Remove the driven route from this trip?")) return;
    await deleteRoute.mutateAsync();
  }

  return (
    <div className="route-uploader">
      <label className="route-uploader-label">
        {isUploading ? "Importing..." : hasRoute ? "Replace route" : "+ Add route"}
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          disabled={isUploading}
          onChange={(e) => handleFile(e.target.files)}
        />
      </label>
      {hasRoute && (
        <button
          type="button"
          className="route-uploader-remove"
          onClick={handleDelete}
          disabled={deleteRoute.isPending}
        >
          Remove
        </button>
      )}
      {error && (
        <span className="form-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
