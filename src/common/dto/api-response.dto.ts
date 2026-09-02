export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, any>;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
