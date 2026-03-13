---
name: python-automation-training
description: Complete Python training system for building automations that replace n8n workflows. Covers Python fundamentals, FastAPI, async patterns, Supabase integration, background tasks, and production deployment. Use this skill when building Python scripts, APIs, automation workflows, database operations, or migrating from visual automation tools to code. Teaches decision-making principles and deterministic execution patterns.
---

# Python Automation Training
> Complete training system for building production-grade automations in Python.
> Focus: Replace n8n workflows with maintainable, scalable Python code.

---

## ⚠️ Core Philosophy

This skill teaches **3-layer architecture** for reliable automation:

```
Layer 1: Directive (What to do) → Markdown SOPs
Layer 2: Orchestration (Decision making) → You (the AI agent)
Layer 3: Execution (Doing the work) → Deterministic Python scripts
```

**Why this matters:**
- LLMs are probabilistic (90% accuracy per step)
- Business logic must be deterministic (100% reliability)
- Separate concerns = compound fewer errors

---

## 1. Python Fundamentals (Start Here)

### When You Know Nothing

```python
# Variables and types
name = "João"                    # string
age = 25                         # integer
price = 19.99                    # float
is_active = True                 # boolean
items = ["a", "b", "c"]          # list
user = {"name": "João", "age": 25}  # dictionary

# Functions
def calculate_total(price, quantity):
    """Always document what function does"""
    return price * quantity

total = calculate_total(19.99, 3)

# Conditionals
if total > 50:
    print("Free shipping!")
elif total > 30:
    print("Small fee")
else:
    print("Standard shipping")

# Loops
for item in items:
    print(item)

# Error handling
try:
    result = 10 / 0
except ZeroDivisionError:
    print("Cannot divide by zero")
```

### Environment Setup

```bash
# Install Python 3.11+ (recommended)
python --version

# Virtual environment (ALWAYS use this)
python -m venv venv
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

# Install packages
pip install fastapi uvicorn supabase python-dotenv httpx

# Freeze dependencies
pip freeze > requirements.txt
```

### Project Structure (Start Small)

```
my-automation/
├── .env                 # Environment variables (NEVER commit)
├── .gitignore          # Ignore venv, .env, __pycache__
├── requirements.txt    # Python dependencies
├── main.py            # Entry point
└── README.md          # Documentation
```

---

## 2. FastAPI Basics (Your First API)

### Why FastAPI?
- ✅ Async native (handles many requests simultaneously)
- ✅ Auto-generates API documentation
- ✅ Type validation with Pydantic
- ✅ Production-ready with Uvicorn
- ✅ Perfect for replacing n8n HTTP endpoints

### Minimal FastAPI Example

```python
# main.py
from fastapi import FastAPI

app = FastAPI(title="My Automation API")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "running"}

@app.get("/hello/{name}")
async def greet(name: str):
    """Greet user by name"""
    return {"message": f"Hello, {name}!"}

# Run with: uvicorn main:app --reload
```

### Request/Response with Pydantic

```python
from pydantic import BaseModel, Field
from typing import Optional

# Define data models
class BrokerActivation(BaseModel):
    """Model for broker activation request"""
    broker_id: str = Field(..., description="Unique broker identifier")
    active: bool = Field(..., description="Activation status")
    schedule_time: Optional[str] = Field(None, description="ISO 8601 time")

class BrokerResponse(BaseModel):
    """Standard response model"""
    success: bool
    message: str
    data: Optional[dict] = None

@app.post("/broker/activate", response_model=BrokerResponse)
async def activate_broker(request: BrokerActivation):
    """
    Activate/deactivate broker based on schedule
    
    This replaces your n8n webhook + logic nodes
    """
    # Your business logic here
    if request.active:
        # Activate broker logic
        return BrokerResponse(
            success=True,
            message=f"Broker {request.broker_id} activated",
            data={"broker_id": request.broker_id, "status": "active"}
        )
    else:
        # Deactivate broker logic
        return BrokerResponse(
            success=True,
            message=f"Broker {request.broker_id} deactivated",
            data={"broker_id": request.broker_id, "status": "inactive"}
        )
```

