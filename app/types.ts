export interface User {
  id: string;
  email: string;
  role: 'super-admin' | 'admin' | 'student';
  college?: string; // for admin
}

export interface Report {
  id: string;
  studentId: string;
  location: { lat: number; lng: number };
  imageUris: string[];
  date: string;
  description: string;
  status: 'pending' | 'in-progress' | 'resolved';
  college: 'CAS' | 'CCJ' | 'CEIT' | 'CEMDS' | 'unknown';
  category: string;
  urgency: 'low' | 'medium' | 'high';
}