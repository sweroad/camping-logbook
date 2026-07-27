from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, export, photos, stats, trips

app = FastAPI(title="Camping Logbook API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(trips.router)
app.include_router(photos.router)
app.include_router(stats.router)
app.include_router(export.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
