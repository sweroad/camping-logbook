import { Link, useNavigate, useParams } from "react-router-dom";
import PhotoGallery from "../components/photo/PhotoGallery";
import PhotoUploader from "../components/photo/PhotoUploader";
import { useDeleteTrip, useTrip } from "../hooks/useTrips";

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: trip, isLoading, isError } = useTrip(id);
  const deleteTrip = useDeleteTrip();

  if (isLoading) return <p>Loading...</p>;
  if (isError || !trip) {
    return (
      <p className="form-error" role="alert">
        Trip not found.
      </p>
    );
  }

  async function handleDelete() {
    if (!id) return;
    if (!window.confirm("Delete this trip? This cannot be undone.")) return;
    await deleteTrip.mutateAsync(id);
    navigate("/", { replace: true });
  }

  return (
    <div className="trip-detail-page">
      <h1>{trip.location_name}</h1>
      {trip.place_area && <p>{trip.place_area}</p>}
      {trip.plot_number && <p>Plot: {trip.plot_number}</p>}
      <p>
        {trip.start_date} → {trip.end_date} ({trip.nights} {trip.nights === 1 ? "night" : "nights"})
      </p>
      {trip.price_total !== null && (
        <p>
          {trip.price_total} {trip.currency}
        </p>
      )}
      {trip.star_rating && <p>{"★".repeat(trip.star_rating)}</p>}
      {trip.notes && <p>{trip.notes}</p>}

      <PhotoGallery tripId={trip.id} photos={trip.photos} />
      <PhotoUploader tripId={trip.id} />

      <div className="trip-detail-actions">
        <Link to={`/trips/${trip.id}/edit`}>Edit</Link>
        <button type="button" onClick={handleDelete} disabled={deleteTrip.isPending}>
          Delete
        </button>
      </div>
    </div>
  );
}
