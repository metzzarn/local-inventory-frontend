export interface Item {
  id: number;
  name: string;
  quantity: number;
  category: string;
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
