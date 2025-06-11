export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  created_at: Date;
}

export interface Student {
  id: string;
  user_id: string;
  full_name: string;
  age?: number;
  gender?: string;
  notes?: string;
  created_at: Date;
}

export interface Class {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: Date;
}

export interface ClassStudent {
  id: string;
  class_id: string;
  student_id: string;
  added_at: Date;
}

export interface Grade {
  id: string;
  student_id: string;
  class_id: string;
  title: string;
  score: number;
  created_at: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, "password">;
}
