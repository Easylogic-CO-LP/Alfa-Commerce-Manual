---
sidebar_position: 1
title: API Overview
---

# REST API Overview

Alfa Commerce provides a comprehensive JSON-API through Joomla's webservices system. The API follows JSON:API specification.

## Authentication

The API uses Joomla's authentication system. Authenticate using:
- **API Token** (recommended) — Generate in Joomla user profile
- **Basic Auth** — Username and password
- **Session** — For frontend JavaScript calls

## Base URL

```
https://your-site.com/api/index.php/v1/alfa/
```

## Response Format

All responses follow JSON:API format:

```json
{
  "data": [
    {
      "type": "items",
      "id": "123",
      "attributes": {
        "name": "Product Name",
        "sku": "PROD-001",
        "price": 19.99
      }
    }
  ],
  "links": {
    "self": "/api/index.php/v1/alfa/items"
  }
}
```

## Postman Collection

Explore the API interactively using our Postman collection:

[![Run in Postman](https://run.pstmn.io/button.svg)](https://null.postman.co/collection/40562641-db6c701d-6cee-4955-96b3-d357447b9bfe)
