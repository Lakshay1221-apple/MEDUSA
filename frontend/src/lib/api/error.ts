export class ApiError extends Error {
  public code: string;
  public status: number;
  public details?: any;

  constructor(message: string, code = 'ERROR', status = 500, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function parseApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error && typeof error === 'object' && 'response' in error) {
    const res = (error as any).response;
    const data = res?.data;
    const status = res?.status || 500;

    if (data?.error) {
      return new ApiError(
        data.error.message || 'An error occurred',
        data.error.code || 'ERROR',
        status,
        data.error.details,
      );
    }
  }

  if (error instanceof Error) {
    return new ApiError(error.message, 'CLIENT_ERROR', 0);
  }

  return new ApiError('An unknown error occurred', 'UNKNOWN_ERROR', 500);
}
