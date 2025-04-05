from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.models.database import db_init
from backend.app.routers import auth, tasks, categories

app = FastAPI(title="Task Manager API")

# Configure CORS
origins = [
    "http://localhost:3000",  # React frontend
    "http://localhost:5173",  # Vite alternative
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
@app.on_event("startup")
async def startup():
    db_init()

# Include routers - use singular include_router
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["Tasks"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])

@app.get("/")
async def root():
    return {"message": "Welcome to the Task Manager API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000, reload=True)


#uvicorn app.main:app --reload


#python -m venv venv
#venv\Scripts\activate  # Activate it (use `source venv/bin/activate` for WSL/Linux)
