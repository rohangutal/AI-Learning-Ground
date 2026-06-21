import { create } from "zustand";

interface AppState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  currentTopic: string;
  setCurrentTopic: (topic: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  currentTopic: "",
  setCurrentTopic: (topic) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("study_current_topic", topic);
    }
    set({ currentTopic: topic });
  },
}));
