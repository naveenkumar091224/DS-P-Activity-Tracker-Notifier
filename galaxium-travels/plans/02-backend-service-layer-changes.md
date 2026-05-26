# Plan 2: Backend Service Layer Changes for Seat Classes

## Overview
Update the backend service layer and API endpoints to handle seat class selection, validation, and booking logic. This builds on the database schema changes from Plan 1.

## Current State Analysis

### Existing Service Logic
- [`booking.book_flight()`](../booking_system_backend/services/booking.py:7-54) checks single `seats_available` field
- [`booking.cancel_booking()`](../booking_system_backend/services/booking.py:57-82) restores single `seats_available` field
- No seat class validation or price calculation logic

### Impact Assessment
- **Breaking Change**: Yes - API request/response format changes
- **Backward Compatibility**: None - clients must update
- **MCP Tools**: Must be updated to support seat class parameter

## Proposed Changes

### 1. Update Booking Service

**File**: [`booking_system_backend/services/booking.py`](../booking_system_backend/services/booking.py:7-88)

#### A. Update `book_flight()` Function

**Current Signature**:
```python
def book_flight(db: Session, user_id: int, name: str, flight_id: int) -> BookingOut | ErrorResponse
```

**New Signature**:
```python
def book_flight(db: Session, user_id: int, name: str, flight_id: int, seat_class: str) -> BookingOut | ErrorResponse
```

**Changes**:
```python
def book_flight(db: Session, user_id: int, name: str, flight_id: int, seat_class: str) -> BookingOut | ErrorResponse:
    """Book a seat on a specific flight for a user in the specified seat class."""
    
    # Validate seat class
    valid_classes = ['economy', 'business', 'galaxium']
    if seat_class.lower() not in valid_classes:
        return ErrorResponse(
            error="Invalid seat class",
            error_code="INVALID_SEAT_CLASS",
            details=f"Seat class must be one of: {', '.join(valid_classes)}. Received: {seat_class}"
        )
    
    seat_class = seat_class.lower()
    
    # Check flight exists
    flight = db.query(Flight).filter(Flight.flight_id == flight_id).first()
    if not flight:
        return ErrorResponse(
            error="Flight not found",
            error_code="FLIGHT_NOT_FOUND",
            details=f"The specified flight_id {flight_id} does not exist."
        )
    
    # Check seats available for the specific class
    seats_field = f"{seat_class}_seats_available"
    seats_available = getattr(flight, seats_field)
    
    if seats_available < 1:
        return ErrorResponse(
            error="No seats available",
            error_code="NO_SEATS_AVAILABLE",
            details=f"No {seat_class} class seats available on this flight. Please try a different class or flight."
        )
    
    # Check user exists and name matches
    user = db.query(User).filter(User.user_id == user_id, User.name == name).first()
    if not user:
        existing_user = db.query(User).filter(User.user_id == user_id).first()
        if existing_user:
            return ErrorResponse(
                error="Name mismatch",
                error_code="NAME_MISMATCH",
                details=f"User ID {user_id} exists but name '{name}' does not match."
            )
        else:
            return ErrorResponse(
                error="User not found",
                error_code="USER_NOT_FOUND",
                details=f"User with ID {user_id} is not registered."
            )
    
    # Get price for the seat class
    price_field = f"{seat_class}_price"
    price = getattr(flight, price_field)
    
    # Decrement seats for the specific class
    setattr(flight, seats_field, seats_available - 1)
    
    # Create booking with seat class and price
    new_booking = Booking(
        user_id=user_id,
        flight_id=flight_id,
        seat_class=seat_class,
        price_paid=price,
        status="booked",
        booking_time=datetime.utcnow().isoformat()
    )
    
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return BookingOut.model_validate(new_booking)
```

**Key Changes**:
- Added `seat_class` parameter with validation
- Dynamic field access using `getattr()` for seat availability and pricing
- Store `seat_class` and `price_paid` in booking record
- Better error messages mentioning seat class

#### B. Update `cancel_booking()` Function

**Changes**:
```python
def cancel_booking(db: Session, booking_id: int) -> BookingOut | ErrorResponse:
    """Cancel an existing booking and restore seat to the appropriate class."""
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        return ErrorResponse(
            error="Booking not found",
            error_code="BOOKING_NOT_FOUND",
            details=f"Booking with ID {booking_id} not found."
        )

    if booking.status == "cancelled":
        return ErrorResponse(
            error="Booking already cancelled",
            error_code="ALREADY_CANCELLED",
            details=f"Booking {booking_id} is already cancelled."
        )

    # Restore seat to the correct class
    flight = db.query(Flight).filter(Flight.flight_id == booking.flight_id).first()
    if flight:
        seats_field = f"{booking.seat_class}_seats_available"
        current_seats = getattr(flight, seats_field)
        setattr(flight, seats_field, current_seats + 1)

    booking.status = "cancelled"
    db.commit()
    db.refresh(booking)
    return BookingOut.model_validate(booking)
```

**Key Changes**:
- Restore seat to correct class using `booking.seat_class`
- Dynamic field access for seat restoration

### 2. Update REST API Endpoints

