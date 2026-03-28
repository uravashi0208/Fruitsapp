export interface Product {
  id: number;
  name: string;
  category: 'vegetables' | 'fruits' | 'juice' | 'dried';
  price: number;
  originalPrice?: number;
  image: string;
  discount?: number;
  rating: number;
  reviews: number;
  description: string;
  badge?: string;
  isNew?: boolean;
  stock?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface WishlistItem extends Product {}

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  avatar: string;
  quote: string;
}

export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  author: string;
  category: string;
}
