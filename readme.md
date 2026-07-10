# Store Rating Platform — API Documentation

Base URL (local dev): `http://localhost:5000/api`

## Contents
- [Auth](#auth)
- [Admin](#admin) (role: `ADMIN`)
- [Normal User](#normal-user) (role: `NORMAL_USER`)
- [Store Owner](#store-owner) (role: `STORE_OWNER`)
- [Error Format](#error-format)
- [Data Models](#data-models)

---

## Authentication

Every route except `POST /auth/signup` and `POST /auth/login` requires a JWT sent as:

```
Authorization: Bearer <token>
```

Tokens are returned by `/auth/login` and `/auth/signup`, and expire after `JWT_EXPIRES_IN`
(default 7 days, set in `.env`). A route also enforces **role**, e.g. `/admin/*` routes
reject any token whose `role` isn't `ADMIN` with `403`.

---

## Auth

### `POST /auth/signup`
Public. Always creates a `NORMAL_USER` account.

**Body**
```json
{
  "name": "A valid full name between 20 and 60 chars",
  "email": "user@example.com",
  "address": "123 Example Street, City",
  "password": "Passw0rd!"
}
```

**Success `201`**
```json
{
  "token": "eyJhbGciOi...",
  "user": { "id": 1, "name": "...", "email": "...", "role": "NORMAL_USER" }
}
```

**Errors**
- `400` — field-level validation errors: `{ "errors": { "name": "...", "email": "...", "address": "...", "password": "..." } }`
- `409` — email already registered

---

### `POST /auth/login`
Public.

**Body**
```json
{ "email": "user@example.com", "password": "Passw0rd!" }
```

**Success `200`**
```json
{
  "token": "eyJhbGciOi...",
  "user": { "id": 1, "name": "...", "email": "...", "role": "ADMIN" }
}
```

**Errors**
- `400` — missing email/password
- `401` — invalid credentials

---

### `PUT /auth/update-password`
Auth required (any role).

**Body**
```json
{ "currentPassword": "OldPassw0rd!", "newPassword": "NewPassw0rd!" }
```

**Success `200`**
```json
{ "message": "Password updated successfully" }
```

**Errors**
- `400` — new password fails validation (8-16 chars, 1 uppercase, 1 special char)
- `401` — current password incorrect

---

### `GET /auth/me`
Auth required. Returns the logged-in user's own profile.

**Success `200`**
```json
{ "user": { "id": 1, "name": "...", "email": "...", "address": "...", "role": "NORMAL_USER" } }
```

---

## Admin
All routes below require `Authorization: Bearer <token>` for a user with `role: "ADMIN"`.

### `GET /admin/dashboard`
Platform-wide summary stats.

**Success `200`**
```json
{ "totalUsers": 42, "totalStores": 10, "totalRatings": 133 }
```

---

### `POST /admin/users`
Create a user of any role.

**Body**
```json
{
  "name": "A valid full name between 20 and 60 chars",
  "email": "new.user@example.com",
  "password": "Passw0rd!",
  "address": "123 Example Street",
  "role": "STORE_OWNER"
}
```
`role` accepts `ADMIN`, `NORMAL_USER`, or `STORE_OWNER` (defaults to `NORMAL_USER` if omitted/invalid).

**Success `201`**
```json
{ "user": { "id": 5, "name": "...", "email": "...", "address": "...", "role": "STORE_OWNER" } }
```

**Errors:** `400` (validation), `409` (email exists)

---

### `GET /admin/users`
List users with optional filters and sorting.

**Query params** (all optional)
| param | notes |
|---|---|
| `name` | partial, case-insensitive |
| `email` | partial, case-insensitive |
| `address` | partial, case-insensitive |
| `role` | exact match: `ADMIN` \| `NORMAL_USER` \| `STORE_OWNER` |
| `sortBy` | `name` \| `email` \| `address` \| `role` \| `createdAt` (default `name`) |
| `sortOrder` | `asc` \| `desc` (default `asc`) |

Example: `GET /admin/users?role=STORE_OWNER&sortBy=email&sortOrder=desc`

**Success `200`**
```json
{
  "users": [
    { "id": 2, "name": "...", "email": "...", "address": "...", "role": "NORMAL_USER", "createdAt": "..." }
  ]
}
```

---

### `GET /admin/users/:id`
Full detail for one user. If the user is a `STORE_OWNER`, includes their store's average rating.

**Success `200`**
```json
{
  "user": { "id": 5, "name": "...", "email": "...", "address": "...", "role": "STORE_OWNER", "createdAt": "..." },
  "rating": "4.50"
}
```
`rating` is `null` for non-store-owners or store owners with no store/no ratings yet.

**Errors:** `404` — user not found

---

### `POST /admin/stores`
Create a store, optionally assigning an existing `STORE_OWNER` user.

**Body**
```json
{
  "name": "My Store",
  "email": "store@example.com",
  "address": "456 Market Road",
  "ownerId": 5
}
```
`ownerId` is optional; if provided it must belong to an existing user with `role: "STORE_OWNER"`.

**Success `201`**
```json
{ "store": { "id": 3, "name": "My Store", "email": "store@example.com", "address": "...", "ownerId": 5 } }
```

**Errors:** `400` (validation, or `ownerId` invalid/not a store owner), `409` (store email exists)

---

### `GET /admin/stores`
List stores with computed average rating, filters, and sorting.

**Query params**
| param | notes |
|---|---|
| `name` | partial, case-insensitive |
| `email` | partial, case-insensitive |
| `address` | partial, case-insensitive |
| `sortBy` | `name` \| `email` \| `address` \| `createdAt` (default `name`) |
| `sortOrder` | `asc` \| `desc` (default `asc`) |

**Success `200`**
```json
{
  "stores": [
    { "id": 3, "name": "My Store", "email": "...", "address": "...", "averageRating": "4.50", "ratingCount": 12 }
  ]
}
```

---

### `GET /admin/store-owners`
Lightweight list used to populate "assign owner" dropdowns.

**Success `200`**
```json
{ "owners": [ { "id": 5, "name": "...", "email": "..." } ] }
```

---

## Normal User
Requires `role: "NORMAL_USER"`.

### `GET /user/stores`
Browse/search stores, with each store's overall average rating and the caller's own rating (if any).

**Query params**
| param | notes |
|---|---|
| `name` | partial, case-insensitive |
| `address` | partial, case-insensitive |
| `sortBy` | `name` \| `address` \| `createdAt` (default `name`) |
| `sortOrder` | `asc` \| `desc` (default `asc`) |

**Success `200`**
```json
{
  "stores": [
    {
      "id": 3,
      "name": "My Store",
      "email": "store@example.com",
      "address": "456 Market Road",
      "averageRating": "4.50",
      "myRating": 5
    }
  ]
}
```
`myRating` is `null` if the caller hasn't rated that store yet.

---

### `POST /user/ratings`
Submit a new rating or update an existing one (upsert, one rating per user per store).

**Body**
```json
{ "storeId": 3, "value": 4 }
```

**Success**
- `201` (first-time rating) or `200` (updated existing rating):
```json
{ "rating": { "id": 10, "userId": 2, "storeId": 3, "value": 4 } }
```

**Errors:** `400` — `value` not an integer 1-5; `404` — store not found

---

## Store Owner
Requires `role: "STORE_OWNER"`.

### `GET /store-owner/dashboard`
Returns the caller's own store, its average rating, and everyone who has rated it.

**Success `200`**
```json
{
  "store": { "id": 3, "name": "My Store", "email": "...", "address": "..." },
  "averageRating": "4.50",
  "raters": [
    { "userId": 2, "name": "...", "email": "...", "rating": 4, "ratedAt": "2026-07-01T10:00:00.000Z" }
  ]
}
```

**Errors:** `404` — no store is associated with this account yet (owner not yet assigned to a store)

---

## Error Format

Most errors follow one of these shapes:

```json
{ "message": "Human-readable error message" }
```
or, for field-level validation failures:
```json
{ "errors": { "fieldName": "message", "otherField": "message" } }
```

**Common status codes**
| Code | Meaning |
|---|---|
| 400 | Validation error / bad input |
| 401 | Missing/invalid/expired token, or wrong credentials |
| 403 | Authenticated, but role not permitted for this route |
| 404 | Resource not found |
| 409 | Conflict (duplicate email) |
| 500 | Unexpected server error |

---

## Data Models

**User**
```
id, name, email, password (hashed, never returned), address, role (ADMIN|NORMAL_USER|STORE_OWNER), createdAt, updatedAt
```

**Store**
```
id, name, email, address, ownerId (nullable FK -> User), createdAt, updatedAt
```

**Rating**
```
id, userId (FK -> User), storeId (FK -> Store), value (1-5), createdAt, updatedAt
unique constraint: (userId, storeId)
```

---

## Quick Reference Table

| Method | Endpoint | Role | Purpose |
|---|---|---|---|
| POST | /auth/signup | Public | Register as Normal User |
| POST | /auth/login | Public | Log in, get JWT |
| PUT | /auth/update-password | Any | Change own password |
| GET | /auth/me | Any | Get own profile |
| GET | /admin/dashboard | Admin | Platform stats |
| POST | /admin/users | Admin | Create user (any role) |
| GET | /admin/users | Admin | List/filter/sort users |
| GET | /admin/users/:id | Admin | User detail (+ rating if Store Owner) |
| POST | /admin/stores | Admin | Create store |
| GET | /admin/stores | Admin | List/filter/sort stores |
| GET | /admin/store-owners | Admin | List users with role Store Owner |
| GET | /user/stores | Normal User | Browse/search stores + own rating |
| POST | /user/ratings | Normal User | Submit or update a rating |
| GET | /store-owner/dashboard | Store Owner | Own store's raters + average |


# Store Rating Platform

Full-stack web app where Normal Users rate Stores (1-5), Store Owners see feedback on
their store, and a System Administrator manages the whole platform. Single login,
role-based access.

## Tech Stack
- **Backend:** Express.js + Sequelize (MySQL)
- **Frontend:** React (Vite) + React Router + Axios
- **Auth:** JWT, bcrypt password hashing

## Project Structure
```
store-rating-app/
  backend/     Express API, Sequelize models, JWT auth
  frontend/    React app (Vite)
```

## Database Schema

**users**
| column     | type                                  | notes                          |
|------------|---------------------------------------|---------------------------------|
| id         | serial PK                             |                                  |
| name       | varchar(60)                           | 20–60 chars                     |
| email      | varchar(255) unique                   |                                  |
| password   | varchar (bcrypt hash)                 |                                  |
| address    | varchar(400)                          |                                  |
| role       | enum: ADMIN, NORMAL_USER, STORE_OWNER |                                  |

**stores**
| column    | type          | notes                              |
|-----------|---------------|-------------------------------------|
| id        | serial PK     |                                      |
| name      | varchar(60)   |                                      |
| email     | varchar(255)  | unique                              |
| address   | varchar(400)  |                                      |
| owner_id  | FK -> users.id| nullable, must reference STORE_OWNER|

**ratings**
| column    | type      | notes                                |
|-----------|-----------|----------------------------------------|
| id        | serial PK |                                        |
| user_id   | FK -> users.id  |                                  |
| store_id  | FK -> stores.id |                                  |
| value     | integer   | 1–5, unique per (user_id, store_id)   |

A unique index on `(user_id, store_id)` in `ratings` is what allows "submit vs. modify"
rating to be a single upsert operation, and is the cleanest way to guarantee one rating
per user per store at the database level.

## Setup

### 1. Database
Create a MySQL database:
```sql
CREATE DATABASE store_ratings;
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# edit .env with your DB credentials and a real JWT_SECRET
npm install
npm run seed     # creates the first Admin account (from .env values)
npm run dev       # starts on http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev       # starts on http://localhost:3000, proxies /api to :5000
```

Log in with the seeded admin credentials (see `.env`), or sign up as a Normal User at
`/signup`. Admins can create Store Owner accounts and stores from the Admin panel.

## Key Design Decisions
- **Single users table with a `role` enum** rather than three separate tables — all
  three roles share the same auth flow (email/password + JWT), so one table with a
  role discriminator avoids duplicated login logic while `role` middleware still
  enforces per-endpoint access control.
- **One store per owner** (`stores.owner_id`) keeps the Store Owner dashboard query
  trivial; this matches the spec, which doesn't describe owners managing multiple
  stores.
- **Rating is an upsert** (`findOrCreate` + update) enforced by a DB-level unique
  constraint on `(user_id, store_id)`, so "submit a rating" and "modify a rating" are
  the same API call and can never be duplicated even under a race condition.
- **All list endpoints accept `name`, `email`, `address`, `sortBy`, `sortOrder`
  query params** and use partial matching (`LIKE`), satisfying the filtering and
  sorting requirement uniformly across Users and Stores. MySQL's default collation
  (`utf8mb4_general_ci` / `utf8mb4_0900_ai_ci`) makes `LIKE` case-insensitive already,
  so behavior matches what you'd get from Postgres's `ILIKE`.
- **Validation lives in one shared `utils/validators.js`** on the backend (name 20–60,
  address ≤400, password 8–16 with uppercase + special char, standard email) and is
  mirrored on the frontend for instant feedback, but the backend is the source of
  truth — it re-validates and rejects even if the frontend is bypassed.