# Redux E-commerce Portfolio Site

A modern, responsive e-commerce web application built with React.js and Redux Toolkit. This project demonstrates advanced state management, modern React patterns, and a clean, professional UI perfect for showcasing web development skills.

Live URL: https://react-redux-two-gamma.vercel.app/

## ✨ Features

- **Redux Toolkit State Management**: Modern Redux implementation with slices
- **Shopping Cart**: Add, remove, increase/decrease quantities
- **Product Categories**: Filter products by category
- **Responsive Design**: Mobile-first, fully responsive layout
- **Modern UI/UX**: Clean, professional design with hover effects
- **Sample Data**: Pre-loaded with 12 sample products
- **Portfolio Ready**: Demonstrates modern React/Redux skills

## 🛠️ Tech Stack

- **Frontend**: React 18, React Router DOM
- **State Management**: Redux Toolkit, React-Redux
- **Styling**: Pure CSS with modern design principles
- **Build Tool**: Create React App
- **Development**: ES6+, Hooks, Modern JavaScript

## 🚀 Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start the development server:**

   ```bash
   npm start
   ```

3. **Open your browser:**
   - Navigate to `http://localhost:3000`
   - The app will reload automatically when you make changes

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── Header.js        # Navigation header with cart icon
│   ├── Home.js          # Landing page with featured products
│   ├── ProductList.js   # Product listing with category filter
│   ├── ProductCard.js   # Individual product display
│   └── Cart.js          # Shopping cart management
├── store/               # Redux store configuration
│   ├── store.js         # Main store setup
│   └── slices/          # Redux slices
│       ├── productSlice.js  # Product state management
│       └── cartSlice.js     # Cart state management
├── data/
│   └── sampleData.js    # Sample product data
├── App.js               # Main app component with routing
├── index.js             # React DOM entry point
└── index.css            # Global styles and responsive design
```

## 🎯 Redux Implementation

### Store Architecture

- **Product Slice**: Manages product data, categories, loading states
- **Cart Slice**: Handles cart items, quantities, totals
- **Selectors**: Efficient data retrieval with memoization
- **Actions**: Clean, predictable state updates

### Key Redux Features Demonstrated

- **Redux Toolkit**: Modern Redux with createSlice
- **Immutable Updates**: Using Immer under the hood
- **Selectors**: Computed properties and filtering
- **Middleware**: DevTools integration for debugging
- **Type Safety**: Consistent action types and payloads

## 🎨 UI/UX Features

- **Responsive Grid Layout**: Adapts to all screen sizes
- **Interactive Elements**: Hover effects and transitions
- **Visual Feedback**: Cart count badges, button states
- **Category Filtering**: Dynamic product filtering
- **Cart Management**: Intuitive quantity controls
- **Empty States**: Helpful messages for empty cart/no products

## 📱 Pages & Routing

1. **Home (`/`)**:
   - Hero section with call-to-action
   - Featured products showcase
   - Benefits/features section

2. **Products (`/products`)**:
   - Complete product catalog
   - Category filtering
   - Product grid layout

3. **Cart (`/cart`)**:
   - Cart items management
   - Quantity controls
   - Order summary
   - Checkout functionality (demo)

## 🔧 Customization

### Adding Products

Edit `src/data/sampleData.js` to add/modify products:

```javascript
{
  id: 13,
  title: "New Product",
  description: "Product description",
  price: 99.99,
  category: "Category",
  image: "image-url"
}
```

### Styling

Modify `src/index.css` to customize:

- Color scheme (CSS custom properties recommended)
- Layout breakpoints
- Component spacing
- Typography

### Redux State

Extend the store by:

- Adding new slices in `src/store/slices/`
- Creating new selectors
- Implementing additional actions

## 🌟 Portfolio Highlights

This project demonstrates:

- **Modern React Development**: Hooks, functional components, React Router
- **Advanced State Management**: Redux Toolkit best practices
- **Responsive Web Design**: Mobile-first CSS approach
- **Component Architecture**: Reusable, maintainable components
- **Performance Optimization**: Efficient selectors and rendering
- **Professional UI/UX**: Clean, intuitive interface design
- **Code Organization**: Clear project structure and separation of concerns

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Built with ❤️ using React & Redux Toolkit**