**File**: [`booking_system_backend/server.py`](../booking_system_backend/server.py:145-151)

**Changes**:
```python
@app.post("/book", response_model=Union[BookingOut, ErrorResponse], tags=["Bookings"])
def book_flight_endpoint(request: BookingRequest, db: Session = Depends(get_db)):
    """Book a seat on a specific flight for a user in the specified seat class.

    Requires user_id, name, flight_id, and seat_class. Decrements available seats for the chosen class.
    """
    return booking.book_flight(
        db, 
        request.user_id, 
        request.name, 
        request.flight_id,
        request.seat_class  # NEW parameter
    )
```

### 3. Update MCP Tools

**File**: [`booking_system_backend/server.py`](../booking_system_backend/server.py:30-43)

**Changes**:
```python
@mcp.tool()
def book_flight(user_id: int, name: str, flight_id: int, seat_class: str) -> BookingOut:
    """Book a seat on a specific flight for a user in the specified seat class.
    
    Args:
        user_id: The user's ID
        name: The user's name (must match registered name)
        flight_id: The flight to book
        seat_class: Seat class - must be 'economy', 'business', or 'galaxium'
    
    Returns booking details or raises an error if booking is not possible.
    """
    db = SessionLocal()
    try:
        result = booking.book_flight(db, user_id, name, flight_id, seat_class)
        if isinstance(result, ErrorResponse):
            raise Exception(result.details or result.error)
        return result
    finally:
        db.close()
```

### 4. Add Helper Functions (Optional)

**File**: [`booking_system_backend/services/booking.py`](../booking_system_backend/services/booking.py)

**New Functions**:
```python
def get_available_classes(db: Session, flight_id: int) -> dict[str, int]:
    """Get available seats for each class on a flight.
    
    Returns:
        Dictionary with class names as keys and available seats as values
    """
    flight = db.query(Flight).filter(Flight.flight_id == flight_id).first()
    if not flight:
        return {}
    
    return {
        'economy': flight.economy_seats_available,
        'business': flight.business_seats_available,
        'galaxium': flight.galaxium_seats_available
    }


def get_class_pricing(db: Session, flight_id: int) -> dict[str, int]:
    """Get pricing for each class on a flight.
    
    Returns:
        Dictionary with class names as keys and prices as values
    """
    flight = db.query(Flight).filter(Flight.flight_id == flight_id).first()
    if not flight:
        return {}
    
    return {
        'economy': flight.economy_price,
        'business': flight.business_price,
        'galaxium': flight.galaxium_price
    }
```

## Testing Updates

### Update Existing Tests

**File**: [`booking_system_backend/tests/test_services.py`](../booking_system_backend/tests/test_services.py)

**Changes Needed**:
- Update all `book_flight()` calls to include `seat_class` parameter
- Add tests for each seat class
- Add tests for invalid seat class
- Add tests for class-specific seat availability
- Update cancel tests to verify correct class restoration

**File**: [`booking_system_backend/tests/test_rest.py`](../booking_system_backend/tests/test_rest.py)

**Changes Needed**:
- Update booking request payloads to include `seat_class`
- Add tests for each class via REST API
- Test error responses for invalid classes

### New Test Cases

```python
def test_book_economy_class():
    """Test booking economy class seat"""
    # Setup flight with economy seats
    # Book economy seat
    # Verify economy_seats_available decremented
    # Verify booking has correct seat_class and price_paid

def test_book_business_class():
    """Test booking business class seat"""
    # Similar to economy test

def test_book_galaxium_class():
    """Test booking galaxium class seat"""
    # Similar to economy test

def test_invalid_seat_class():
    """Test booking with invalid seat class"""
    # Attempt to book with invalid class
    # Verify error response

def test_no_seats_in_class():
    """Test booking when specific class is full"""
    # Setup flight with 0 economy seats but business available
    # Attempt economy booking
    # Verify error mentions class unavailability

def test_cancel_restores_correct_class():
    """Test cancellation restores seat to correct class"""
    # Book business class
    # Cancel booking
    # Verify business_seats_available incremented (not economy)
```

## API Documentation Updates

Update Swagger/OpenAPI documentation:
- Add `seat_class` parameter description
- Document valid values: `economy`, `business`, `galaxium`
- Update example requests to include seat class
- Document new error codes: `INVALID_SEAT_CLASS`

## Error Handling

New error scenarios:
- Invalid seat class value
- Specific class sold out (but other classes available)
- Price mismatch (if client tries to manipulate pricing)

## Dependencies

**Requires**:
- Plan 1: Database Schema Changes (MUST be completed first)

**Blocks**:
- Plan 3: Frontend UI Changes (frontend needs updated API)

## Estimated Effort

- Service layer updates: 1 hour
- API endpoint updates: 30 minutes
- MCP tool updates: 20 minutes
- Test updates: 1 hour
- Documentation: 20 minutes
- **Total**: ~3 hours

## Rollout Strategy

1. Complete Plan 1 (database schema)
2. Update service layer with seat class logic
3. Update and run tests to verify logic
4. Update REST endpoints
5. Update MCP tools
6. Test end-to-end with API client (Postman/curl)
7. Update API documentation
8. Ready for frontend integration (Plan 3)