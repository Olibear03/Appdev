import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Report, User } from '../types';
const getCrypto = () => {
  try {
    // Use require so bundlers don't fail if package is missing
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-crypto');
  } catch (e) {
    return null;
  }
};

interface AuthContextType {
  user: User | null;
  users: User[];
  reports: Report[];
  login: (email: string, role: 'super-admin' | 'admin' | 'student', password?: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password?: string, opts?: { name?: string; studentId?: string; college?: string }) => Promise<void>;
  addReport: (reportData: Omit<Report, 'id' | 'status'>) => void;
  updateReportStatus: (id: string, status: Report['status']) => void;
  updateReportCollege: (id: string, college: Report['college']) => void;
  createAdmin: (email: string, college: string, password?: string) => void;
  editAdmin: (id: string, updates: { email?: string; college?: string; password?: string }) => Promise<void>;
  deleteAdmin: (id: string) => Promise<void>;
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

  const login = async (email: string, role: 'super-admin' | 'admin' | 'student', password?: string) => {
    const existingUser = users.find(u => u.email === email && u.role === role);
    if (!existingUser) throw new Error('Invalid credentials');

    // If the stored user has a password hash, require password and compare hashes
    if (existingUser.password) {
      if (!password) throw new Error('Invalid credentials');
      const Crypto = getCrypto();
      if (!Crypto) throw new Error('Missing dependency: please run `expo install expo-crypto`');
      const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
      if (hashed !== existingUser.password) throw new Error('Invalid credentials');
    }

    setUser(existingUser);
    await AsyncStorage.setItem('user', JSON.stringify(existingUser));
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('user');
  };

  const register = async (email: string, password?: string, opts?: { name?: string; studentId?: string; college?: string }) => {
    if (!email.endsWith('@cvsu.edu.ph')) throw new Error('Invalid email');
    let hashed: string | undefined;
    if (password) {
      const Crypto = getCrypto();
      if (!Crypto) throw new Error('Missing dependency: please run `expo install expo-crypto`');
      hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
    }
    const newUser: User = { id: Date.now().toString(), email, role: 'student', password: hashed, name: opts?.name, studentId: opts?.studentId, college: opts?.college };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    setUser(newUser);
    await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
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

  const createAdmin = async (email: string, college: string, password?: string) => {
    let hashed: string | undefined;
    if (password) {
      const Crypto = getCrypto();
      if (!Crypto) throw new Error('Missing dependency: please run `expo install expo-crypto`');
      hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
    }
    const newAdmin: User = { id: Date.now().toString(), email, role: 'admin', college, password: hashed };
    const updatedUsers = [...users, newAdmin];
    setUsers(updatedUsers);
    await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
  };

  const editAdmin = async (id: string, updates: { email?: string; college?: string; password?: string }) => {
    const updatedUsers = await Promise.resolve(users.map(u => {
      if (u.id !== id) return u;
      const copy = { ...u };
      if (updates.email) copy.email = updates.email;
      if (updates.college) copy.college = updates.college as any;
      return copy;
    }));
    // handle password separately to hash if provided
    if (updates.password) {
      const Crypto = getCrypto();
      if (!Crypto) throw new Error('Missing dependency: please run `expo install expo-crypto`');
      const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, updates.password);
      for (const u of updatedUsers) {
        if (u.id === id) u.password = hashed;
      }
    }
    setUsers(updatedUsers);
    await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
    // if editing current user, update stored user as well
    if (user?.id === id) {
      const newCurrent = updatedUsers.find(u => u.id === id) || null;
      setUser(newCurrent);
      if (newCurrent) await AsyncStorage.setItem('user', JSON.stringify(newCurrent));
    }
  };

  const deleteAdmin = async (id: string) => {
    const updatedUsers = users.filter(u => u.id !== id);
    setUsers(updatedUsers);
    await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
    // if deleting current user, log out
    if (user?.id === id) {
      setUser(null);
      await AsyncStorage.removeItem('user');
    }
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