export interface ItemBatch {
  id: number;
  quantity: number;
  expire_date: string | null;
  created_at: string;
}

export interface Item {
  id: number;
  name: string;
  category: string;
  batches?: ItemBatch[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
}
