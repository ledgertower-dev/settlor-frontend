import {
  parseApiError,
  throwApiError,
  isErrorCode,
  getErrorMessage,
  createErrorResponse,
  ErrorCode,
  isPermissionError,
  getPermissionErrorMessage,
} from '../../../src/lib/api/error-handler'

describe('Error Handler', () => {
  describe('parseApiError', () => {
    it('should return default error for unknown error types', () => {
      const result = parseApiError(undefined)

      expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR)
      expect(result.message).toBeTruthy()
    })

    it('should parse standard API error response format', () => {
      const error = {
        response: {
          status: 400,
          data: {
            status: 'error',
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Email is required',
              details: [{ field: 'email', message: 'Email is required' }],
            },
          },
        },
      }

      const result = parseApiError(error)

      expect(result.code).toBe('VALIDATION_ERROR')
      expect(result.message).toBe('Email is required')
      expect(result.details).toEqual([{ field: 'email', message: 'Email is required' }])
    })

    it('should parse legacy error format (success: false)', () => {
      const error = {
        response: {
          status: 400,
          data: {
            success: false,
            error: 'Something went wrong',
            code: 'CUSTOM_ERROR',
          },
        },
      }

      const result = parseApiError(error)

      expect(result.code).toBe('CUSTOM_ERROR')
      expect(result.message).toBe('Something went wrong')
    })

    it('should parse NestJS validation errors (message as array)', () => {
      const error = {
        response: {
          status: 422,
          data: {
            message: ['email must be a string', 'password is required'],
          },
        },
      }

      const result = parseApiError(error)

      expect(result.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(result.message).toBe('email must be a string, password is required')
    })

    it('should parse simple message format', () => {
      const error = {
        response: {
          status: 400,
          data: {
            message: 'Bad request',
          },
        },
      }

      const result = parseApiError(error)

      expect(result.message).toBe('Bad request')
    })

    it('should map 401 status to UNAUTHORIZED when code is unknown', () => {
      const error = {
        response: {
          status: 401,
          data: {},
        },
      }

      const result = parseApiError(error)

      expect(result.code).toBe(ErrorCode.UNAUTHORIZED)
    })

    it('should map 403 status to ACCESS_DENIED when code is unknown', () => {
      const error = {
        response: {
          status: 403,
          data: {},
        },
      }

      const result = parseApiError(error)

      expect(result.code).toBe(ErrorCode.ACCESS_DENIED)
    })

    it('should map 404 status to NOT_FOUND when code is unknown', () => {
      const error = {
        response: {
          status: 404,
          data: {},
        },
      }

      const result = parseApiError(error)

      expect(result.code).toBe(ErrorCode.NOT_FOUND)
    })

    it('should map 409 status to CONFLICT when code is unknown', () => {
      const error = {
        response: {
          status: 409,
          data: {},
        },
      }

      const result = parseApiError(error)

      expect(result.code).toBe(ErrorCode.CONFLICT)
    })

    it('should map 422 status to VALIDATION_ERROR when code is unknown', () => {
      const error = {
        response: {
          status: 422,
          data: {},
        },
      }

      const result = parseApiError(error)

      expect(result.code).toBe(ErrorCode.VALIDATION_ERROR)
    })

    it('should map 429 status to TIMEOUT_ERROR', () => {
      const error = {
        response: {
          status: 429,
          data: {},
        },
      }

      const result = parseApiError(error)

      expect(result.code).toBe(ErrorCode.TIMEOUT_ERROR)
    })

    it('should map 5xx status to SERVER_ERROR', () => {
      const error = {
        response: {
          status: 500,
          data: {},
        },
      }

      const result = parseApiError(error)

      expect(result.code).toBe(ErrorCode.SERVER_ERROR)
    })

    it('should handle network timeout errors', () => {
      const error = {
        code: 'ECONNABORTED',
        message: 'timeout exceeded',
      }

      const result = parseApiError(error)

      expect(result.code).toBe(ErrorCode.TIMEOUT_ERROR)
    })

    it('should handle ERR_NETWORK errors', () => {
      const error = {
        code: 'ERR_NETWORK',
        message: 'Network Error',
      }

      const result = parseApiError(error)

      expect(result.code).toBe(ErrorCode.NETWORK_ERROR)
    })

    it('should preserve specific error code over HTTP status mapping', () => {
      const error = {
        response: {
          status: 401,
          data: {
            status: 'error',
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Wrong password',
            },
          },
        },
      }

      const result = parseApiError(error)

      // Should keep INVALID_CREDENTIALS, not override with UNAUTHORIZED
      expect(result.code).toBe('INVALID_CREDENTIALS')
      expect(result.message).toBe('Wrong password')
    })
  })

  describe('throwApiError', () => {
    it('should throw an Error with the parsed message', () => {
      const error = {
        response: {
          status: 400,
          data: {
            status: 'error',
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid input',
            },
          },
        },
      }

      expect(() => throwApiError(error)).toThrow('Invalid input')
    })

    it('should attach error code to thrown error', () => {
      const error = {
        response: {
          status: 400,
          data: {
            status: 'error',
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid input',
            },
          },
        },
      }

      try {
        throwApiError(error)
      } catch (e) {
        const thrownError = e as Error & { code?: string }
        expect(thrownError.code).toBe('VALIDATION_ERROR')
        expect(thrownError.message).toBe('Invalid input')
      }
    })

    it('should attach details when present', () => {
      const error = {
        response: {
          status: 422,
          data: {
            status: 'error',
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: [{ field: 'email', message: 'Invalid email' }],
            },
          },
        },
      }

      try {
        throwApiError(error)
      } catch (e) {
        const thrownError = e as Error & { details?: Array<{ field: string; message: string }> }
        expect(thrownError.details).toEqual([{ field: 'email', message: 'Invalid email' }])
      }
    })
  })

  describe('isErrorCode', () => {
    it('should return true when error matches the code', () => {
      const error = {
        response: {
          status: 401,
          data: {
            status: 'error',
            error: {
              code: 'UNAUTHORIZED',
              message: 'Not authorized',
            },
          },
        },
      }

      expect(isErrorCode(error, ErrorCode.UNAUTHORIZED)).toBe(true)
    })

    it('should return false when error does not match the code', () => {
      const error = {
        response: {
          status: 400,
          data: {
            status: 'error',
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid',
            },
          },
        },
      }

      expect(isErrorCode(error, ErrorCode.UNAUTHORIZED)).toBe(false)
    })
  })

  describe('getErrorMessage', () => {
    it('should return the parsed error message', () => {
      const error = {
        response: {
          status: 400,
          data: {
            status: 'error',
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Field is required',
            },
          },
        },
      }

      expect(getErrorMessage(error)).toBe('Field is required')
    })

    it('should return a fallback message for unknown errors', () => {
      const result = getErrorMessage('random string')

      expect(result).toBeTruthy()
      expect(typeof result).toBe('string')
    })
  })

  describe('createErrorResponse', () => {
    it('should create a standardized error response object', () => {
      const error = {
        response: {
          status: 404,
          data: {
            status: 'error',
            error: {
              code: 'NOT_FOUND',
              message: 'Resource not found',
            },
          },
        },
      }

      const result = createErrorResponse(error)

      expect(result.status).toBe('error')
      expect(result.error.code).toBe('NOT_FOUND')
      expect(result.error.message).toBe('Resource not found')
      expect(result.timestamp).toBeTruthy()
    })
  })

  describe('isPermissionError', () => {
    it('should return true for FORBIDDEN error', () => {
      const error = {
        response: {
          status: 403,
          data: {
            status: 'error',
            error: {
              code: 'FORBIDDEN',
              message: 'Forbidden',
            },
          },
        },
      }

      expect(isPermissionError(error)).toBe(true)
    })

    it('should return true for ACCESS_DENIED error', () => {
      const error = {
        response: {
          status: 403,
          data: {
            status: 'error',
            error: {
              code: 'ACCESS_DENIED',
              message: 'Access denied',
            },
          },
        },
      }

      expect(isPermissionError(error)).toBe(true)
    })

    it('should return true for INSUFFICIENT_PERMISSIONS error', () => {
      const error = {
        response: {
          status: 403,
          data: {
            status: 'error',
            error: {
              code: 'INSUFFICIENT_PERMISSIONS',
              message: 'Not enough permissions',
            },
          },
        },
      }

      expect(isPermissionError(error)).toBe(true)
    })

    it('should return false for non-permission errors', () => {
      const error = {
        response: {
          status: 400,
          data: {
            status: 'error',
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid input',
            },
          },
        },
      }

      expect(isPermissionError(error)).toBe(false)
    })
  })

  describe('getPermissionErrorMessage', () => {
    it('should return backend message for permission errors with custom message', () => {
      const error = {
        response: {
          status: 403,
          data: {
            status: 'error',
            error: {
              code: 'ACCESS_DENIED',
              message: 'You cannot access this store',
            },
          },
        },
      }

      expect(getPermissionErrorMessage(error)).toBe('You cannot access this store')
    })

    it('should return generic message for non-permission errors', () => {
      const error = {
        response: {
          status: 400,
          data: {
            status: 'error',
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid input',
            },
          },
        },
      }

      // For non-permission errors, it falls through to getErrorMessage
      expect(getPermissionErrorMessage(error)).toBe('Invalid input')
    })
  })
})
