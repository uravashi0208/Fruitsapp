import {
  AdminProduct, User, Order, CardDetail,
  Contact, AdminBlogPost, DashboardStats,
} from '../types';

// ── Users ─────────────────────────────────────────────────────
export const ADMIN_USERS: User[] = [
  { id: 'u1', name: 'Sarah Johnson', email: 'sarah@example.com', phone: '+1 555-0101', role: 'admin', status: 'active', joinedAt: '2025-06-01', lastLogin: '2026-03-17', totalOrders: 24, totalSpent: 1840.50, address: { street: '123 Oak Lane', city: 'San Francisco', state: 'CA', zip: '94102', country: 'USA' } },
  { id: 'u2', name: 'Marcus Chen', email: 'marcus@example.com', phone: '+1 555-0102', role: 'editor', status: 'active', joinedAt: '2025-08-14', lastLogin: '2026-03-16', totalOrders: 8, totalSpent: 640.00, address: { street: '456 Maple St', city: 'Los Angeles', state: 'CA', zip: '90001', country: 'USA' } },
  { id: 'u3', name: 'Emma Rodriguez', email: 'emma@example.com', phone: '+1 555-0103', role: 'viewer', status: 'active', joinedAt: '2025-09-20', lastLogin: '2026-03-15', totalOrders: 15, totalSpent: 920.75, address: { street: '789 Pine Ave', city: 'Seattle', state: 'WA', zip: '98101', country: 'USA' } },
  { id: 'u4', name: 'David Park', email: 'david@example.com', phone: '+1 555-0104', role: 'viewer', status: 'inactive', joinedAt: '2025-10-05', lastLogin: '2026-01-20', totalOrders: 3, totalSpent: 145.00, address: { street: '321 Elm Rd', city: 'Austin', state: 'TX', zip: '73301', country: 'USA' } },
  { id: 'u5', name: 'Aisha Patel', email: 'aisha@example.com', phone: '+1 555-0105', role: 'viewer', status: 'active', joinedAt: '2025-11-12', lastLogin: '2026-03-17', totalOrders: 31, totalSpent: 2310.20, address: { street: '654 Birch Blvd', city: 'New York', state: 'NY', zip: '10001', country: 'USA' } },
  { id: 'u6', name: 'Tom Wilson', email: 'tom@example.com', phone: '+1 555-0106', role: 'viewer', status: 'banned', joinedAt: '2025-07-30', lastLogin: '2026-02-01', totalOrders: 0, totalSpent: 0, address: { street: '987 Cedar Way', city: 'Chicago', state: 'IL', zip: '60601', country: 'USA' } },
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


