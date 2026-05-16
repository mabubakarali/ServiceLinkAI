import React, { createContext, useContext, useState, useEffect } from 'react';

const NetworkContext = createContext();

export function NetworkProvider({ children }) {
  const [networkLatency, setNetworkLatency] = useState(42);
  const [connectionState, setConnectionState] = useState('CONNECTED'); // CONNECTING, CONNECTED, DISCONNECTED

  useEffect(() => {
    // Simulate real WebSocket backend streaming latency
    const interval = setInterval(() => {
      setNetworkLatency(Math.floor(Math.random() * 40) + 15);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const value = { networkLatency, connectionState };
  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) throw new Error("useNetwork must be used within NetworkProvider");
  return context;
}
