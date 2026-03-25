# 🌿 Vegefoods — React + Redux + Styled Components

A production-grade e-commerce SPA converted from Bootstrap 4 / jQuery to modern React,
written to senior (10+ years) engineering standards.

---

## 🚀 Quick Start

```bash
npm install
npm start        # dev server → http://localhost:3000
npm run build    # production build → /build
```

---

## 🏗️ Architecture

```
src/
├── styles/
│   ├── theme.ts          ← Single source of truth: colors, fonts, spacing, shadows
│   ├── GlobalStyles.ts   ← CSS reset, custom properties, @keyframe animations
│   └── shared.ts         ← 25+ reusable styled-component primitives
│
├── store/
│   ├── index.ts          ← configureStore + typed useAppDispatch / useAppSelector
│   ├── cartSlice.ts      ← addToCart · removeFromCart · updateQuantity · clearCart
│   ├── wishlistSlice.ts  ← toggleWishlist · removeFromWishlist
│   └── uiSlice.ts        ← Toast notifications · mobile menu · search state
│
├── hooks/
│   └── useCart.ts        ← useCart() and useWishlist() — all Redux + toast logic
│
├── data/index.ts         ← PRODUCTS · TESTIMONIALS · BLOG_POSTS
├── types/index.ts        ← TypeScript interfaces
│
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx    ← Sticky scroll-aware nav, dropdown, badges, mobile drawer
│   │   └── Footer.tsx    ← 4-column footer, social links, newsletter form
│   └── ui/
│       ├── ProductCard.tsx   ← Hover actions, wishlist toggle, lazy image
│       ├── PageHero.tsx      ← Reusable breadcrumb hero for inner pages
│       └── Toast.tsx         ← Auto-dismiss toast stack (success/error/info)
│
├── pages/
│   ├── HomePage.tsx           ← Hero slider, services, categories, countdown, testimonials
│   ├── ShopPage.tsx           ← Filter sidebar, search, sort, price range
│   ├── CartPage.tsx           ← Item table, quantity controls, coupon, summary
│   ├── CheckoutPage.tsx       ← Shipping form, payment methods, success screen
│   ├── ProductDetailPage.tsx  ← Gallery, star rating, qty picker, related products
│   └── OtherPages.tsx         ← Wishlist · About · Blog · Contact
│
└── App.tsx                    ← Provider + BrowserRouter + React.lazy routes
```

---

## ⚙️ Tech Stack

| Layer         | Technology                      |
|--------------|---------------------------------|
| UI Framework  | React 18 + TypeScript           |
| State         | Redux Toolkit + React-Redux     |
| Styling       | styled-components               |
| Routing       | React Router v6                 |
| Icons         | Lucide React                    |
| Build         | Create React App                |

---

## 🎯 Senior-Level Patterns Used

- **No `<div>` anywhere** — semantic `<main>`, `<section>`, `<article>`, `<aside>`, `<nav>`, `<footer>`
- **Single theme file** — all tokens in `theme.ts`, consumed as CSS custom properties
- **Redux slices by domain** — cart / wishlist / ui are independent, never cross-write
- **Typed custom hooks** — `useCart()` and `useWishlist()` hide all dispatch from UI layer
- **Lazy loading** — all pages via `React.lazy()` + `Suspense`
- **Shared primitives** — `shared.ts` provides the design system's building blocks

---

## 📄 Routes

| Path             | Page               |
|------------------|--------------------|
| `/`              | Home               |
| `/shop`          | Product Listing    |
| `/product/:id`   | Product Detail     |
| `/cart`          | Shopping Cart      |
| `/checkout`      | Checkout           |
| `/wishlist`      | Wishlist           |
| `/about`         | About Us           |
| `/blog`          | Blog               |
| `/contact`       | Contact            |

---

## 🎨 Customising the Theme

Edit `src/styles/theme.ts`:

```ts
colors: {
  primary: '#4CAF50',  // ← change to rebrand the entire app
  accent:  '#FF7043',
}
```

CSS custom properties update automatically across every component.
