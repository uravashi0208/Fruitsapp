import {
  AdminProduct, User, Order, CardDetail,
  Contact, AdminBlogPost, DashboardStats,
} from '../types';

// ── Products ──────────────────────────────────────────────────
export const ADMIN_PRODUCTS: AdminProduct[] = [
  { id: 1, name: 'Bell Pepper', category: 'vegetables', price: 80, originalPrice: 120, discount: 30, image: '/images/product-1.jpg', rating: 4.5, reviews: 24, description: 'Fresh, crisp bell peppers bursting with natural sweetness and vitamin C.', badge: '30% OFF', isNew: false, stock: 142, sku: 'VEG-001', createdAt: '2026-01-05', updatedAt: '2026-03-10', status: 'active' },
  { id: 2, name: 'Strawberry', category: 'fruits', price: 120, image: '/images/product-2.jpg', rating: 4.8, reviews: 56, description: 'Hand-picked strawberries at peak ripeness.', isNew: true, stock: 89, sku: 'FRT-002', createdAt: '2026-01-12', updatedAt: '2026-03-11', status: 'active' },
  { id: 3, name: 'Green Beans', category: 'vegetables', price: 120, image: '/images/product-3.jpg', rating: 4.2, reviews: 18, description: 'Tender green beans, farm-fresh and packed with nutrients.', stock: 211, sku: 'VEG-003', createdAt: '2026-01-15', updatedAt: '2026-03-09', status: 'active' },
  { id: 4, name: 'Purple Cabbage', category: 'vegetables', price: 120, image: '/images/product-4.jpg', rating: 4.0, reviews: 12, description: 'Vibrant purple cabbage with a satisfying crunch.', stock: 67, sku: 'VEG-004', createdAt: '2026-01-20', updatedAt: '2026-03-08', status: 'active' },
  { id: 5, name: 'Tomato', category: 'vegetables', price: 80, originalPrice: 120, discount: 30, image: '/images/product-5.jpg', rating: 4.7, reviews: 89, description: 'Vine-ripened tomatoes with rich umami flavor.', badge: 'SALE', stock: 0, sku: 'VEG-005', createdAt: '2026-02-01', updatedAt: '2026-03-12', status: 'inactive' },
  { id: 6, name: 'Broccoli', category: 'vegetables', price: 120, image: '/images/product-6.jpg', rating: 4.3, reviews: 33, description: 'Dense, nutritious broccoli crowns.', stock: 55, sku: 'VEG-006', createdAt: '2026-02-05', updatedAt: '2026-03-07', status: 'active' },
  { id: 7, name: 'Carrots', category: 'vegetables', price: 120, image: '/images/product-7.jpg', rating: 4.6, reviews: 45, description: 'Sweet, crunchy carrots freshly harvested.', isNew: true, stock: 300, sku: 'VEG-007', createdAt: '2026-02-10', updatedAt: '2026-03-11', status: 'active' },
  { id: 8, name: 'Fruit Juice', category: 'juice', price: 120, image: '/images/product-8.jpg', rating: 4.4, reviews: 27, description: 'Cold-pressed, 100% natural fruit juice.', stock: 44, sku: 'JCE-008', createdAt: '2026-02-15', updatedAt: '2026-03-10', status: 'active' },
  { id: 9, name: 'Spinach', category: 'vegetables', price: 5, originalPrice: 10, discount: 50, image: '/images/product-9.jpg', rating: 4.5, reviews: 61, description: 'Baby spinach leaves, tender and full of iron.', badge: 'DEAL', stock: 98, sku: 'VEG-009', createdAt: '2026-02-18', updatedAt: '2026-03-12', status: 'active' },
  { id: 10, name: 'Avocado', category: 'fruits', price: 95, image: '/images/product-10.jpg', rating: 4.9, reviews: 112, description: 'Perfectly ripe, creamy avocados.', isNew: true, stock: 76, sku: 'FRT-010', createdAt: '2026-02-20', updatedAt: '2026-03-13', status: 'active' },
  { id: 11, name: 'Mixed Dried Fruits', category: 'dried', price: 150, image: '/images/product-11.jpg', rating: 4.1, reviews: 19, description: 'A premium blend of sun-dried fruits.', stock: 33, sku: 'DRD-011', createdAt: '2026-02-25', updatedAt: '2026-03-09', status: 'draft' },
  { id: 12, name: 'Orange Juice', category: 'juice', price: 85, image: '/images/product-12.jpg', rating: 4.6, reviews: 38, description: 'Freshly squeezed orange juice.', stock: 62, sku: 'JCE-012', createdAt: '2026-03-01', updatedAt: '2026-03-13', status: 'active' },
];

