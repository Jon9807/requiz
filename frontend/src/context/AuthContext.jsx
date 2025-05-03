// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";
import { API_BASE } from "../config";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);    

  const fetchProfile = async (currentToken) => {
    try {
      const response = await fetch(`${API_BASE}?action=get_profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
      });
      const data = await response.json();
      if (data.username) {
        setUser(data);
      } else {
        logout();
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      logout();
    }
  };

  const login = (newToken, userData = null) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    if (userData) {
      setUser(userData);      
      setReady(true);
      setLoading(false);
    } else {
      setLoading(true);
      fetchProfile(newToken).finally(() => {
        setLoading(false);
        setReady(true);
      });
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setLoading(false);
    setReady(true);
  };

  useEffect(() => {
    if (token) {
      fetchProfile(token).finally(() => {
        setLoading(false);
        setReady(true);
      });
    } else {
      setLoading(false);
      setReady(true);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading, ready }}>
      {children}
    </AuthContext.Provider>
  );
};
