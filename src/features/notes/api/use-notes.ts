import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

// Mock API functions
const fetchNotes = async (): Promise<Note[]> => {
  const res = await fetch("/api/notes");
  if (!res.ok) throw new Error("Failed to fetch notes");
  return res.json();
};

export const useNotes = () => {
  return useQuery({
    queryKey: ["notes"],
    queryFn: fetchNotes,
  });
};

export const useCreateNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newNote: Partial<Note>) => {
      const res = await fetch("/api/notes", {
        method: "POST",
        body: JSON.stringify(newNote),
      });
      if (!res.ok) throw new Error("Failed to create note");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
};
