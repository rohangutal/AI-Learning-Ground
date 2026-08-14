export type AppRole = "student" | "admin";

export type AiProvider = "deepseek" | "gemini" | "claude";

export type StudyContentSource = "manual" | "pdf" | "youtube" | "audio";

export type BaseEntity = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PaginatedResponse<T> = {
  data: T[];
  metadata: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type ApiError = {
  message: string;
  code: string;
  status: number;
};
