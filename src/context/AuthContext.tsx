'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  location?: string;
  isAdmin?: boolean;
  // Seller fields
  isSeller?: boolean;
  sellerId?: string;
  sellerStatus?: 'pending' | 'approved' | 'rejected' | 'suspended';
  // Delivery partner fields
  isDeliveryPartner?: boolean;
  deliveryPartnerId?: string;
  deliveryPartnerStatus?: 'active' | 'inactive' | 'suspended';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  // Seller status
  isSeller: boolean;
  sellerId?: string;
  sellerStatus?: 'pending' | 'approved' | 'rejected' | 'suspended';
  isApprovedSeller: boolean;
  // Delivery partner status
  isDeliveryPartner: boolean;
  deliveryPartnerId?: string;
  deliveryPartnerStatus?: 'active' | 'inactive' | 'suspended';
  isActiveDeliveryPartner: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.isAdmin || false,
        isSeller: user?.isSeller || false,
        sellerId: user?.sellerId,
        sellerStatus: user?.sellerStatus,
        isApprovedSeller: user?.isSeller === true && user?.sellerStatus === 'approved',
        isDeliveryPartner: user?.isDeliveryPartner || false,
        deliveryPartnerId: user?.deliveryPartnerId,
        deliveryPartnerStatus: user?.deliveryPartnerStatus,
        isActiveDeliveryPartner: user?.isDeliveryPartner === true && user?.deliveryPartnerStatus === 'active',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
