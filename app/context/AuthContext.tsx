import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Report } from '../types';

interface AuthContextType {
  user: User | null;
  users: User[];
  reports: Report[];
  login: (email: string, role: 'super-admin' | 'admin' | 'student') => void;
  logout: () => void;
  register: (email: string) => void;
  addReport: (reportData: Omit<Report, 'id' | 'status'>) => void;
  updateReportStatus: (id: string, status: Report['status']) => void;
  updateReportCollege: (id: string, college: Report['college']) => void;
  createAdmin: (email: string, college: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      const storedUsers = await AsyncStorage.getItem('users');
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      } else {
        // Initialize with a super-admin
        const superAdmin: User = { id: '1', email: 'super@cvsu.edu.ph', role: 'super-admin' };
        setUsers([superAdmin]);
        await AsyncStorage.setItem('users', JSON.stringify([superAdmin]));
      }
      const storedReports = await AsyncStorage.getItem('reports');
      if (storedReports) {
        const parsedReports = JSON.parse(storedReports);
        const migratedReports = parsedReports.map((r: any) => ({
          ...r,
          imageUris: Array.isArray(r.imageUris) ? r.imageUris : r.imageUri ? [r.imageUri] : [],
        }));
        setReports(migratedReports);
        await AsyncStorage.setItem('reports', JSON.stringify(migratedReports));
      }
    };
    loadData();
  }, []);

  const login = async (email: string, role: 'super-admin' | 'admin' | 'student') => {
    const existingUser = users.find(u => u.email === email && u.role === role);
    if (existingUser) {
      setUser(existingUser);
      await AsyncStorage.setItem('user', JSON.stringify(existingUser));
    } else if (role === 'student' && email.endsWith('@cvsu.edu.ph')) {
      const newUser: User = { id: Date.now().toString(), email, role };
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      setUser(newUser);
      await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
    } else {
      throw new Error('Invalid credentials');
    }
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('user');
  };

  const register = async (email: string) => {
    login(email, 'student');
  };

  const addReport = async (reportData: Omit<Report, 'id' | 'status'>) => {
    const newReport: Report = { ...reportData, id: Date.now().toString(), status: 'pending' };
    const updatedReports = [...reports, newReport];
    setReports(updatedReports);
    await AsyncStorage.setItem('reports', JSON.stringify(updatedReports));
  };

  const updateReportStatus = async (id: string, status: Report['status']) => {
    const updatedReports = reports.map(r => r.id === id ? { ...r, status } : r);
    setReports(updatedReports);
    await AsyncStorage.setItem('reports', JSON.stringify(updatedReports));
  };

  const updateReportCollege = async (id: string, college: Report['college']) => {
    const updatedReports = reports.map(r => r.id === id ? { ...r, college } : r);
    setReports(updatedReports);
    await AsyncStorage.setItem('reports', JSON.stringify(updatedReports));
  };

  const createAdmin = async (email: string, college: string) => {
    const newAdmin: User = { id: Date.now().toString(), email, role: 'admin', college };
    const updatedUsers = [...users, newAdmin];
    setUsers(updatedUsers);
    await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
  };

  return (
    <AuthContext.Provider value={{ user, users, reports, login, logout, register, addReport, updateReportStatus, updateReportCollege, createAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};