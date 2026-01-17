
"use client";

import React, { createContext, useState, useMemo, ReactNode } from 'react';

type Location = {
  latitude: number;
  longitude: number;
};

type GeolocationContextType = {
  location: Location | null;
  setLocation: (location: Location) => void;
  error: string | null;
  setError: (error: string | null) => void;
};

export const GeolocationContext = createContext<GeolocationContextType | undefined>(undefined);

export const GeolocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);

  const value = useMemo(() => ({
    location,
    setLocation,
    error,
    setError,
  }), [location, error]);

  return (
    <GeolocationContext.Provider value={value}>
      {children}
    </GeolocationContext.Provider>
  );
};
