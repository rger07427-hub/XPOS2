export type UserRole = 'admin' | 'kasir';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  unit: string;
  category_id: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Transaction {
  id: string;
  cashier_id: string;
  total: number;
  paid_amount: number | null;
  change_amount: number | null;
  payment_method: 'cash' | 'qris' | 'transfer';
  status: string;
  created_at: string;
  cashier?: Profile;
  items?: TransactionItem[];
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  product_name: string;
  price_at_sale: number;
  quantity: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CashierUser {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}
