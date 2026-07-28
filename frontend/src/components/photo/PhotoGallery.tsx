import { useDeletePhoto } from "../../hooks/usePhotos";
import type { Photo } from "../../types/trip";

interface PhotoGalleryProps {
  tripId: string;
  photos: Photo[];
  onOpen?: (index: number) => void;
}

export default function PhotoGallery({ tripId, photos, onOpen }: PhotoGalleryProps) {
  const deletePhoto = useDeletePhoto(tripId);

  if (photos.length === 0) return null;

  async function handleDelete(photoId: string) {
    if (!window.confirm("Delete this photo?")) return;
    await deletePhoto.mutateAsync(photoId);
  }

  return (
    <div className="photo-gallery">
      {photos.map((photo, index) => (
        <div key={photo.id} className="photo-gallery-item">
          <button type="button" className="photo-gallery-thumb" onClick={() => onOpen?.(index)}>
            <img src={`/photos/${photo.file_path}`} alt={photo.original_filename ?? "Trip photo"} loading="lazy" />
          </button>
          <button type="button" onClick={() => handleDelete(photo.id)} disabled={deletePhoto.isPending}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
