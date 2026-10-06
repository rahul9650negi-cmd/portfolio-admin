import { createContext, useContext, useState } from "react";

const UIContext = createContext({ modalOpen: false, setModalOpen: () => {} });

export function UIProvider({ children }) {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <UIContext.Provider value={{ modalOpen, setModalOpen }}>
      {children}
    </UIContext.Provider>
  );
}

export const useUI = () => useContext(UIContext);