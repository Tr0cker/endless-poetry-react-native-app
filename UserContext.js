import React, { createContext, useState, useContext } from "react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState({ userId: null, username: "" });

  return (
    <UserContext.Provider value={{ userData, setUserData }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  return useContext(UserContext);
};
