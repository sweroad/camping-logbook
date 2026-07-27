export interface StatsSummary {
  start_date: string;
  end_date: string;
  trip_count: number;
  total_nights: number;
  total_price: number | null;
  avg_price_per_night: number | null;
  avg_star_rating: number | null;
}

export interface MonthlyStat {
  month: string;
  trip_count: number;
  total_nights: number;
  total_price: number | null;
}

export interface StatsByMonthResponse {
  start_date: string;
  end_date: string;
  months: MonthlyStat[];
}

export interface StatsRange {
  start_date?: string;
  end_date?: string;
}
