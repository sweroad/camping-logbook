import { useEffect, useState } from "react";
import type { Photo } from "../../types/trip";

interface PhotoLightboxProps {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
}

export default function PhotoLightbox({ photos, initialIndex, onClose }: PhotoLightboxProps) {
  const [index, setIndex] = useState(initialIndex);

  const hasPrev = index > 0;
  const hasNext = index < photos.length - 1;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      if (event.key === "ArrowRight") setIndex((i) => Math.min(photos.length - 1, i + 1));
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [photos.length, onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const photo = photos[index];
  if (!photo) return null;

  return (
    <div className="lightbox">
      <div className="lightbox-header">
        <button type="button" className="lightbox-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <span className="lightbox-counter">
          {index + 1} / {photos.length}
        </span>
        <span className="lightbox-spacer" />
      </div>

      <div className="lightbox-stage">
        <img
          key={photo.id}
          src={`/photos/${photo.file_path}`}
          alt={photo.original_filename ?? "Trip photo"}
          className="lightbox-image"
        />
        {hasPrev && (
          <button
            type="button"
            className="lightbox-nav lightbox-nav--prev"
            onClick={() => setIndex((i) => i - 1)}
            aria-label="Previous photo"
          >
            ‹
          </button>
        )}
        {hasNext && (
          <button
            type="button"
            className="lightbox-nav lightbox-nav--next"
            onClick={() => setIndex((i) => i + 1)}
            aria-label="Next photo"
          >
            ›
          </button>
        )}
      </div>

      <div className="lightbox-dots">
        {photos.map((p, i) => (
          <span key={p.id} className={i === index ? "lightbox-dot active" : "lightbox-dot"} />
        ))}
      </div>
    </div>
  );
}
