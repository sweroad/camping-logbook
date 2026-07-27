import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import LocationPicker from "../components/map/LocationPicker";
import { useCreateTrip, useDeleteTrip, useTrip, useUpdateTrip } from "../hooks/useTrips";
import { tripFormSchema, type TripFormValues } from "../schemas/tripForm";
import type { PriceInputMode, TripPayload } from "../types/trip";

const defaultValues: TripFormValues = {
  location_name: "",
  place_area: undefined,
  plot_number: undefined,
  country: undefined,
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

const PRICE_MODES: { value: PriceInputMode; label: string }[] = [
  { value: "per_night", label: "Per night" },
  { value: "total", label: "Total" },
  { value: "none", label: "No price" },
];

function computeNights(start: string, end: string): number {
  if (!start || !end) return 0;
  const ms = new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime();
  return Math.round(ms / 86400000);
}

export default function TripFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: existingTrip } = useTrip(id);
  const createTrip = useCreateTrip();
  const updateTrip = useUpdateTrip(id ?? "");
  const deleteTrip = useDeleteTrip();

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
        country: existingTrip.country ?? undefined,
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
  const currency = watch("currency");
  const startDate = watch("start_date");
  const endDate = watch("end_date");
  const priceTotal = watch("price_total");
  const pricePerNight = watch("price_per_night_input");
  const starRating = watch("star_rating");
  const latitude = watch("latitude");
  const longitude = watch("longitude");
  const locationValue = latitude !== undefined && longitude !== undefined ? { lat: latitude, lng: longitude } : null;

  const nights = computeNights(startDate, endDate);
  const nightsHint =
    nights >= 1
      ? `${nights} ${nights === 1 ? "night" : "nights"}`
      : startDate && endDate
        ? "Departure must be after arrival"
        : "";

  const derivedTotal =
    priceMode === "per_night" && pricePerNight !== undefined && nights >= 1
      ? pricePerNight * nights
      : priceMode === "total"
        ? priceTotal
        : undefined;
  const priceDerivedHint =
    priceMode === "none"
      ? "Not counted in stats"
      : derivedTotal !== undefined
        ? `Total ${derivedTotal} ${currency} for ${nights} ${nights === 1 ? "night" : "nights"}`
        : "";

  function handleLocationChange(value: { lat: number; lng: number }) {
    setValue("latitude", value.lat, { shouldDirty: true, shouldValidate: true });
    setValue("longitude", value.lng, { shouldDirty: true, shouldValidate: true });
  }

  function handleLocationClear() {
    setValue("latitude", undefined, { shouldDirty: true });
    setValue("longitude", undefined, { shouldDirty: true });
  }

  function handleCountryDetected(country: string) {
    setValue("country", country, { shouldDirty: true });
  }

  async function onSubmit(values: TripFormValues) {
    const payload: TripPayload = {
      location_name: values.location_name,
      place_area: values.place_area ?? null,
      plot_number: values.plot_number ?? null,
      country: values.country ?? null,
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

  async function handleDelete() {
    if (!id) return;
    if (!window.confirm("Delete this trip? This cannot be undone.")) return;
    await deleteTrip.mutateAsync(id);
    navigate("/", { replace: true });
  }

  return (
    <div className="trip-form-page">
      <div className="trip-form-header">
        <button type="button" className="trip-form-cancel" onClick={() => navigate(-1)}>
          Cancel
        </button>
        <span className="trip-form-title">{isEdit ? "Edit trip" : "New trip"}</span>
        <button type="submit" form="trip-form" className="trip-form-save" disabled={isSubmitting}>
          Save
        </button>
      </div>

      <form id="trip-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="form-field">
          <label className="form-field-label" htmlFor="location_name">
            Location
          </label>
          <input id="location_name" placeholder="e.g. Trosa Havsbad och Camping" {...register("location_name")} />
          {errors.location_name && (
            <span className="form-error" role="alert">
              {errors.location_name.message}
            </span>
          )}

          <div className="form-grid-2">
            <input placeholder="Area / region" {...register("place_area")} />
            <input placeholder="Plot / site" {...register("plot_number")} />
          </div>
          <input placeholder="Country" {...register("country")} />
        </div>

        <div className="form-field">
          <span className="form-field-label">Date</span>
          <div className="date-boxes">
            <div className="date-box">
              <span className="date-box-label">Arrival</span>
              <input type="date" {...register("start_date")} />
            </div>
            <div className="date-box">
              <span className="date-box-label">Departure</span>
              <input type="date" {...register("end_date")} />
            </div>
          </div>
          {nightsHint && <span className="form-hint">{nightsHint}</span>}
          {errors.end_date && (
            <span className="form-error" role="alert">
              {errors.end_date.message}
            </span>
          )}
        </div>

        <div className="form-field">
          <span className="form-field-label">Price</span>
          <div className="chip-row chip-row--seg">
            {PRICE_MODES.map((mode) => (
              <button
                key={mode.value}
                type="button"
                className={priceMode === mode.value ? "chip chip--seg active" : "chip chip--seg"}
                onClick={() => setValue("price_input_mode", mode.value, { shouldValidate: true })}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {priceMode !== "none" && (
            <>
              <div className="price-box">
                {priceMode === "total" ? (
                  <input type="number" step="0.01" placeholder="0" {...register("price_total")} />
                ) : (
                  <input type="number" step="0.01" placeholder="0" {...register("price_per_night_input")} />
                )}
                <span className="price-box-unit">{priceMode === "per_night" ? `${currency} / night` : `${currency} total`}</span>
              </div>
              {errors.price_total && (
                <span className="form-error" role="alert">
                  {errors.price_total.message}
                </span>
              )}
              {errors.price_per_night_input && (
                <span className="form-error" role="alert">
                  {errors.price_per_night_input.message}
                </span>
              )}
            </>
          )}
          {priceDerivedHint && <span className="form-hint">{priceDerivedHint}</span>}

          <div className="form-grid-2 currency-row">
            <label className="currency-field">
              Currency
              <input {...register("currency")} maxLength={3} />
            </label>
          </div>
        </div>

        <div className="form-field">
          <span className="form-field-label">Rating</span>
          <div className="star-picker">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={starRating !== undefined && starRating >= n ? "star-button active" : "star-button"}
                onClick={() => setValue("star_rating", starRating === n ? undefined : n, { shouldDirty: true })}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div className="form-field">
          <span className="form-field-label">Location</span>
          <LocationPicker
            value={locationValue}
            onChange={handleLocationChange}
            onClear={handleLocationClear}
            onCountryDetected={handleCountryDetected}
          />
        </div>

        <div className="form-field">
          <label className="form-field-label" htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            rows={4}
            placeholder="Service building, location, neighbors, anything…"
            {...register("notes")}
          />
        </div>

        {isEdit && (
          <button type="button" className="trip-form-delete" onClick={handleDelete} disabled={deleteTrip.isPending}>
            Delete this trip
          </button>
        )}
      </form>
    </div>
  );
}
