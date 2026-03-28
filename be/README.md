# 🥦 Vegefoods API

Full REST API for the Vegefoods eCommerce platform.  
**Stack:** Node.js · Express 4 · Firebase Firestore · Firebase Storage · JWT

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in your values
cp .env.example .env

# 3. Start dev server (nodemon)
npm run dev

# 4. Or production
npm start
```

---

## ⚙️ Environment Variables (`.env`)

| Variable | Description |
|---|---|
| `PORT` | Server port (default `4000`) |
| `NODE_ENV` | `development` or `production` |
| `CLIENT_URL` | Frontend URL for CORS |
| `JWT_SECRET` | Secret key for access tokens |
| `JWT_EXPIRES_IN` | Access token expiry (e.g. `7d`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry (e.g. `30d`) |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Service account client email |
| `FIREBASE_PRIVATE_KEY` | Service account private key |
| `FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket name |

---

## 📁 Project Structure

```
vegefoods-api/
├── config/
│   ├── env.js               Environment variable loader
│   └── firebase.js          Firebase Admin SDK init (Firestore + Storage)
├── middleware/
│   ├── auth.js              JWT authentication + role guards
│   ├── errorHandler.js      Global error handler + AppError class
│   └── rateLimiter.js       Express rate limiting
├── routes/
│   ├── auth.js              User + Admin auth (register/login/refresh/me)
│   ├── users.js             Admin user management (users + admins)
│   ├── categories.js        Product categories CRUD
│   ├── products.js          Products CRUD (multi-image upload)
│   ├── sliders.js           Hero slider CRUD
│   ├── testimonials.js      Testimonials CRUD
│   ├── newsletter.js        Newsletter subscribe/unsubscribe
│   ├── settings.js          Website settings (logo, social links, etc.)
│   ├── blogs.js             Blog posts CRUD with tags
│   ├── contacts.js          Contact form + admin inbox
│   ├── orders.js            Order placement + admin management
│   ├── wishlist.js          DB-stored wishlist (requires JWT)
│   └── dashboard.js         Admin stats aggregation
├── services/
│   ├── authService.js       Register, login, refresh, change password
│   ├── userService.js       List/get/update/delete users
│   ├── categoryService.js   Category CRUD + image upload
│   ├── productService.js    Product CRUD + multi-image + thumbnail
│   ├── sliderService.js     Slider CRUD + image upload
│   ├── testimonyService.js  Testimony CRUD + avatar upload
│   ├── newsletterService.js Subscribe/unsubscribe/list
│   ├── settingsService.js   Get/update site settings
│   ├── blogService.js       Blog CRUD + tags + cover image
│   ├── contactService.js    Contact form + status management
│   ├── orderService.js      Order lifecycle + stats
│   ├── wishlistService.js   Per-user DB wishlist
│   └── dashboardService.js  Aggregate stats for admin panel
├── utils/
│   ├── asyncHandler.js      Wrap async routes for error propagation
│   ├── jwt.js               Sign/verify access + refresh tokens
│   ├── response.js          Consistent JSON response helpers
│   └── upload.js            Multer config + Firebase Storage upload
├── validations/
│   └── schemas.js           All Joi validation schemas
├── app.js                   Express app (all routes mounted)
├── server.js                HTTP server + graceful shutdown
├── .env.example             Environment variable template
└── package.json
```

---

## 🔐 Authentication

Two separate auth systems share the same endpoints pattern:

### User Auth (`/api/auth/...`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register storefront user |
| POST | `/api/auth/login` | Login → access + refresh tokens |
| POST | `/api/auth/refresh` | Get new access token |
| POST | `/api/auth/logout` | Logout (client discards tokens) |
| GET | `/api/auth/me` | Get own profile `🔒` |
| PATCH | `/api/auth/me/password` | Change password `🔒` |

### Admin Auth (`/api/admin/auth/...`)
Same endpoints — stored in `admins` Firestore collection.

**Token usage:**
```
Authorization: Bearer <accessToken>
```

**User roles:** `user` (storefront) · `viewer` · `editor` · `admin`

---

## 📦 Firestore Collections

| Collection | Description |
|---|---|
| `users` | Storefront registered users |
| `admins` | Admin panel users |
| `categories` | Product categories |
| `products` | Products (images stored in Firebase Storage) |
| `sliders` | Hero slider slides |
| `testimonials` | Customer testimonials |
| `newsletter` | Email subscribers |
| `settings` | Single doc — site-wide settings |
| `blogs` | Blog posts with tags |
| `contacts` | Contact form submissions |
| `orders` | Customer orders |
| `wishlists` | One doc per user, contains items array |

---

## 🌐 Full API Reference

### Settings
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/settings` | Public | Get site settings |
| GET | `/api/admin/settings` | Admin | Get full settings |
| PATCH | `/api/admin/settings` | Admin | Update settings (multipart: `logo`, `favicon`) |

### Hero Sliders
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/sliders` | Public | Active sliders only |
| GET | `/api/admin/sliders` | Admin | All sliders |
| GET | `/api/admin/sliders/:id` | Admin | Single slider |
| POST | `/api/admin/sliders` | Admin | Create (multipart: `image`) |
| PUT | `/api/admin/sliders/:id` | Admin | Update (multipart: `image`) |
| DELETE | `/api/admin/sliders/:id` | Admin | Delete |

