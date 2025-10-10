
"use client";

import React, { createContext, useState, useContext, useMemo } from 'react';

type SAOContextType = {
  isSaoEnabled: boolean;
  toggleSAO: (enabled: boolean) => void;
};

const SAOContext = createContext<SAOContextType | undefined>(undefined);

export const SAOProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSaoEnabled, setIsSaoEnabled] = useState(true);

  const toggleSAO = (enabled: boolean) => {
    setIsSaoEnabled(enabled);
  };

  const value = useMemo(() => ({ isSaoEnabled, toggleSAO }), [isSaoEnabled]);

  return (
    <SAOContext.Provider value={value}>
      {children}
    </SAOContext.Provider>
  );
};

export const useSAO = () => {
  const context = useContext(SAOContext);
  if (context === undefined) {
    throw new Error('useSAO must be used within a SAOProvider');
  }
  return context;
};
