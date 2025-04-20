import React, { createContext, useContext, useState, useEffect } from "react";

import { useToast } from "@/hooks/use-toast";

type User = {
  id: number;
  username: string;
  isAdmin: boolean;
  lastLogin: string | null;
};

type AuthContextProps = {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check if user is logged in on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse stored user", error);
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Handle hardcoded admin credentials directly
      if (username === "admin" && password === "superman123") {
        const adminUser: User = {
          id: 1,
          username: "admin",
          isAdmin: true,
          lastLogin: new Date().toISOString()
        };
        
        setUser(adminUser);
        localStorage.setItem("user", JSON.stringify(adminUser));
        
        toast({
          title: "Login Successful",
          description: `Welcome, ${adminUser.username}!`,
        });
        
        return true;
      }
      
      // Only try server auth if not using hardcoded admin
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Login Failed",
          description: error.message || "Invalid username or password",
          variant: "destructive",
        });
        return false;
      }

      const userData = await response.json();
      setUser(userData);
      
      // Save user to localStorage
      localStorage.setItem("user", JSON.stringify(userData));
      
      toast({
        title: "Login Successful",
        description: `Welcome, ${userData.username}!`,
      });
      
      return true;
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Error",
        description: "An error occurred during login",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}