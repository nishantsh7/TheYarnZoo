
import type { ObjectId } from 'mongodb';

export interface Product {
  _id?: string; 
  id: string; 
  slug: string;
  name: string;
  description: string;
  price: number;
  category: string;
  material: string;
  images: string[];
  stock: number;
  reviews?: Review[];
  averageRating?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Review {
  _id?: string; 
  id: string; 
  userId: string;
  userName: string;
  productId: string; 
  rating: number;
  text: string;
  date: string; 
  createdAt?: Date;
}

export interface CartItem {
  productId: string; 
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock: number; 
}

export interface ShippingAddress {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string; 
  email?: string; 
}

export interface OrderItem { 
  productId: string; 
  name: string;
  price: number; 
  image: string;
  quantity: number;
}

export interface Order {
  _id?: string; 
  id: string; 
  userId?: string; 
  userEmail?: string; 
  items: OrderItem[]; 
  totalAmount: number; 
  shippingAddress: ShippingAddress; 
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'admin' | 'user';

export interface UserDocument {
  _id?: ObjectId; 
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  shippingAddress?: ShippingAddress; 
}

export interface AdminCustomerInfo {
    _id: string; 
    name: string;
    email: string;
    role: UserRole;
    createdAt: string; 
}

export interface DashboardStats {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    totalCustomers: number;
    pendingOrders: number;
    lowStockItems: number;
}

// Chat Feature Types
export interface ChatSession {
  _id?: ObjectId; 
  customerId: ObjectId;
  customerName: string;
  customerEmail: string;
  adminId: ObjectId | null;
  lastMessage?: string;
  lastMessageAt?: Date;
  lastMessageSenderType?: 'admin' | 'customer';
  customerUnreadCount: number;
  adminUnreadCount: number;
  status: 'open' | 'closed_by_admin' | 'closed_by_customer' | 'pending_customer_reply' | 'pending_admin_reply';
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  _id: string; 
  sessionId: string;
  senderId: string; 
  senderType: 'admin' | 'customer';
  text: string;
  timestamp: Date;
  readByAdmin?: boolean; 
  readByCustomer?: boolean; 
}

export interface ChatSessionListItem {
  _id: string; 
  customerId: string; 
  customerName: string; 
  customerEmail: string; 
  adminId: string | null; 
  lastMessage?: string; 
  lastMessageAt?: Date;
  lastMessageSenderType?: 'admin' | 'customer';
  customerUnreadCount: number; 
  adminUnreadCount: number; 
  status: 'open' | 'closed_by_admin' | 'closed_by_customer' | 'pending_customer_reply' | 'pending_admin_reply';
  createdAt: Date;
  updatedAt: Date;
}

export interface NewsletterSubscription {
  _id?: ObjectId;
  email: string;
  subscribedAt: Date;
}

export type ProfileActionResponse = {
  success: boolean;
  message: string;
};

export type MonthlySalesData = {
  month: string;
  total: number;
};

export interface NotificationSettings {
  newOrderAdmin: boolean;
  newOrderCustomer: boolean;
  shippingUpdateCustomer: boolean;
  lowStockAdmin: boolean;
  adminEmail: string;
}
