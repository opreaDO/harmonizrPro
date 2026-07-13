from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api import recommendations

app = FastAPI(title="Harmonizr Pro API", version="1.0")

# Configure CORS to allow our future React frontend to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # We'll restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register our recommendation routes
app.include_router(recommendations.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"status": "online", "message": "Welcome to Harmonizr Pro"}
