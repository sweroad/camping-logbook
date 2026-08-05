"""CLI to bulk-clear route_points from trips.

Usage:
  python -m scripts.clear_routes                # list trips that have a route (no changes)
  python -m scripts.clear_routes --all           # clear route_points on every trip that has one
  python -m scripts.clear_routes <trip_id> ...   # clear route_points on specific trip(s) only
"""

import sys

from sqlalchemy import select

from app.database import SessionLocal
from app.models.trip import Trip


def main() -> None:
    args = sys.argv[1:]
    db = SessionLocal()
    try:
        trips_with_routes = db.scalars(
            select(Trip).where(Trip.route_points.is_not(None))
        ).all()

        if not trips_with_routes:
            print("No trips currently have a route attached.")
            return

        if not args:
            print(f"{len(trips_with_routes)} trip(s) have a route attached:\n")
            for trip in trips_with_routes:
                segments = len(trip.route_points)
                points = sum(len(segment) for segment in trip.route_points)
                print(f"  {trip.id}  {trip.start_date}  {trip.location_name!r}  "
                      f"({segments} segment(s), {points} point(s))")
            print("\nRun with --all to clear every route above, or pass specific trip IDs to clear only those.")
            return

        if args == ["--all"]:
            targets = trips_with_routes
        else:
            wanted = set(args)
            targets = [t for t in trips_with_routes if str(t.id) in wanted]
            missing = wanted - {str(t.id) for t in targets}
            if missing:
                print(f"Skipping unknown/routeless trip id(s): {', '.join(missing)}")

        for trip in targets:
            trip.route_points = None
        db.commit()
        print(f"Cleared route_points on {len(targets)} trip(s).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