// ── Users ─────────────────────────────────────────────────────
export const ADMIN_USERS: User[] = [
  { id: 'u1', name: 'Sarah Johnson', email: 'sarah@example.com', phone: '+1 555-0101', role: 'admin', status: 'active', joinedAt: '2025-06-01', lastLogin: '2026-03-17', totalOrders: 24, totalSpent: 1840.50, address: { street: '123 Oak Lane', city: 'San Francisco', state: 'CA', zip: '94102', country: 'USA' } },
  { id: 'u2', name: 'Marcus Chen', email: 'marcus@example.com', phone: '+1 555-0102', role: 'editor', status: 'active', joinedAt: '2025-08-14', lastLogin: '2026-03-16', totalOrders: 8, totalSpent: 640.00, address: { street: '456 Maple St', city: 'Los Angeles', state: 'CA', zip: '90001', country: 'USA' } },
  { id: 'u3', name: 'Emma Rodriguez', email: 'emma@example.com', phone: '+1 555-0103', role: 'viewer', status: 'active', joinedAt: '2025-09-20', lastLogin: '2026-03-15', totalOrders: 15, totalSpent: 920.75, address: { street: '789 Pine Ave', city: 'Seattle', state: 'WA', zip: '98101', country: 'USA' } },
  { id: 'u4', name: 'David Park', email: 'david@example.com', phone: '+1 555-0104', role: 'viewer', status: 'inactive', joinedAt: '2025-10-05', lastLogin: '2026-01-20', totalOrders: 3, totalSpent: 145.00, address: { street: '321 Elm Rd', city: 'Austin', state: 'TX', zip: '73301', country: 'USA' } },
  { id: 'u5', name: 'Aisha Patel', email: 'aisha@example.com', phone: '+1 555-0105', role: 'viewer', status: 'active', joinedAt: '2025-11-12', lastLogin: '2026-03-17', totalOrders: 31, totalSpent: 2310.20, address: { street: '654 Birch Blvd', city: 'New York', state: 'NY', zip: '10001', country: 'USA' } },
  { id: 'u6', name: 'Tom Wilson', email: 'tom@example.com', phone: '+1 555-0106', role: 'viewer', status: 'banned', joinedAt: '2025-07-30', lastLogin: '2026-02-01', totalOrders: 0, totalSpent: 0, address: { street: '987 Cedar Way', city: 'Chicago', state: 'IL', zip: '60601', country: 'USA' } },
];

