import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import LocationPicker from "../components/map/LocationPicker";
import { useCreateTrip, useTrip, useUpdateTrip } from "../hooks/useTrips";
import { tripFormSchema, type TripFormValues } from "../schemas/tripForm";
import type { TripPayload } from "../types/trip";

const defaultValues: TripFormValues = {
  location_name: "",
  place_area: undefined,
  plot_number: undefined,
  latitude: undefined,
  longitude: undefined,
  start_date: "",
  end_date: "",
  price_input_mode: "none",
  price_total: undefined,
  price_per_night_input: undefined,
  currency: "SEK",
  star_rating: undefined,
  notes: undefined,
};

export default function TripFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: existingTrip } = useTrip(id);
  const createTrip = useCreateTrip();
  const updateTrip = useUpdateTrip(id ?? "");

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TripFormValues>({
    resolver: zodResolver(tripFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (existingTrip) {
      reset({
        location_name: existingTrip.location_name,
        place_area: existingTrip.place_area ?? undefined,
        plot_number: existingTrip.plot_number ?? undefined,
        latitude: existingTrip.latitude ?? undefined,
        longitude: existingTrip.longitude ?? undefined,
        start_date: existingTrip.start_date,
        end_date: existingTrip.end_date,
        price_input_mode: existingTrip.price_input_mode,
        price_total: existingTrip.price_total ?? undefined,
        price_per_night_input: existingTrip.price_per_night_input ?? undefined,
        currency: existingTrip.currency,
        star_rating: existingTrip.star_rating ?? undefined,
        notes: existingTrip.notes ?? undefined,
      });
    }
  }, [existingTrip, reset]);

  const priceMode = watch("price_input_mode");
  const latitude = watch("latitude");
  const longitude = watch("longitude");
  const locationValue = latitude !== undefined && longitude !== undefined ? { lat: latitude, lng: longitude } : null;

  function handleLocationChange(value: { lat: number; lng: number }) {
    setValue("latitude", value.lat, { shouldDirty: true, shouldValidate: true });
    setValue("longitude", value.lng, { shouldDirty: true, shouldValidate: true });
  }

  function handleLocationClear() {
    setValue("latitude", undefined, { shouldDirty: true });
    setValue("longitude", undefined, { shouldDirty: true });
  }

  async function onSubmit(values: TripFormValues) {
    const payload: TripPayload = {
      location_name: values.location_name,
      place_area: values.place_area ?? null,
      plot_number: values.plot_number ?? null,
      start_date: values.start_date,
      end_date: values.end_date,
      latitude: values.latitude ?? null,
      longitude: values.longitude ?? null,
      price_input_mode: values.price_input_mode,
      price_total: values.price_total ?? null,
      price_per_night_input: values.price_per_night_input ?? null,
      currency: values.currency,
      star_rating: values.star_rating ?? null,
      notes: values.notes ?? null,
    };

    const trip = isEdit ? await updateTrip.mutateAsync(payload) : await createTrip.mutateAsync(payload);
    navigate(`/trips/${trip.id}`, { replace: true });
  }

  return (
    <div className="trip-form-page">
      <h1>{isEdit ? "Edit trip" : "New trip"}</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <label>
          Location name
          <input {...register("location_name")} />
          {errors.location_name && (
            <span className="form-error" role="alert">
              {errors.location_name.message}
            </span>
          )}
        </label>

        <label>
          Area / region
          <input {...register("place_area")} />
        </label>

        <label>
          Plot / site
          <input {...register("plot_number")} />
        </label>

        <div>
          <span className="location-picker-label">Location</span>
          <LocationPicker value={locationValue} onChange={handleLocationChange} onClear={handleLocationClear} />
        </div>

        <div className="date-range">
          <label>
            Start date
            <input type="date" {...register("start_date")} />
          </label>
          <label>
            End date
            <input type="date" {...register("end_date")} />
          </label>
        </div>
        {errors.end_date && (
          <span className="form-error" role="alert">
            {errors.end_date.message}
          </span>
        )}

        <label>
          Price
          <select {...register("price_input_mode")}>
            <option value="none">Not recorded</option>
            <option value="total">Total for stay</option>
            <option value="per_night">Per night</option>
          </select>
        </label>

        {priceMode === "total" && (
          <label>
            Total price
            <input type="number" step="0.01" {...register("price_total")} />
            {errors.price_total && (
              <span className="form-error" role="alert">
                {errors.price_total.message}
              </span>
            )}
          </label>
        )}

        {priceMode === "per_night" && (
          <label>
            Price per night
            <input type="number" step="0.01" {...register("price_per_night_input")} />
            {errors.price_per_night_input && (
              <span className="form-error" role="alert">
                {errors.price_per_night_input.message}
              </span>
            )}
          </label>
        )}

        <label>
          Currency
          <input {...register("currency")} maxLength={3} />
        </label>

        <label>
          Rating
          <select {...register("star_rating")}>
            <option value="">Not rated</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {"★".repeat(n)}
              </option>
            ))}
          </select>
        </label>

        <label>
          Notes
          <textarea rows={4} {...register("notes")} />
        </label>

        <button type="submit" disabled={isSubmitting}>
          {isEdit ? "Save changes" : "Log trip"}
        </button>
      </form>
    </div>
  );
}
