# Test Data Documentation

API Base URL: `http://generic-prime.minilab/api/specs/v1`

## Endpoints

### GET /vehicles/details

Main endpoint for vehicle data with filtering, pagination, sorting, and highlight support.

## Query Parameters

### Filter Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `manufacturer` | string | Filter by manufacturer name | `manufacturer=Ford` |
| `model` | string | Filter by model name | `model=Mustang` |
| `yearMin` | number | Minimum year (inclusive) | `yearMin=2010` |
| `yearMax` | number | Maximum year (inclusive) | `yearMax=2024` |
| `bodyClass` | string | Filter by body class | `bodyClass=SUV` |
| `instanceCountMin` | number | Minimum instance count | `instanceCountMin=5` |
| `instanceCountMax` | number | Maximum instance count | `instanceCountMax=100` |
| `search` | string | Full-text search | `search=mustang` |
| `models` | string | Comma-separated manufacturer:model pairs | `models=Ford:Mustang,Chevrolet:Camaro` |

### Pagination Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number (1-indexed) |
| `size` | number | 25 | Results per page |

### Sorting Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sortBy` | string | null | Field to sort by: `manufacturer`, `model`, `year`, `bodyClass`, `instanceCount` |
| `sortOrder` | string | `asc` | Sort direction: `asc` or `desc` |

### Highlight Parameters (h_* prefix)

Highlight parameters create segmented statistics showing total vs highlighted counts.

| Parameter | Type | Description |
|-----------|------|-------------|
| `h_manufacturer` | string | Highlight specific manufacturer |
| `h_yearMin` | number | Highlight year range start |
| `h_yearMax` | number | Highlight year range end |
| `h_bodyClass` | string | Highlight body class |
| `h_modelCombos` | string | Highlight model combinations |

## Sample API Calls

### 1. Default (no filters)
```bash
curl "http://generic-prime.minilab/api/specs/v1/vehicles/details?size=10"
```
Response: `vehicles-default.json`

### 2. Filter by Manufacturer
```bash
curl "http://generic-prime.minilab/api/specs/v1/vehicles/details?manufacturer=Ford&size=10"
```
Response: `vehicles-ford.json`

### 3. Filter by Year Range
```bash
curl "http://generic-prime.minilab/api/specs/v1/vehicles/details?yearMin=2020&yearMax=2024&size=10"
```
Response: `vehicles-recent-years.json`

### 4. Filter by Body Class
```bash
curl "http://generic-prime.minilab/api/specs/v1/vehicles/details?bodyClass=Pickup&size=10"
```
Response: `vehicles-pickup.json`

### 5. Model Combinations
```bash
curl "http://generic-prime.minilab/api/specs/v1/vehicles/details?models=Ford:Mustang,Chevrolet:Camaro&size=10"
```
Response: `vehicles-model-combos.json`

### 6. Pagination and Sorting
```bash
curl "http://generic-prime.minilab/api/specs/v1/vehicles/details?page=2&size=10&sortBy=year&sortOrder=desc"
```
Response: `vehicles-paginated-sorted.json`

### 7. Highlight Manufacturer
```bash
curl "http://generic-prime.minilab/api/specs/v1/vehicles/details?h_manufacturer=Tesla&size=10"
```
Response: `vehicles-highlight-manufacturer.json`

### 8. Filter with Highlight
```bash
curl "http://generic-prime.minilab/api/specs/v1/vehicles/details?manufacturer=Ford&h_yearMin=2015&h_yearMax=2020&size=10"
```
Response: `vehicles-filter-with-highlight.json`

### 9. Combined Filters
```bash
curl "http://generic-prime.minilab/api/specs/v1/vehicles/details?manufacturer=Chevrolet&yearMin=2010&yearMax=2020&bodyClass=SUV&size=10"
```
Response: `vehicles-combined-filters.json`

## Response Structure

```json
{
  "total": 4887,
  "page": 1,
  "size": 10,
  "totalPages": 489,
  "query": {
    "modelCombos": [],
    "filters": {},
    "sortBy": null,
    "sortOrder": "asc"
  },
  "results": [
    {
      "vehicle_id": "nhtsa-ford-mustang-2020",
      "manufacturer": "Ford",
      "model": "Mustang",
      "year": 2020,
      "body_class": "Coupe",
      "data_source": "synthetic_historical",
      "ingested_at": "2025-11-02T07:40:42.195234",
      "instance_count": 12
    }
  ],
  "statistics": {
    "byManufacturer": { "Chevrolet": 849, "Ford": 665 },
    "modelsByManufacturer": { "Chevrolet": { "Camaro": 59 } },
    "byYearRange": { "2020": 58, "2021": 55 },
    "byBodyClass": { "Sedan": 1500, "SUV": 800 },
    "totalCount": 4887
  }
}
```

## Statistics with Highlights

When using `h_*` parameters, statistics show segmented counts:

```json
{
  "statistics": {
    "byManufacturer": {
      "Ford": { "total": 665, "highlighted": 61 },
      "Chevrolet": { "total": 849, "highlighted": 0 }
    }
  }
}
```

## Available Values

### Manufacturers (Top 15)
- Chevrolet (849)
- Ford (665)
- Buick (480)
- Chrysler (415)
- Dodge (390)
- Cadillac (361)
- Pontiac (326)
- Lincoln (307)
- Jeep (299)
- GMC (285)
- Plymouth (169)
- International (100)
- Tesla (50)
- WHITEGMC (26)
- Ram-Lin (22)

### Body Classes
- Sedan
- SUV
- Coupe
- Pickup
- Van
- Hatchback
- Sports Car
- Touring Car
- Wagon
- Convertible
- Truck
- Limousine

### Year Range
- Earliest: 1908
- Latest: 2024
- Total distinct years: ~116