---

## 3. Supabase Integration

### Setup Supabase Client

```python
# config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Load from .env file"""
    SUPABASE_URL: str
    SUPABASE_KEY: str
    
    class Config:
        env_file = ".env"

settings = Settings()
```

```python
# database.py
from supabase import create_client, Client
from config import settings

# Initialize Supabase client (singleton pattern)
supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_KEY
)

async def get_broker_status(broker_id: str) -> dict:
    """Fetch broker from database"""
    response = supabase.table("brokers").select("*").eq("id", broker_id).execute()
    return response.data[0] if response.data else None

async def update_broker_status(broker_id: str, active: bool) -> dict:
    """Update broker status"""
    response = supabase.table("brokers").update({
        "active": active,
        "updated_at": "now()"
    }).eq("id", broker_id).execute()
    return response.data[0]
```

### Using with FastAPI

```python
# main.py
from fastapi import FastAPI, HTTPException
from database import get_broker_status, update_broker_status

@app.post("/broker/toggle")
async def toggle_broker(broker_id: str):
    """Toggle broker active status"""
    # Get current status
    broker = await get_broker_status(broker_id)
    if not broker:
        raise HTTPException(status_code=404, detail="Broker not found")
    
    # Toggle status
    new_status = not broker["active"]
    updated = await update_broker_status(broker_id, new_status)
    
    return {
        "success": True,
        "broker": updated
    }
```

---

## 4. Async vs Sync Decision Tree

### When to Use async/await

```
Use async when:
├── Database queries (Supabase, PostgreSQL)
├── HTTP requests (calling external APIs)
├── File operations (reading/writing large files)
├── Many concurrent operations
└── Real-time features (WebSockets)

Use sync when:
├── Simple scripts
├── CPU-intensive calculations
├── Sequential operations
├── Legacy code integration
```

### Async Patterns

```python
import httpx
import asyncio

# ✅ CORRECT: Async HTTP calls
async def fetch_user_data(user_id: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(f"https://api.example.com/users/{user_id}")
        return response.json()

# ✅ CORRECT: Multiple async operations
async def process_multiple_brokers(broker_ids: list[str]):
    tasks = [get_broker_status(bid) for bid in broker_ids]
    results = await asyncio.gather(*tasks)  # Run in parallel
    return results

# ❌ WRONG: Blocking in async function
async def bad_example():
    time.sleep(5)  # This blocks everything!
    # Use: await asyncio.sleep(5) instead
```

---

## 5. Background Tasks & Scheduling

### Option A: FastAPI BackgroundTasks (Simple)

```python
from fastapi import BackgroundTasks

def send_notification(broker_id: str, status: str):
    """This runs after response is sent"""
    print(f"Notifying: Broker {broker_id} is now {status}")
    # Send email, webhook, etc.

@app.post("/broker/activate-async")
async def activate_with_notification(
    broker_id: str,
    background_tasks: BackgroundTasks
):
    """Activate broker and notify in background"""
    # Update database
    await update_broker_status(broker_id, True)
    
    # Schedule background task
    background_tasks.add_task(send_notification, broker_id, "active")
    
    return {"success": True, "message": "Activation in progress"}
```

### Option B: APScheduler (Cron-like scheduling)

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime

scheduler = AsyncIOScheduler()

async def deactivate_brokers_at_night():
    """Run every day at 22:00"""
    print(f"Running nightly deactivation at {datetime.now()}")
    # Your logic here
    brokers = await get_all_active_brokers()
    for broker in brokers:
        await update_broker_status(broker["id"], False)

@app.on_event("startup")
async def start_scheduler():
    """Start scheduler when API starts"""
    scheduler.add_job(
        deactivate_brokers_at_night,
        trigger="cron",
        hour=22,
        minute=0
    )
    scheduler.start()
    print("Scheduler started")
