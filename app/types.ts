import { College } from './colleges';

export interface User {
  id: string;
  email: string;
  role: 'super-admin' | 'admin' | 'student';
  college?: College; // for admin
  password?: string;
  name?: string;
  studentId?: string;
}

export interface Report {
  id: string;
  studentId: string;
  location: { lat: number; lng: number };
  imageUris: string[];
  date: string;
  description: string;
  status: 'pending' | 'in-progress' | 'resolved';
  college: College;
  category: string;
  urgency: 'low' | 'medium' | 'high';
}