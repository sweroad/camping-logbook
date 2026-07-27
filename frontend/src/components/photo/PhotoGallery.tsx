import { useDeletePhoto } from "../../hooks/usePhotos";
import type { Photo } from "../../types/trip";

interface PhotoGalleryProps {
  tripId: string;
  photos: Photo[];
}

export default function PhotoGallery({ tripId, photos }: PhotoGalleryProps) {
  const deletePhoto = useDeletePhoto(tripId);

  if (photos.length === 0) return null;

  async function handleDelete(photoId: string) {
    if (!window.confirm("Delete this photo?")) return;
    await deletePhoto.mutateAsync(photoId);
  }

  return (
    <div className="photo-gallery">
      {photos.map((photo) => (
        <div key={photo.id} className="photo-gallery-item">
          <img src={`/photos/${photo.file_path}`} alt={photo.original_filename ?? "Trip photo"} loading="lazy" />
          <button type="button" onClick={() => handleDelete(photo.id)} disabled={deletePhoto.isPending}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