// ── Orders ────────────────────────────────────────────────────
export const ADMIN_ORDERS: Order[] = [
  { id: 'ORD-1001', userId: 'u5', userName: 'Aisha Patel', userEmail: 'aisha@example.com', items: [{ productId: 10, productName: 'Avocado', productImage: '/images/product-10.jpg', quantity: 3, price: 95 }, { productId: 2, productName: 'Strawberry', productImage: '/images/product-2.jpg', quantity: 2, price: 120 }], subtotal: 525, shipping: 0, total: 525, status: 'delivered', paymentStatus: 'paid', paymentMethod: 'card', createdAt: '2026-03-10T09:22:00Z', updatedAt: '2026-03-14T16:00:00Z', address: { street: '654 Birch Blvd', city: 'New York', state: 'NY', zip: '10001', country: 'USA' } },
  { id: 'ORD-1002', userId: 'u1', userName: 'Sarah Johnson', userEmail: 'sarah@example.com', items: [{ productId: 7, productName: 'Carrots', productImage: '/images/product-7.jpg', quantity: 5, price: 120 }], subtotal: 600, shipping: 0, total: 600, status: 'shipped', paymentStatus: 'paid', paymentMethod: 'paypal', createdAt: '2026-03-12T14:10:00Z', updatedAt: '2026-03-13T08:00:00Z', address: { street: '123 Oak Lane', city: 'San Francisco', state: 'CA', zip: '94102', country: 'USA' } },
  { id: 'ORD-1003', userId: 'u3', userName: 'Emma Rodriguez', userEmail: 'emma@example.com', items: [{ productId: 1, productName: 'Bell Pepper', productImage: '/images/product-1.jpg', quantity: 2, price: 80 }, { productId: 9, productName: 'Spinach', productImage: '/images/product-9.jpg', quantity: 4, price: 5 }], subtotal: 180, shipping: 9.99, total: 189.99, status: 'processing', paymentStatus: 'paid', paymentMethod: 'card', createdAt: '2026-03-15T11:05:00Z', updatedAt: '2026-03-15T11:05:00Z', address: { street: '789 Pine Ave', city: 'Seattle', state: 'WA', zip: '98101', country: 'USA' } },
  { id: 'ORD-1004', userId: 'u2', userName: 'Marcus Chen', userEmail: 'marcus@example.com', items: [{ productId: 12, productName: 'Orange Juice', productImage: '/images/product-12.jpg', quantity: 3, price: 85 }], subtotal: 255, shipping: 0, total: 255, status: 'pending', paymentStatus: 'pending', paymentMethod: 'cod', createdAt: '2026-03-16T18:30:00Z', updatedAt: '2026-03-16T18:30:00Z', address: { street: '456 Maple St', city: 'Los Angeles', state: 'CA', zip: '90001', country: 'USA' } },
  { id: 'ORD-1005', userId: 'u5', userName: 'Aisha Patel', userEmail: 'aisha@example.com', items: [{ productId: 11, productName: 'Mixed Dried Fruits', productImage: '/images/product-11.jpg', quantity: 2, price: 150 }], subtotal: 300, shipping: 0, total: 300, status: 'cancelled', paymentStatus: 'refunded', paymentMethod: 'card', createdAt: '2026-03-08T07:15:00Z', updatedAt: '2026-03-09T09:00:00Z', address: { street: '654 Birch Blvd', city: 'New York', state: 'NY', zip: '10001', country: 'USA' } },
  { id: 'ORD-1006', userId: 'u1', userName: 'Sarah Johnson', userEmail: 'sarah@example.com', items: [{ productId: 6, productName: 'Broccoli', productImage: '/images/product-6.jpg', quantity: 4, price: 120 }], subtotal: 480, shipping: 0, total: 480, status: 'delivered', paymentStatus: 'paid', paymentMethod: 'card', createdAt: '2026-03-02T10:00:00Z', updatedAt: '2026-03-06T12:00:00Z', address: { street: '123 Oak Lane', city: 'San Francisco', state: 'CA', zip: '94102', country: 'USA' } },
];

