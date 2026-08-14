import { z } from "zod";

export const noteSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  content: z.string().optional(),
  folderId: z.string().uuid().optional(),
});

export const folderSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(255),
});

export const uploadMetadataSchema = z.object({
  noteId: z.string().uuid().optional(),
  filename: z.string().min(1),
  fileUrl: z.string().url(),
  sizeBytes: z.number().positive(),
  type: z.enum(["pdf", "youtube", "image"]),
});
