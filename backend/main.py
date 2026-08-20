from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.hospitals import router as hospitals_router
from routes.leads import router as leads_router
from routes.realtime import router as realtime_router
from routes.reminders import router as reminders_router
from routes.reviews import router as reviews_router
from routes.transfers import router as transfers_router


app = FastAPI(
    title="Hospital Network API",
    version="0.1.0",
)

allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(hospitals_router)
app.include_router(transfers_router)
app.include_router(realtime_router)
app.include_router(reminders_router)
app.include_router(reviews_router)
app.include_router(leads_router)


@app.get("/")
def read_root():
    return {"status": "Hospital Network API running"}
