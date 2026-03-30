import { createSlice, PayloadAction, configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import {
  AdminProduct, User, Order, CardDetail,
  Contact, AdminBlogPost, AdminUser,
} from '../types';

// ── Auth Slice ────────────────────────────────────────────────
interface AuthState { user: AdminUser | null; isAuthenticated: boolean; }
const authSlice = createSlice({
  name: 'adminAuth',
  initialState: {
    user: null,
    isAuthenticated: false,
  } as AuthState,
  reducers: {
    login(state, action: PayloadAction<AdminUser>) { state.user = action.payload; state.isAuthenticated = true; },
    logout(state) { state.user = null; state.isAuthenticated = false; },
  },
});

// ── Products Slice ────────────────────────────────────────────
interface ProductsState { items: AdminProduct[]; }
const productsSlice = createSlice({
  name: 'adminProducts',
  initialState: { items: [] } as ProductsState,
  reducers: {
    addProduct(state, action: PayloadAction<AdminProduct>) {
      state.items.unshift(action.payload);
    },
    updateProduct(state, action: PayloadAction<AdminProduct>) {
      const idx = state.items.findIndex((p) => p.id === action.payload.id);
      if (idx >= 0) state.items[idx] = { ...action.payload, updatedAt: new Date().toISOString().split('T')[0] };
    },
    deleteProduct(state, action: PayloadAction<string>) {
      state.items = state.items.filter((p) => p.id !== action.payload);
    },
    setProductStatus(state, action: PayloadAction<{ id: string; status: AdminProduct['status'] }>) {
      const p = state.items.find((p) => p.id === action.payload.id);
      if (p) { p.status = action.payload.status; p.updatedAt = new Date().toISOString().split('T')[0]; }
    },
  },
});

// ── Users Slice ───────────────────────────────────────────────
interface UsersState { items: User[]; }
const usersSlice = createSlice({
  name: 'adminUsers',
  initialState: { items: [] } as UsersState,
  reducers: {
    addUser(state, action: PayloadAction<User>) { state.items.unshift(action.payload); },
    updateUser(state, action: PayloadAction<User>) {
      const idx = state.items.findIndex((u) => u.id === action.payload.id);
      if (idx >= 0) state.items[idx] = action.payload;
    },
    deleteUser(state, action: PayloadAction<string>) {
      state.items = state.items.filter((u) => u.id !== action.payload);
    },
    setUserStatus(state, action: PayloadAction<{ id: string; status: User['status'] }>) {
      const u = state.items.find((u) => u.id === action.payload.id);
      if (u) u.status = action.payload.status;
    },
  },
});

// ── Orders Slice ──────────────────────────────────────────────
interface OrdersState { items: Order[]; }
const ordersSlice = createSlice({
  name: 'adminOrders',
  initialState: { items: [] } as OrdersState,
  reducers: {
    updateOrderStatus(state, action: PayloadAction<{ id: string; status: Order['status'] }>) {
      const o = state.items.find((o) => o.id === action.payload.id);
      if (o) { o.status = action.payload.status; o.updatedAt = new Date().toISOString(); }
    },
    deleteOrder(state, action: PayloadAction<string>) {
      state.items = state.items.filter((o) => o.id !== action.payload);
    },
  },
});

// ── Cards Slice ───────────────────────────────────────────────
interface CardsState { items: CardDetail[]; }
const cardsSlice = createSlice({
  name: 'adminCards',
  initialState: { items: [] } as CardsState,
  reducers: {
    deleteCard(state, action: PayloadAction<string>) {
      state.items = state.items.filter((c) => c.id !== action.payload);
    },
    setDefaultCard(state, action: PayloadAction<{ id: string; userId: string }>) {
      state.items.forEach((c) => {
        if (c.userId === action.payload.userId) c.isDefault = c.id === action.payload.id;
      });
    },
  },
});

// ── Contacts Slice ────────────────────────────────────────────
interface ContactsState { items: Contact[]; }
const contactsSlice = createSlice({
  name: 'adminContacts',
  initialState: { items: [] } as ContactsState,
  reducers: {
    updateContactStatus(state, action: PayloadAction<{ id: string; status: Contact['status'] }>) {
      const c = state.items.find((c) => c.id === action.payload.id);
      if (c) {
        c.status = action.payload.status;
        if (action.payload.status === 'replied') c.repliedAt = new Date().toISOString();
      }
    },
    deleteContact(state, action: PayloadAction<string>) {
      state.items = state.items.filter((c) => c.id !== action.payload);
    },
  },
});

// ── Blogs Slice ───────────────────────────────────────────────
interface BlogsState { items: AdminBlogPost[]; }
const blogsSlice = createSlice({
  name: 'adminBlogs',
  initialState: { items: [] } as BlogsState,
  reducers: {
    addBlog(state, action: PayloadAction<AdminBlogPost>) { state.items.unshift(action.payload); },
    updateBlog(state, action: PayloadAction<AdminBlogPost>) {
      const idx = state.items.findIndex((b) => b.id === action.payload.id);
      if (idx >= 0) state.items[idx] = { ...action.payload, updatedAt: new Date().toISOString().split('T')[0] };
    },
    deleteBlog(state, action: PayloadAction<string>) {
      state.items = state.items.filter((b) => b.id !== action.payload);
    },
    setBlogStatus(state, action: PayloadAction<{ id: string; status: AdminBlogPost['status'] }>) {
      const b = state.items.find((b) => b.id === action.payload.id);
      if (b) {
        b.status = action.payload.status;
        b.updatedAt = new Date().toISOString().split('T')[0];
        if (action.payload.status === 'published' && !b.publishedAt)
          b.publishedAt = new Date().toISOString().split('T')[0];
      }
    },
  },
});

// ── Admin UI Slice ────────────────────────────────────────────
interface AdminUIState {
  sidebarCollapsed: boolean;
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' | 'warning' }>;
}
const adminUISlice = createSlice({
  name: 'adminUI',
  initialState: { sidebarCollapsed: false, toasts: [] } as AdminUIState,
  reducers: {
    toggleSidebar(state) { state.sidebarCollapsed = !state.sidebarCollapsed; },
    showAdminToast(state, action: PayloadAction<Omit<AdminUIState['toasts'][0], 'id'>>) {
      state.toasts.push({ ...action.payload, id: Date.now().toString() });
    },
    dismissAdminToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

// ── Store ─────────────────────────────────────────────────────
export const adminStore = configureStore({
  reducer: {
    adminAuth:     authSlice.reducer,
    adminProducts: productsSlice.reducer,
    adminUsers:    usersSlice.reducer,
    adminOrders:   ordersSlice.reducer,
    adminCards:    cardsSlice.reducer,
    adminContacts: contactsSlice.reducer,
    adminBlogs:    blogsSlice.reducer,
    adminUI:       adminUISlice.reducer,
  },
});

export type AdminRootState = ReturnType<typeof adminStore.getState>;
export type AdminDispatch   = typeof adminStore.dispatch;
export const useAdminDispatch = () => useDispatch<AdminDispatch>();
export const useAdminSelector: TypedUseSelectorHook<AdminRootState> = useSelector;

// ── Exported actions ──────────────────────────────────────────
export const { login, logout } = authSlice.actions;
export const { addProduct, updateProduct, deleteProduct, setProductStatus } = productsSlice.actions;
export const { addUser, updateUser, deleteUser, setUserStatus } = usersSlice.actions;
export const { updateOrderStatus, deleteOrder } = ordersSlice.actions;
export const { deleteCard, setDefaultCard } = cardsSlice.actions;
export const { updateContactStatus, deleteContact } = contactsSlice.actions;
export const { addBlog, updateBlog, deleteBlog, setBlogStatus } = blogsSlice.actions;
export const { toggleSidebar, showAdminToast, dismissAdminToast } = adminUISlice.actions;