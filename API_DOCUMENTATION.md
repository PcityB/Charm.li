# Charm Scraper API Documentation

This API provides endpoints to identify vehicles using their VIN and scrape repair, labor, and diagnostic trouble codes (DTC) data from Charm.li.

## Base URL

All endpoints are relative to the base URL of the deployed application (e.g., `http://localhost:3000`).

## Endpoints

### 1. Identify Vehicle

Identifies a vehicle by its VIN using the NHTSA API and finds the corresponding Charm.li base URL.

**Endpoint:** `/api/vehicle/identify`
**Method:** `GET`

**Query Parameters:**

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `vin` | `string` | Yes | The Vehicle Identification Number (VIN) of the vehicle. |

**Success Response (200 OK):**

```json
{
  "status": "found",
  "nhtsa_data": {
    "year": "2012",
    "make": "CHEVROLET",
    "model": "CAMARO"
  },
  "charm_base_url": "https://charm.li/Chevy/2012/Camaro%20V6-3.6L/"
}
```

**Error Responses:**

*   **400 Bad Request:**
    *   `{ "error": "VIN is required" }`
    *   `{ "status": "not_found", "error": "Failed to decode VIN" }`
*   **404 Not Found:**
    *   `{ "status": "not_found", "error": "Could not find make match for CHEVROLET" }`
*   **500 Internal Server Error:**
    *   `{ "status": "not_found", "error": "Internal Server Error" }`

---

### 2. Get Labor Categories

Scrapes labor categories for a given Charm.li base URL.

**Endpoint:** `/api/vehicle/labor`
**Method:** `GET`

**Query Parameters:**

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `baseUrl` | `string` | Yes | The Charm.li base URL returned by the identify endpoint. |

**Success Response (200 OK):**

```json
{
  "categories": [
    {
      "category": "Body and Frame",
      "url": "https://charm.li/Chevy/2012/Camaro%20V6-3.6L/Parts%20and%20Labor/Body%20and%20Frame/"
    },
    {
      "category": "Brakes and Traction Control",
      "url": "https://charm.li/Chevy/2012/Camaro%20V6-3.6L/Parts%20and%20Labor/Brakes%20and%20Traction%20Control/"
    }
    // ... more categories
  ]
}
```

**Error Responses:**

*   **400 Bad Request:**
    *   `{ "error": "baseUrl is required" }`
*   **500 Internal Server Error:**
    *   `{ "error": "Failed to scrape labor directory" }`

---

### 3. Get Repair Categories

Scrapes repair categories for a given Charm.li base URL.

**Endpoint:** `/api/vehicle/repair`
**Method:** `GET`

**Query Parameters:**

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `baseUrl` | `string` | Yes | The Charm.li base URL returned by the identify endpoint. |

**Success Response (200 OK):**

```json
{
  "categories": [
    {
      "category": "Accessories and Optional Equipment",
      "url": "https://charm.li/Chevy/2012/Camaro%20V6-3.6L/Repair%20and%20Diagnosis/Accessories%20and%20Optional%20Equipment/"
    },
    {
      "category": "Body and Frame",
      "url": "https://charm.li/Chevy/2012/Camaro%20V6-3.6L/Repair%20and%20Diagnosis/Body%20and%20Frame/"
    }
    // ... more categories
  ]
}
```

**Error Responses:**

*   **400 Bad Request:**
    *   `{ "error": "baseUrl is required" }`
*   **500 Internal Server Error:**
    *   `{ "error": "Failed to scrape repair directory" }`

---

### 4. Get Diagnostic Trouble Codes (DTC)

Scrapes DTC categories for a given Charm.li base URL.

**Endpoint:** `/api/vehicle/dtc`
**Method:** `GET`

**Query Parameters:**

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `baseUrl` | `string` | Yes | The Charm.li base URL returned by the identify endpoint. |

**Success Response (200 OK):**

```json
{
  "categories": [
    {
      "category": "P Code Charts",
      "url": "https://charm.li/Chevy/2012/Camaro%20V6-3.6L/Repair%20and%20Diagnosis/A%20L%20L%20%20Diagnostic%20Trouble%20Codes%20%28%20DTC%20%29/P%20Code%20Charts/"
    },
    {
      "category": "U Code Charts",
      "url": "https://charm.li/Chevy/2012/Camaro%20V6-3.6L/Repair%20and%20Diagnosis/A%20L%20L%20%20Diagnostic%20Trouble%20Codes%20%28%20DTC%20%29/U%20Code%20Charts/"
    }
    // ... more categories
  ]
}
```

**Error Responses:**

*   **400 Bad Request:**
    *   `{ "error": "baseUrl is required" }`
*   **500 Internal Server Error:**
    *   `{ "error": "Failed to scrape DTC directory" }`
