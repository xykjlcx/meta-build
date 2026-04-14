export interface PageResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number; // 1-indexed
  size: number;
}

export interface ProblemDetail {
  type: string;
  status: number;
  title?: string;
  detail?: string;
  instance?: string;
  code?: string;
  traceId?: string;
  errors?: Array<{ field: string; message: string }>;
}
