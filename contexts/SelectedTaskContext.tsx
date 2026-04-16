import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "selected_task";

interface SelectedTaskContextType {
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => Promise<void>;
  clearSelectedTaskId: () => Promise<void>;
}

const SelectedTaskContext = createContext<SelectedTaskContextType | null>(null);

export function SelectedTaskProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedTaskId, setSelected] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(STORAGE_KEY);
        if (v) setSelected(v);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const setSelectedTaskId = async (id: string | null) => {
    setSelected(id);
    try {
      if (id) await AsyncStorage.setItem(STORAGE_KEY, id);
      else await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  };

  const clearSelectedTaskId = async () => setSelectedTaskId(null);

  return (
    <SelectedTaskContext.Provider
      value={{ selectedTaskId, setSelectedTaskId, clearSelectedTaskId }}
    >
      {children}
    </SelectedTaskContext.Provider>
  );
}

export function useSelectedTask() {
  const ctx = useContext(SelectedTaskContext);
  if (!ctx)
    throw new Error(
      "useSelectedTask phải được sử dụng bên trong SelectedTaskProvider",
    );
  return ctx;
}

export default SelectedTaskProvider;