```

### Option C: Celery (Heavy-duty, distributed)

```python
# celery_app.py
from celery import Celery

celery_app = Celery(
    "tasks",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0"
)

@celery_app.task
def process_broker_activation(broker_id: str, active: bool):
    """Heavy processing in background worker"""
    # This runs in separate worker process
    # Can retry, has persistence, scales horizontally
    pass

# Use in FastAPI:
@app.post("/broker/process")
async def trigger_processing(broker_id: str):
    process_broker_activation.delay(broker_id, True)  # .delay = async
    return {"message": "Processing started"}
```

**When to use each:**
- **BackgroundTasks**: Quick operations, same process
- **APScheduler**: Time-based triggers, moderate load
- **Celery**: Heavy workloads, distributed, needs retry logic

---

## 6. Error Handling & Logging

### Structured Error Handling

```python
from fastapi import HTTPException
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class BrokerError(Exception):
    """Custom exception for broker operations"""
    pass

@app.post("/broker/safe-activate")
async def safe_activate_broker(broker_id: str):
    """Activate broker with proper error handling"""
    try:
        logger.info(f"Attempting to activate broker: {broker_id}")
        
        # Validate broker exists
        broker = await get_broker_status(broker_id)
        if not broker:
            raise HTTPException(
                status_code=404,
                detail=f"Broker {broker_id} not found"
            )
        
        # Business logic validation
        if broker.get("suspended"):
            raise BrokerError(f"Broker {broker_id} is suspended")
        
        # Update status
        result = await update_broker_status(broker_id, True)
        logger.info(f"Successfully activated broker: {broker_id}")
        
        return {"success": True, "data": result}
        
    except BrokerError as e:
        logger.error(f"Business logic error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
        
    except Exception as e:
        logger.exception(f"Unexpected error activating broker {broker_id}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )
```

---

## 7. Environment Variables & Configuration

### .env file (NEVER commit this)

```bash
# .env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:pass@localhost/db
REDIS_URL=redis://localhost:6379/0
API_SECRET_KEY=your-secret-key
ENVIRONMENT=development
```

### Loading Configuration

```python
# config.py
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    """Application settings"""
    SUPABASE_URL: str
    SUPABASE_KEY: str
    API_SECRET_KEY: str
    ENVIRONMENT: str = "development"
    
    # Computed properties
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()  # Singleton pattern - load once
def get_settings() -> Settings:
    return Settings()

# Usage in FastAPI
from fastapi import Depends

@app.get("/config")
async def show_config(settings: Settings = Depends(get_settings)):
    return {
        "environment": settings.ENVIRONMENT,
        "is_production": settings.is_production
    }
```

---

## 8. Testing Your Automation

### Basic Testing

```python
# test_main.py
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    """Test API is running"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "running"

def test_activate_broker():
    """Test broker activation"""
    response = client.post("/broker/activate", json={
        "broker_id": "test-123",
        "active": True
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
```

### Run tests

```bash
# Install pytest
pip install pytest pytest-asyncio

# Run tests
pytest test_main.py -v
```

---

## 9. Deployment & Production

### Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Run with production server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Production Run Command

```bash
# Development
uvicorn main:app --reload

# Production (with multiple workers)
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Health Monitoring

```python
@app.get("/health")
async def health_check():
    """Kubernetes/Docker health check"""
    try:
        # Check database connection
        await supabase.table("brokers").select("count").limit(1).execute()
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }, 503
```

---

## 10. Migrating from n8n to Python

### n8n Pattern → Python Equivalent

| n8n Node | Python Solution |
|----------|----------------|
| Webhook | FastAPI endpoint |
| HTTP Request | `httpx.AsyncClient()` |
| Schedule Trigger | APScheduler |
| Code Node | Regular Python function |
| IF Node | `if/elif/else` |
| Switch Node | `match/case` (Python 3.10+) |
| Set Node | Variable assignment |
| Supabase Node | `supabase` library |

### Example Migration

**n8n Workflow:**
```
Webhook → Get Data from Supabase → IF check → HTTP Request → Update Supabase
```

**Python Equivalent:**

```python
@app.post("/workflow/example")
async def example_workflow(data: dict):
    """Replaces entire n8n workflow"""
    
    # 1. Get data from Supabase
    broker = await get_broker_status(data["broker_id"])
    
    # 2. IF check
    if broker["active"] and broker["balance"] > 100:
        # 3. HTTP Request to external API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.external.com/notify",
                json={"broker_id": broker["id"]}
            )
        
        # 4. Update Supabase
        await update_broker_status(broker["id"], False)
        
        return {"success": True, "action": "deactivated"}
    
    return {"success": True, "action": "no_change"}
```

---

## 11. Decision Checklist

Before writing automation code:

- [ ] **Understand the workflow**: What triggers it? What's the output?
- [ ] **Choose framework**: FastAPI (API), script (standalone), Celery (heavy)?
- [ ] **Async or sync?**: I/O-bound → async, CPU-bound → sync
- [ ] **Error handling**: What can go wrong? How to recover?
- [ ] **Logging**: How to debug when it breaks?
- [ ] **Testing**: How to verify it works?
- [ ] **Deployment**: Where will it run? Docker? VPS?

---

## 12. Common Patterns & Anti-Patterns

### ✅ DO:

```python
# 1. Use type hints
async def process_broker(broker_id: str, active: bool) -> dict:
    pass

# 2. Separate concerns
# routes.py → business_logic.py → database.py

# 3. Use environment variables
from config import settings
API_KEY = settings.API_KEY

# 4. Handle errors gracefully
try:
    result = await risky_operation()
except SpecificError as e:
    logger.error(f"Known error: {e}")
    # Handle appropriately
```

### ❌ DON'T:

```python
# 1. Hardcode secrets
API_KEY = "sk-1234567890"  # NEVER!

# 2. Mix sync and async carelessly
async def bad():
    time.sleep(5)  # Blocks event loop!

# 3. Ignore errors
result = await operation()  # What if it fails?

# 4. Put business logic in routes
@app.post("/thing")
async def do_thing():
    # 500 lines of logic here  # BAD!
```

---

## 13. Next Steps & Resources

### Learning Path

1. **Week 1**: Python basics + FastAPI hello world
2. **Week 2**: Supabase CRUD operations
3. **Week 3**: Background tasks + scheduling
4. **Week 4**: Migrate first n8n workflow
5. **Week 5**: Testing + deployment

### Essential Libraries

```bash
# Core
pip install fastapi uvicorn pydantic pydantic-settings

# Database
pip install supabase asyncpg sqlalchemy

# Async operations
pip install httpx aiofiles aioredis

# Background tasks
pip install apscheduler celery

# Development
pip install pytest pytest-asyncio black ruff
```

### Documentation Links

- **FastAPI**: https://fastapi.tiangolo.com
- **Supabase Python**: https://supabase.com/docs/reference/python
- **Python Async**: https://docs.python.org/3/library/asyncio.html
- **Pydantic**: https://docs.pydantic.dev

---

## 14. Self-Annealing Process

When automations break:

1. **Read the error**: What's the actual message?
2. **Check logs**: What was happening before failure?
3. **Fix the code**: Update script with fix
4. **Test the fix**: Verify it works
5. **Update documentation**: Add learnings to this file
6. **Deploy**: Push to production

**Example learning:**
```
❌ Error: "Connection pool exhausted"
✅ Fix: Added connection pooling limit
📝 Update: Added to "Common Issues" section
```

---

> **Remember**: This skill teaches THINKING and DECISION-MAKING, not just copying code.
> Every automation is different. Ask questions. Understand context. Choose appropriate tools.
> Start small, test thoroughly, deploy confidently.