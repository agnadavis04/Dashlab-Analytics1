import React, { createContext, useState, useContext } from "react";

const UserContext = createContext();

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    return JSON.parse(localStorage.getItem("user")) || null;
  });
  const [accounts, setAccounts] = useState(() => {
    return JSON.parse(localStorage.getItem("accounts")) || [];
  });

  const login = (email) => {
    const userData = { email };
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    // Optionally initialize accounts (e.g., fetch from an API or set default)
    const initialAccounts = []; // Replace with actual data if available
    setAccounts(initialAccounts);
    localStorage.setItem("accounts", JSON.stringify(initialAccounts));
  };

  const logout = () => {
    setUser(null);
    setAccounts([]);
    localStorage.removeItem("user");
    localStorage.removeItem("accounts");
  };

  const addAccount = (account) => {
    const updatedAccounts = [...accounts, { id: Date.now(), ...account }];
    setAccounts(updatedAccounts);
    localStorage.setItem("accounts", JSON.stringify(updatedAccounts));
  };

  return (
    <UserContext.Provider value={{ user, accounts, login, logout, addAccount }}>
      {children}
    </UserContext.Provider>
  );
}