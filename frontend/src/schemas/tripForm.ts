import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" || value === undefined ? undefined : value);

export const tripFormSchema = z
  .object({
    location_name: z.string().min(1, "Required").max(200),
    place_area: z.preprocess(emptyToUndefined, z.string().max(200).optional()),
    plot_number: z.preprocess(emptyToUndefined, z.string().max(50).optional()),
    country: z.preprocess(emptyToUndefined, z.string().max(100).optional()),
    latitude: z.preprocess(emptyToUndefined, z.coerce.number().optional()),
    longitude: z.preprocess(emptyToUndefined, z.coerce.number().optional()),
    start_date: z.string().min(1, "Required"),
    end_date: z.string().min(1, "Required"),
    price_input_mode: z.enum(["none", "total", "per_night"]),
    price_total: z.preprocess(emptyToUndefined, z.coerce.number().optional()),
    price_per_night_input: z.preprocess(emptyToUndefined, z.coerce.number().optional()),
    currency: z.string().min(1).max(3),
    star_rating: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(5).optional()),
    notes: z.preprocess(emptyToUndefined, z.string().optional()),
  })
  .superRefine((data, ctx) => {
    if (data.start_date && data.end_date && data.end_date <= data.start_date) {
      ctx.addIssue({
        path: ["end_date"],
        code: z.ZodIssueCode.custom,
        message: "End date must be after start date",
      });
    }
    if (data.price_input_mode === "total" && data.price_total === undefined) {
      ctx.addIssue({
        path: ["price_total"],
        code: z.ZodIssueCode.custom,
        message: "Required when price mode is 'Total for stay'",
      });
    }
    if (data.price_input_mode === "per_night" && data.price_per_night_input === undefined) {
      ctx.addIssue({
        path: ["price_per_night_input"],
        code: z.ZodIssueCode.custom,
        message: "Required when price mode is 'Per night'",
      });
    }
  });

export type TripFormValues = z.infer<typeof tripFormSchema>;
