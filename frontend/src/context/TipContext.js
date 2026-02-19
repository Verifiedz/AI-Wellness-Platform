import React, { createContext, useContext, useState, useCallback } from "react";

const TipContext = createContext(null);

/**
 * Global state for the "Tip of the Day".
 *
 * Tips arrive via push notifications (FCM daily-tip message).
 * The HomeScreen reads `currentTip` and displays it in a card.
 */
export function TipProvider({ children }) {
  const [currentTip, setCurrentTip] = useState(null);

  const setTip = useCallback((tip) => {
    setCurrentTip({
      title: tip.title || "Your Daily Wellness Tip",
      body: tip.body || "",
      tipId: tip.tipId || null,
      category: tip.category || null,
      receivedAt: new Date().toISOString(),
    });
  }, []);

  const clearTip = useCallback(() => {
    setCurrentTip(null);
  }, []);

  return (
    <TipContext.Provider value={{ currentTip, setTip, clearTip }}>
      {children}
    </TipContext.Provider>
  );
}

export function useTip() {
  const ctx = useContext(TipContext);
  if (!ctx) throw new Error("useTip must be used within a TipProvider");
  return ctx;
}
