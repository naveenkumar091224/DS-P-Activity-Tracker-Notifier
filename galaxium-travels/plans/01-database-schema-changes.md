# Plan 1: Database Schema Changes for Seat Classes

## Overview
Modify the database schema to support three seat classes: Economy, Business, and Galaxium. This requires changes to the Flight and Booking models to track seat availability and pricing per class.

## Current State Analysis

### Existing Schema
- [`Flight`](../booking_system_backend/models.py:12-20) model has single `seats_available` field and `price` field
- [`Booking`](../booking_system_backend/models.py:22-28) model has no seat class information
- No differentiation between seat types

### Impact Assessment
- **Breaking Change**: Yes - changes Flight table structure
- **Data Migration**: Required - existing flights need seat class data
- **API Compatibility**: Breaking - response schemas will change

## Proposed Changes

### 1. Update Flight Model

**File**: [`booking_system_backend/models.py`](../booking_system_backend/models.py:12-20)

**Changes**:
```python
class Flight(Base):
    __tablename__ = 'flights'
    flight_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    departure_time = Column(String, nullable=False)
    arrival_time = Column(String, nullable=False)
    
    # Remove single price and seats_available
    # Add per-class pricing and availability
    economy_price = Column(Integer, nullable=False)
    economy_seats_available = Column(Integer, nullable=False)
    
    business_price = Column(Integer, nullable=False)
    business_seats_available = Column(Integer, nullable=False)
    
    galaxium_price = Column(Integer, nullable=False)
    galaxium_seats_available = Column(Integer, nullable=False)
```

**Rationale**: 
- Separate columns for each class provide clear data structure
- Allows independent pricing and availability per class
- Maintains backward compatibility with existing query patterns

### 2. Update Booking Model

**File**: [`booking_system_backend/models.py`](../booking_system_backend/models.py:22-28)

**Changes**:
```python
class Booking(Base):
    __tablename__ = 'bookings'
    booking_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.user_id'), nullable=False)
    flight_id = Column(Integer, ForeignKey('flights.flight_id'), nullable=False)
    seat_class = Column(String, nullable=False)  # NEW: 'economy', 'business', 'galaxium'
    price_paid = Column(Integer, nullable=False)  # NEW: Store actual price paid
    status = Column(String, nullable=False)
    booking_time = Column(String, nullable=False)
```

**Rationale**:
- `seat_class` tracks which class was booked
- `price_paid` preserves historical pricing (important for refunds/records)
- Enables seat class filtering and analytics

### 3. Update Pydantic Schemas

**File**: [`booking_system_backend/schemas.py`](../booking_system_backend/schemas.py:5-15)

**Changes**:
```python
class FlightOut(BaseModel):
    flight_id: int
    origin: str
    destination: str
    departure_time: str
    arrival_time: str
    
    # Per-class pricing and availability
    economy_price: int
    economy_seats_available: int
    business_price: int
    business_seats_available: int
    galaxium_price: int
    galaxium_seats_available: int

    class Config:
        from_attributes = True


class BookingRequest(BaseModel):
    user_id: int
    name: str
    flight_id: int
    seat_class: str  # NEW: 'economy', 'business', or 'galaxium'


class BookingOut(BaseModel):
    booking_id: int
    user_id: int
    flight_id: int
    seat_class: str  # NEW
    price_paid: int  # NEW
    status: str
    booking_time: str

    class Config:
        from_attributes = True
```

### 4. Update Seed Data

**File**: [`booking_system_backend/seed.py`](../booking_system_backend/seed.py)

**Changes**:
- Update flight seed data to include all three seat classes
- Distribute existing seat counts across classes (e.g., 50% economy, 30% business, 20% galaxium)
- Set pricing tiers: Economy (base), Business (2x), Galaxium (4x)

**Example**:
```python
flights = [
    Flight(
        origin="Earth", 
        destination="Mars",
        departure_time="2024-06-01 10:00",
        arrival_time="2024-06-01 18:00",
        economy_price=500,
        economy_seats_available=100,
        business_price=1000,
        business_seats_available=50,
        galaxium_price=2000,
        galaxium_seats_available=20
    ),
    # ... more flights
]
```

## Migration Strategy

### Option A: Fresh Start (Recommended for Demo)
1. Delete existing `galaxium_booking.db` file
2. Update models and schemas
3. Run server - database will be recreated with new schema
4. Seed data will populate with new structure

### Option B: Data Migration (Production-like)
1. Create migration script to:
   - Add new columns with default values
   - Distribute existing `seats_available` across classes
   - Calculate class prices from base `price`
   - Add `seat_class` and `price_paid` to existing bookings
2. Remove old columns after migration
3. Update seed script to check for existing data

## Validation Rules

Add validation in service layer:
- `seat_class` must be one of: `'economy'`, `'business'`, `'galaxium'`
- Check correct seat availability field based on class
- Deduct from correct availability field
- Use correct price field for booking

## Testing Checklist

- [ ] Flight model creates with all seat class fields
- [ ] Booking model stores seat class and price paid
- [ ] Seed data populates all seat classes
- [ ] Database queries work with new schema
- [ ] Existing tests updated for new fields

## Dependencies

**Blocks**:
- Plan 2: Backend Service Layer Changes (needs new schema)
- Plan 3: Frontend UI Changes (needs new API responses)

**Requires**:
- None (foundational change)

## Estimated Effort

- Schema changes: 30 minutes
- Seed data update: 20 minutes
- Testing: 20 minutes
- **Total**: ~1.5 hours