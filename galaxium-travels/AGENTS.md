# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project Structure (Non-Obvious)

- **Dual Protocol Backend**: Server exposes BOTH REST API and MCP from single FastAPI app at different paths (`/api/*` for REST, `/mcp` for MCP tools)
- **MCP Must Be Created First**: MCP server MUST be instantiated before FastAPI app to properly combine lifespans (see server.py line 14-16)
- **Service Layer Pattern**: Business logic in `services/` is transport-agnostic - same functions called by both REST endpoints and MCP tools
- **Database Sessions**: MCP tools manually manage sessions with `SessionLocal()` and `finally: db.close()`, while REST uses FastAPI's `Depends(get_db)`

## Backend Commands (booking_system_backend/)

```bash
# Run server (auto-seeds database on startup)
python server.py

# Run tests (must be in backend directory)
pytest                           # All tests
pytest tests/test_services.py    # Service layer tests only
pytest tests/test_rest.py        # REST API tests only
pytest -v                        # Verbose output
```

## Frontend Commands (booking_system_frontend/)

```bash
# Development
npm run dev          # Starts on port 5173

# Production
npm run build        # TypeScript compile + Vite build
npm run preview      # Preview production build

# Linting
npm run lint         # ESLint check
```

## Critical Patterns

### Backend Error Handling
- Services return `Union[SuccessType, ErrorResponse]` - NOT exceptions
- MCP tools convert ErrorResponse to exceptions: `raise Exception(result.details or result.error)`
- REST endpoints return ErrorResponse directly in response body
- All error responses include: `error`, `error_code`, `details` fields

### Type Validation
- Backend: Pydantic schemas in `schemas.py` with `from_attributes = True` for ORM conversion
- Frontend: TypeScript interfaces in `src/types/index.ts` use snake_case to match backend (NOT camelCase)
- API responses use snake_case field names (e.g., `user_id`, `flight_id`, `booking_time`)

### Database Patterns
- SQLite file-based database (auto-created on first run)
- `seed()` function runs on every server startup (idempotent - checks before inserting)
- Booking decrements `seats_available`, cancellation increments it back
- No foreign key constraints enforced at DB level - validation in service layer

### Frontend API Integration
- Axios instance in `src/services/api.ts` with response interceptor
- Error responses have `success: false` field to distinguish from successful responses
- Helper function `isErrorResponse()` checks for error responses
- API base URL from `VITE_API_URL` env var (defaults to `http://localhost:8080`)

## Testing Notes

- Backend tests use pytest with async support (`pytest-asyncio`)
- Tests are in `tests/` directory with `test_*.py` naming
- Service tests use in-memory SQLite database
- REST tests use FastAPI TestClient with httpx
- No frontend tests included (build test only)

## Code Style

### Backend (Python)
- Type hints required: `def func(db: Session, user_id: int) -> BookingOut | ErrorResponse`
- Union types with pipe operator: `Type1 | Type2` (Python 3.10+)
- Docstrings for all public functions
- Import order: stdlib, third-party, local (models, schemas, services)

### Frontend (TypeScript)
- Strict TypeScript with project references (tsconfig.json)
- Functional components with hooks only
- Props destructuring in component signatures
- Tailwind utility classes (no custom CSS except animations)
- Custom colors defined in tailwind.config.js (space-dark, cosmic-purple, etc.)
- Comment "Made with Bob" at end of generated files