// ── Cards ─────────────────────────────────────────────────────
export const ADMIN_CARDS: CardDetail[] = [
  { id: 'cd1', userId: 'u1', userName: 'Sarah Johnson', userEmail: 'sarah@example.com', cardType: 'visa', last4: '4242', expiryMonth: '08', expiryYear: '2028', cardholderName: 'Sarah Johnson', isDefault: true, createdAt: '2025-06-01' },
  { id: 'cd2', userId: 'u2', userName: 'Marcus Chen', userEmail: 'marcus@example.com', cardType: 'mastercard', last4: '5678', expiryMonth: '11', expiryYear: '2027', cardholderName: 'Marcus Chen', isDefault: true, createdAt: '2025-08-14' },
  { id: 'cd3', userId: 'u3', userName: 'Emma Rodriguez', userEmail: 'emma@example.com', cardType: 'amex', last4: '9001', expiryMonth: '03', expiryYear: '2027', cardholderName: 'Emma Rodriguez', isDefault: true, createdAt: '2025-09-20' },
  { id: 'cd4', userId: 'u5', userName: 'Aisha Patel', userEmail: 'aisha@example.com', cardType: 'visa', last4: '1111', expiryMonth: '06', expiryYear: '2026', cardholderName: 'Aisha Patel', isDefault: true, createdAt: '2025-11-12' },
  { id: 'cd5', userId: 'u5', userName: 'Aisha Patel', userEmail: 'aisha@example.com', cardType: 'mastercard', last4: '3344', expiryMonth: '12', expiryYear: '2028', cardholderName: 'A Patel', isDefault: false, createdAt: '2026-01-05' },
  { id: 'cd6', userId: 'u1', userName: 'Sarah Johnson', userEmail: 'sarah@example.com', cardType: 'discover', last4: '7890', expiryMonth: '02', expiryYear: '2027', cardholderName: 'Sarah M Johnson', isDefault: false, createdAt: '2026-02-10' },
];

// ── Contacts ──────────────────────────────────────────────────
export const ADMIN_CONTACTS: Contact[] = [
  { id: 'c1', name: 'Lisa Turner', email: 'lisa@example.com', phone: '+1 555-0201', subject: 'Delivery delay on order ORD-1003', message: 'Hi, my order has been in processing for over 2 days. Can you provide an update on the delivery timeline? I ordered 4 items and need them before the weekend.', status: 'new', createdAt: '2026-03-17T08:14:00Z' },
  { id: 'c2', name: 'James Okoro', email: 'james@example.com', phone: '+1 555-0202', subject: 'Wholesale inquiry for restaurant', message: 'We run a small organic restaurant and are interested in sourcing vegetables and fruits in bulk. Could you share your wholesale pricing and minimum order quantities?', status: 'read', createdAt: '2026-03-16T14:30:00Z' },
  { id: 'c3', name: 'Priya Sharma', email: 'priya@example.com', subject: 'Wrong item received in my order', message: 'I received green beans instead of the broccoli I ordered. Order ID ORD-999. Please advise how to get a replacement or refund.', status: 'replied', createdAt: '2026-03-14T09:55:00Z', repliedAt: '2026-03-14T15:20:00Z' },
  { id: 'c4', name: 'Carlos Reyes', email: 'carlos@example.com', phone: '+1 555-0204', subject: 'Suggestion: Add more tropical fruits', message: 'Love your service! Would be great if you could add mangoes, papayas, and dragon fruit to your inventory. Many of us in the neighborhood would buy regularly.', status: 'replied', createdAt: '2026-03-12T11:00:00Z', repliedAt: '2026-03-13T09:00:00Z' },
  { id: 'c5', name: 'Naomi White', email: 'naomi@example.com', subject: 'Issue with subscription cancellation', message: "I've been trying to cancel my weekly subscription plan for 3 days and the button on the app doesn't work. Please cancel my subscription immediately.", status: 'new', createdAt: '2026-03-17T10:02:00Z' },
  { id: 'c6', name: 'Ryan Brooks', email: 'ryan@example.com', phone: '+1 555-0206', subject: 'Partnership proposal', message: 'We are a local organic farm and would like to discuss becoming one of your supply partners. We grow certified organic leafy greens and herbs across 20 acres.', status: 'archived', createdAt: '2026-03-05T13:40:00Z' },
];

