# 052: Automobile Endpoints

**Status:** Reference
**Depends On:** 051-api-contract-overview
**Blocks:** 401-403 (Domain Models), 501-503 (Domain Adapters)

---

## Objective

Document every API endpoint used by the automobile domain, including:
- Request URL and method
- Query parameters
- Complete response JSON shapes
- Example requests and responses

This document is the source of truth for building TypeScript models and adapters.

---

## Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/vehicles/details` | GET | Search vehicles with pagination and statistics |
| `/statistics` | GET | Fetch statistics only (without vehicle data) |

---

## Endpoint: GET /vehicles/details

The primary endpoint for vehicle discovery. Returns paginated vehicle results with aggregated statistics.

### Request

**URL:** `{baseUrl}/vehicles/details`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `manufacturer` | string | No | Filter by manufacturer name (partial match) |
| `model` | string | No | Filter by model name (partial match) |
| `yearMin` | number | No | Minimum year (inclusive) |
| `yearMax` | number | No | Maximum year (inclusive) |
| `bodyClass` | string | No | Filter by body class (can be comma-separated for multiple) |
| `instanceCountMin` | number | No | Minimum VIN instance count |
| `instanceCountMax` | number | No | Maximum VIN instance count |
| `search` | string | No | Global search across all fields |
| `models` | string | No | Model combinations: `Manufacturer:Model,Manufacturer:Model` |
| `page` | number | No | Page number (default: 1) |
| `size` | number | No | Items per page (default: 20) |
| `sortBy` | string | No | Sort field |
| `sortOrder` | string | No | Sort direction: `asc` or `desc` |
| `h_yearMin` | number | No | Highlight: minimum year |
| `h_yearMax` | number | No | Highlight: maximum year |
| `h_manufacturer` | string | No | Highlight: manufacturer |
| `h_modelCombos` | string | No | Highlight: model combinations |
| `h_bodyClass` | string | No | Highlight: body class |

### Example Request

```
GET /vehicles/details?manufacturer=Toyota&yearMin=2020&yearMax=2024&page=1&size=20&sortBy=year&sortOrder=desc
```

### Response Shape

```typescript
{
  "results": VehicleResult[],
  "total": number,
  "page": number,
  "size": number,
  "totalPages": number,
  "statistics": VehicleStatistics
}
```

### Example Response

```json
{
  "results": [
    {
      "vehicle_id": "TOY-CAM-2024-SED",
      "manufacturer": "Toyota",
      "model": "Camry",
      "year": 2024,
      "body_class": "Sedan",
      "instance_count": 156,
      "first_seen": "2024-01-15T10:30:00Z",
      "last_seen": "2024-11-20T14:22:00Z",
      "drive_type": "FWD",
      "engine": "I4",
      "transmission": "Automatic",
      "fuel_type": "Gasoline"
    },
    {
      "vehicle_id": "TOY-RAV-2024-SUV",
      "manufacturer": "Toyota",
      "model": "RAV4",
      "year": 2024,
      "body_class": "SUV",
      "instance_count": 234,
      "first_seen": "2024-02-10T08:15:00Z",
      "last_seen": "2024-11-19T16:45:00Z",
      "drive_type": "AWD",
      "engine": "I4",
      "transmission": "Automatic",
      "fuel_type": "Hybrid"
    }
  ],
  "total": 234,
  "page": 1,
  "size": 20,
  "totalPages": 12,
  "statistics": {
    "totalCount": 234,
    "byManufacturer": {
      "Toyota": { "total": 234, "highlighted": 234 }
    },
    "byBodyClass": {
      "Sedan": { "total": 89, "highlighted": 89 },
      "SUV": { "total": 78, "highlighted": 78 },
      "Truck": { "total": 45, "highlighted": 45 },
      "Coupe": { "total": 22, "highlighted": 22 }
    },
    "byYear": {
      "2024": { "total": 67, "highlighted": 67 },
      "2023": { "total": 58, "highlighted": 58 },
      "2022": { "total": 52, "highlighted": 52 },
      "2021": { "total": 34, "highlighted": 34 },
      "2020": { "total": 23, "highlighted": 23 }
    },
    "modelsByManufacturer": {
      "Toyota": {
        "Camry": { "total": 45, "highlighted": 45 },
        "RAV4": { "total": 52, "highlighted": 52 },
        "Corolla": { "total": 38, "highlighted": 38 },
        "Highlander": { "total": 29, "highlighted": 29 }
      }
    }
  }
}
```

---

## VehicleResult Object

Each item in the `results` array has this shape:

```typescript
interface VehicleResult {
  // Required fields
  vehicle_id: string;      // Unique ID: "MANUFACTURER-MODEL-YEAR-BODYCLASS"
  manufacturer: string;    // e.g., "Toyota", "Honda", "Ford"
  model: string;           // e.g., "Camry", "Accord", "F-150"
  year: number;            // e.g., 2024
  body_class: string;      // e.g., "Sedan", "SUV", "Truck"
  instance_count: number;  // Number of VINs for this vehicle config

  // Optional fields
  first_seen?: string;     // ISO 8601 datetime
  last_seen?: string;      // ISO 8601 datetime
  drive_type?: string;     // e.g., "FWD", "RWD", "AWD", "4WD"
  engine?: string;         // e.g., "V6", "I4", "V8", "Electric"
  transmission?: string;   // e.g., "Automatic", "Manual", "CVT"
  fuel_type?: string;      // e.g., "Gasoline", "Diesel", "Electric", "Hybrid"
  vehicle_class?: string;  // e.g., "Passenger Car", "Light Truck"
}
```

### Field Notes

| Field | Format | Example |
|-------|--------|---------|
| `vehicle_id` | `{MFR}-{MODEL}-{YEAR}-{BODY}` | `TOY-CAM-2024-SED` |
| `year` | 4-digit integer | `2024` |
| `instance_count` | Non-negative integer | `156` |
| `first_seen` | ISO 8601 | `2024-01-15T10:30:00Z` |
| `body_class` | Title case | `Sedan`, `SUV`, `Truck` |

---

## Statistics Object

The `statistics` field in the response contains aggregated data for charts and summaries.

### Structure

```typescript
interface VehicleStatistics {
  // Total count of vehicles matching filters
  totalCount: number;

  // Segmented by manufacturer: { "Toyota": { total, highlighted }, ... }
  byManufacturer: Record<string, { total: number; highlighted: number }>;

  // Segmented by body class: { "Sedan": { total, highlighted }, ... }
  byBodyClass: Record<string, { total: number; highlighted: number }>;

  // Segmented by year: { "2024": { total, highlighted }, ... }
  byYear: Record<string, { total: number; highlighted: number }>;

  // Models nested under manufacturers
  modelsByManufacturer: Record<string, Record<string, { total: number; highlighted: number }>>;
}
```

### Segmented Statistics Explained

Each statistic entry contains:
- `total`: Count of all items in this category
- `highlighted`: Count of items matching highlight filters (h_* parameters)

**Example without highlights:**
```json
{
  "byManufacturer": {
    "Toyota": { "total": 234, "highlighted": 234 },
    "Honda": { "total": 187, "highlighted": 187 }
  }
}
```
When no highlight filters are applied, `highlighted` equals `total`.

**Example with highlights (`h_yearMin=2022&h_yearMax=2024`):**
```json
{
  "byManufacturer": {
    "Toyota": { "total": 234, "highlighted": 156 },
    "Honda": { "total": 187, "highlighted": 98 }
  }
}
```
Only 156 of Toyota's 234 vehicles fall within 2022-2024.

---

## Endpoint: GET /statistics

Fetches statistics only, without vehicle data. Useful for refreshing charts without reloading the table.

### Request

**URL:** `{baseUrl}/statistics`

**Query Parameters:** Same filter parameters as `/vehicles/details` (excluding `page`, `size`, `sortBy`, `sortOrder`)

### Example Request

```
GET /statistics?manufacturer=Toyota&yearMin=2020
```

### Response Shape

Same as the `statistics` object from `/vehicles/details`.

---

## URL Parameter Mapping

This table maps URL query parameters to filter object properties:

| URL Parameter | Filter Property | Type |
|---------------|-----------------|------|
| `manufacturer` | `manufacturer` | string |
| `model` | `model` | string |
| `yearMin` | `yearMin` | number |
| `yearMax` | `yearMax` | number |
| `bodyClass` | `bodyClass` | string |
| `instanceCountMin` | `instanceCountMin` | number |
| `instanceCountMax` | `instanceCountMax` | number |
| `search` | `search` | string |
| `models` | `modelCombos` | string |
| `page` | `page` | number |
| `size` | `size` | number |
| `sortBy` | `sort` | string |
| `sortOrder` | `sortDirection` | string |

**Note:** The URL uses `models` but the filter object uses `modelCombos`. The adapter handles this translation.

---

## Model Combinations Format

The `models` parameter (and `h_modelCombos` highlight parameter) uses a specific format:

```
Manufacturer:Model,Manufacturer:Model,...
```

**Examples:**
- Single model: `Ford:F-150`
- Multiple models: `Ford:F-150,Toyota:Camry,Honda:Accord`
- Same manufacturer, different models: `Toyota:Camry,Toyota:Corolla`

---

## Field Name Conventions

The API uses **snake_case** for field names:
- `vehicle_id`, `body_class`, `instance_count`, `first_seen`, `last_seen`
- `fuel_type`, `drive_type`, `vehicle_class`

The frontend models use **camelCase** internally, with adapters handling the translation.

---

## Next Step

Proceed to `053-naming-conventions.md` to understand which code is framework (reusable across domains) vs domain-specific (automobile only).
