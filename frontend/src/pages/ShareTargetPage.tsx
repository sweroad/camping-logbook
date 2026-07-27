import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUploadPhoto } from "../hooks/usePhotos";
import { useTrips } from "../hooks/useTrips";
import { deleteSharedFiles, getSharedFiles } from "../shareTargetDb";

export default function ShareTargetPage() {
  const [searchParams] = useSearchParams();
  const batchId = searchParams.get("batch");
  const navigate = useNavigate();

  const [files, setFiles] = useState<File[] | null>(null);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: tripsData } = useTrips({ limit: 50 });
  const uploadPhoto = useUploadPhoto(selectedTripId);

  useEffect(() => {
    let cancelled = false;
    if (!batchId) {
      setFiles([]);
      return;
    }
    getSharedFiles(batchId).then((stored) => {
      if (!cancelled) setFiles(stored ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [batchId]);

  const previews = useMemo(() => (files ?? []).map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  async function handleAttach() {
    if (!batchId || !selectedTripId || !files || files.length === 0) return;
    setError(null);
    setIsUploading(true);
    try {
      for (const file of files) {
        await uploadPhoto.mutateAsync(file);
      }
      await deleteSharedFiles(batchId);
      navigate(`/trips/${selectedTripId}`, { replace: true });
    } catch {
      setError("Some photos failed to upload.");
    } finally {
      setIsUploading(false);
    }
  }

  if (files === null) {
    return <p>Loading shared photos...</p>;
  }

  if (files.length === 0) {
    return (
      <div className="share-target-page">
        <h1>Shared photos</h1>
        <p>No shared photos found. Share photos from your gallery into Camping Logbook to see them here.</p>
      </div>
    );
  }

  return (
    <div className="share-target-page">
      <h1>Add shared photos to a trip</h1>
      <div className="photo-gallery">
        {previews.map((p) => (
          <div key={p.url} className="photo-gallery-item">
            <img src={p.url} alt={p.file.name} />
          </div>
        ))}
      </div>

      <label>
        Add to trip
        <select value={selectedTripId} onChange={(e) => setSelectedTripId(e.target.value)}>
          <option value="">Choose a trip...</option>
          {tripsData?.items.map((trip) => (
            <option key={trip.id} value={trip.id}>
              {trip.location_name} ({trip.start_date})
            </option>
          ))}
        </select>
      </label>

      {error && (
        <span className="form-error" role="alert">
          {error}
        </span>
      )}

      <button type="button" onClick={handleAttach} disabled={!selectedTripId || isUploading}>
        {isUploading ? "Uploading..." : "Add photos to trip"}
      </button>
    </div>
  );
}
