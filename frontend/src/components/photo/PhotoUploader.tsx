import { useRef, useState } from "react";
import { useUploadPhoto } from "../../hooks/usePhotos";

interface PhotoUploaderProps {
  tripId: string;
}

export default function PhotoUploader({ tripId }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadPhoto = useUploadPhoto(tripId);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    setIsUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        await uploadPhoto.mutateAsync(file);
      }
    } catch {
      setError("Some photos failed to upload.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="photo-uploader">
      <label className="photo-uploader-label">
        {isUploading ? "Uploading..." : "Add photos"}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          disabled={isUploading}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>
      {error && (
        <span className="form-error" role="alert">
          {error}
        </span>
      )}
      <p className="photo-uploader-hint">
        On Android, you can also share photos straight from your Gallery or Camera app into Camping Logbook.
      </p>
    </div>
  );
}