### Product Categories
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/categories` | Public | Active categories |
| GET | `/api/categories/:id` | Public | Single category |
| GET | `/api/admin/categories` | Admin | All categories |
| POST | `/api/admin/categories` | Admin | Create (multipart: `image`) |
| PUT | `/api/admin/categories/:id` | Admin | Update |
| DELETE | `/api/admin/categories/:id` | Admin | Delete |

### Products
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/products` | Public | Active products (`?category&search&featured&limit`) |
| GET | `/api/products/:id` | Public | Single product |
| GET | `/api/admin/products` | Admin | All products (paginated) |
| GET | `/api/admin/products/:id` | Admin | Single product |
| POST | `/api/admin/products` | Admin | Create (multipart: `thumbnail` + up to 8 `images`) |
| PUT | `/api/admin/products/:id` | Admin | Full update |
| PATCH | `/api/admin/products/:id/status` | Admin | Change status only |
| DELETE | `/api/admin/products/:id/image` | Admin | Remove one image (body: `imageUrl`) |
| DELETE | `/api/admin/products/:id` | Admin | Delete product |

**Product fields:**
`name`, `description`, `shortDescription`, `categoryId`, `price`, `originalPrice`, `discount`, `sku`, `stock`, `unit`, `weight`, `dimensions`, `tags` (array/CSV), `isFeatured`, `status`

### Testimonials
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/testimonials` | Public | Active testimonials |
| GET | `/api/admin/testimonials` | Admin | All |
| POST | `/api/admin/testimonials` | Admin | Create (multipart: `avatar`) |
| PUT | `/api/admin/testimonials/:id` | Admin | Update |
| DELETE | `/api/admin/testimonials/:id` | Admin | Delete |

### Newsletter
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/newsletter` | Public | Subscribe (`email`, `name`) |
| POST | `/api/newsletter/unsubscribe` | Public | Unsubscribe (`email`) |
| GET | `/api/admin/newsletter` | Admin | List subscribers |
| DELETE | `/api/admin/newsletter/:id` | Admin | Delete subscriber |

### Blog
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/blogs` | Public | Published posts (`?tag&search&page&limit`) |
| GET | `/api/blogs/tags` | Public | All unique tags |
| GET | `/api/blogs/:idOrSlug` | Public | Single post by ID or slug |
| GET | `/api/admin/blogs` | Admin | All posts |
| POST | `/api/admin/blogs` | Admin | Create (multipart: `cover`) |
| PUT | `/api/admin/blogs/:id` | Admin | Update |
| DELETE | `/api/admin/blogs/:id` | Admin | Delete |

### Contact
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/contact` | Public | Submit contact form |
| GET | `/api/admin/contacts` | Admin | List (`?status=unread|read|replied`) |
| GET | `/api/admin/contacts/:id` | Admin | Single contact |
| PATCH | `/api/admin/contacts/:id/status` | Admin | Update status |
| DELETE | `/api/admin/contacts/:id` | Admin | Delete |

### Orders
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/orders` | Guest/User | Place order |
| GET | `/api/orders/my` | User `🔒` | My orders |
| GET | `/api/orders/my/:id` | User `🔒` | Single order |
| GET | `/api/admin/orders` | Admin | All orders (paginated) |
| GET | `/api/admin/orders/stats` | Admin | Order statistics |
| GET | `/api/admin/orders/:id` | Admin | Single order |
| PATCH | `/api/admin/orders/:id/status` | Admin | Update status + tracking |
| DELETE | `/api/admin/orders/:id` | Admin | Delete |

**Order statuses:** `pending` → `confirmed` → `processing` → `shipped` → `delivered` · `cancelled`

### Wishlist (DB-stored when logged in)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/wishlist` | User `🔒` | Get my wishlist |
| POST | `/api/wishlist` | User `🔒` | Add product (`productId`) |
| GET | `/api/wishlist/check/:productId` | User `🔒` | Check if in wishlist |
| DELETE | `/api/wishlist/clear` | User `🔒` | Clear all |
| DELETE | `/api/wishlist/:productId` | User `🔒` | Remove one |
| GET | `/api/admin/wishlist` | Admin | All user wishlists |

### Users (Admin)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/users` | Admin | List storefront users |
| GET | `/api/admin/users/:id` | Admin | Single user |
| PATCH | `/api/admin/users/:id` | Admin | Update (role, status, name, phone) |
| DELETE | `/api/admin/users/:id` | Admin | Delete user |
| GET | `/api/admin/admins` | Admin | List admin accounts |
| PATCH | `/api/admin/admins/:id` | Admin | Update admin |
| DELETE | `/api/admin/admins/:id` | Admin | Delete admin |

### Dashboard
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/dashboard` | Admin | Counts, revenue, order stats, recent orders |

---

## 📤 File Upload Guide

All file uploads use `multipart/form-data`.

```
# Product create example
POST /api/admin/products
Content-Type: multipart/form-data

name=Bell Pepper
price=4.99
categoryId=cat-uuid
stock=100
tags=vegetables,fresh,organic
isFeatured=true
thumbnail=<file>        ← single thumbnail image
images=<file>           ← up to 8 additional images
images=<file>
```

Files are uploaded to Firebase Storage and public URLs are stored in Firestore.  
Supported formats: `jpeg`, `jpg`, `png`, `gif`, `webp`, `pdf` · Max size: **5 MB**

---

## 🔁 Response Format

All endpoints return:

```json
{
  "success": true,
  "message": "Success",
  "data": { ... }
}
```

Paginated endpoints include:
```json
{
  "success": true,
  "data": [...],
  "meta": { "page": 1, "limit": 20, "total": 100 }
}
```

Error responses:
```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

---

## 🔥 Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Firestore Database** (Native mode)
3. Enable **Firebase Storage**
4. Go to **Project Settings → Service Accounts → Generate new private key**
5. Copy the values into your `.env`

**Firestore Security Rules (recommended):**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // All reads/writes go through the Admin SDK (server-side only)
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Storage CORS (for public image access):**
All uploaded files are made public via `file.makePublic()` in the upload utility.