// ── Blog Posts ────────────────────────────────────────────────
export const ADMIN_BLOGS: AdminBlogPost[] = [
  { id: 'b1', title: 'The Ultimate Guide to Seasonal Vegetables', slug: 'guide-seasonal-vegetables', excerpt: 'Discover which vegetables are in peak season and how to maximize flavor.', content: 'Full article content goes here...', image: '/images/image_1.jpg', author: 'Emma Wilson', authorId: 'u3', category: 'Nutrition', tags: ['seasonal', 'vegetables', 'tips'], status: 'published', views: 1420, createdAt: '2026-02-10', updatedAt: '2026-03-10', publishedAt: '2026-02-12' },
  { id: 'b2', title: '5 Morning Smoothies to Power Your Day', slug: '5-morning-smoothies', excerpt: 'Start your morning right with these nutrient-dense smoothie recipes.', content: 'Full article content goes here...', image: '/images/image_2.jpg', author: 'James Carter', authorId: 'u2', category: 'Recipes', tags: ['smoothies', 'breakfast', 'health'], status: 'published', views: 980, createdAt: '2026-02-20', updatedAt: '2026-03-06', publishedAt: '2026-02-22' },
  { id: 'b3', title: 'Why Organic Matters: Farming to Fork', slug: 'why-organic-matters', excerpt: 'A deep dive into our organic farming practices and their impact.', content: 'Full article content goes here...', image: '/images/image_3.jpg', author: 'Maria Santos', authorId: 'u1', category: 'Lifestyle', tags: ['organic', 'farming', 'sustainability'], status: 'published', views: 762, createdAt: '2026-03-01', updatedAt: '2026-03-08', publishedAt: '2026-03-03' },
  { id: 'b4', title: 'Spring Planting Guide for Home Gardens', slug: 'spring-planting-guide', excerpt: 'Everything you need to know about growing your own vegetables this spring.', content: 'Draft content...', image: '/images/image_1.jpg', author: 'Emma Wilson', authorId: 'u3', category: 'Gardening', tags: ['gardening', 'spring', 'diy'], status: 'draft', views: 0, createdAt: '2026-03-15', updatedAt: '2026-03-16' },
  { id: 'b5', title: 'Top 10 Superfoods in Our Store', slug: 'top-10-superfoods', excerpt: 'Nutritional powerhouses you should be eating every week.', content: 'Full article content goes here...', image: '/images/image_2.jpg', author: 'James Carter', authorId: 'u2', category: 'Nutrition', tags: ['superfoods', 'health', 'nutrition'], status: 'archived', views: 2100, createdAt: '2025-12-01', updatedAt: '2026-02-01', publishedAt: '2025-12-05' },
];

// ── Dashboard Stats ───────────────────────────────────────────
export const DASHBOARD_STATS: DashboardStats = {
  totalRevenue: 48_620.50,
  revenueGrowth: 12.4,
  totalOrders: 234,
  ordersGrowth: 8.7,
  totalUsers: ADMIN_USERS.length,
  usersGrowth: 22.1,
  totalProducts: ADMIN_PRODUCTS.length,
  productsGrowth: -2.3,
  recentOrders: ADMIN_ORDERS.slice(0, 5),
  topProducts: [
    { product: ADMIN_PRODUCTS[9], sold: 112, revenue: 10640 },
    { product: ADMIN_PRODUCTS[4], sold: 89, revenue: 7120 },
    { product: ADMIN_PRODUCTS[1], sold: 56, revenue: 6720 },
    { product: ADMIN_PRODUCTS[6], sold: 45, revenue: 5400 },
    { product: ADMIN_PRODUCTS[0], sold: 24, revenue: 1920 },
  ],
  revenueChart: [
    { month: 'Sep', revenue: 28000, orders: 140 },
    { month: 'Oct', revenue: 32000, orders: 162 },
    { month: 'Nov', revenue: 38000, orders: 185 },
    { month: 'Dec', revenue: 45000, orders: 220 },
    { month: 'Jan', revenue: 36000, orders: 175 },
    { month: 'Feb', revenue: 42000, orders: 205 },
    { month: 'Mar', revenue: 48620, orders: 234 },
  ],
};
