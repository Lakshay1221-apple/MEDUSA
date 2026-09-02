import { describe, it, expect } from 'vitest';
import { ApiError, parseApiError } from '@/lib/api/error';

describe('API Error Handling', () => {
  it('creates an ApiError instance with custom parameters', () => {
    const error = new ApiError('Concession rejected', 'INVALID_COMMITMENT_PHRASE', 400, {
      expected: 'I ACCEPT THE COST',
    });
    expect(error.message).toBe('Concession rejected');
    expect(error.code).toBe('INVALID_COMMITMENT_PHRASE');
    expect(error.status).toBe(400);
    expect(error.details?.expected).toBe('I ACCEPT THE COST');
  });

  it('parses nested backend ApiErrorResponse objects', () => {
    const backendError = {
      response: {
        status: 403,
        data: {
          error: {
            code: 'FORBIDDEN',
            message: 'Access to this arc is forbidden',
          },
        },
      },
    };

    const parsed = parseApiError(backendError);
    expect(parsed.code).toBe('FORBIDDEN');
    expect(parsed.message).toBe('Access to this arc is forbidden');
    expect(parsed.status).toBe(403);
  });
});
