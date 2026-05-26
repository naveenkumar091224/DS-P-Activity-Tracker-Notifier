# Flight Search & Filters - MVP Plan

## Problem Statement
Users cannot easily find flights matching their specific needs (destination, dates, price range, seat class availability). They must scroll through all flights to find suitable options.

## User Story
**As a** space traveler  
**I want to** search and filter flights by destination, date, price, and seat class  
**So that** I can quickly find flights that match my travel needs

## Success Metrics
- **Primary:** 80% of users use search/filters before booking
- **Secondary:** Average time to booking reduced by 40%
- **Tertiary:** Filter usage rate >60%

## MVP Scope

### Must Have
1. **Search by Destination**
   - Origin dropdown/autocomplete
   - Destination dropdown/autocomplete
   - Clear search button

2. **Date Range Filter**
   - Departure date range picker
   - "Flexible dates" option

3. **Price Range Filter**
   - Min/max price sliders
   - Show price in selected currency

4. **Seat Class Filter**
   - Checkboxes: Economy, Business, Galaxium
   - Show only flights with availability in selected classes

5. **Sort Options**
   - Price (low to high / high to low)
   - Departure date (earliest / latest)
   - Duration (shortest / longest)

### Won't Have (Future)
- Multi-city search
- Nearby airports
- Flexible destination ("anywhere")
- Price alerts
- Search history

## Technical Design

### Backend Changes

**Endpoint:** `GET /flights`

**Query Parameters:**
```typescript
{
  origin?: string           // Filter by origin
  destination?: string      // Filter by destination
  min_price?: number       // Minimum price (any class)
  max_price?: number       // Maximum price (any class)
  departure_after?: string // ISO date
  departure_before?: string // ISO date
  seat_classes?: string    // Comma-separated: "economy,business,galaxium"
  sort_by?: string         // "price_asc|price_desc|date_asc|date_desc|duration_asc|duration_desc"
}
```

**Service Layer:**
- Update `services/flight.py::get_flights()` to accept filter parameters
- Implement SQLAlchemy query filters
- Add sorting logic

### Frontend Changes

**New Components:**
1. `FlightSearchBar.tsx` - Search by origin/destination
2. `FlightFilters.tsx` - Price, date, class filters
3. `FlightSortDropdown.tsx` - Sort options

**Updated Components:**
- `Flights.tsx` - Integrate search/filter components
- `api.ts` - Add query parameters to `getFlights()`

**State Management:**
```typescript
interface FlightFilters {
  origin: string;
  destination: string;
  minPrice: number;
  maxPrice: number;
  departureAfter: string;
  departureBefore: string;
  seatClasses: ('economy' | 'business' | 'galaxium')[];
  sortBy: string;
}
```

## UI/UX Design

### Layout
```
┌─────────────────────────────────────────┐
│  Search: [Origin] → [Destination] [🔍] │
├─────────────────────────────────────────┤
│  Filters: [Price] [Dates] [Classes]    │
│  Sort by: [Dropdown ▼]                 │
├─────────────────────────────────────────┤
│  Results: X flights found               │
│  ┌───────────────────────────────────┐ │
│  │ Flight Card                       │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Interactions
- Real-time filtering (debounced 300ms)
- Clear all filters button
- Active filter count badge
- Empty state: "No flights match your criteria"

## Implementation Checklist

### Backend (2-3 hours)
- [ ] Update `services/flight.py` with filter logic
- [ ] Add query parameter validation in `server.py`
- [ ] Test filtering with various combinations
- [ ] Update API documentation

### Frontend (3-4 hours)
- [ ] Create `FlightSearchBar` component
- [ ] Create `FlightFilters` component
- [ ] Create `FlightSortDropdown` component
- [ ] Update `Flights` page with new components
- [ ] Add filter state management
- [ ] Update `api.ts` with query parameters
- [ ] Add JSDoc comments
- [ ] Test responsive design

### Testing
- [ ] Backend: Test all filter combinations
- [ ] Frontend: Test search/filter interactions
- [ ] Edge cases: No results, invalid dates, etc.

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Performance with many filters | Medium | Add database indexes, implement pagination |
| Complex filter UI on mobile | Medium | Collapsible filter panel, bottom sheet |
| Date picker library size | Low | Use lightweight library or native input |

## Future Enhancements
1. Save search preferences
2. Recent searches
3. Popular routes
4. Price trend graphs
5. Email alerts for price drops