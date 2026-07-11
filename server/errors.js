export class PdfError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = 'PdfError';
    this.code = code;
    this.status = status;
  }
}

export function toErrorResponse(error) {
  if (error instanceof PdfError) {
    return {
      status: error.status,
      body: {
        code: error.code,
        message: error.message
      }
    };
  }

  if (error?.type === 'entity.too.large' || error?.status === 413) {
    return {
      status: 413,
      body: {
        code: 'PDF_REQUEST_TOO_LARGE',
        message: 'Request body exceeds the maximum allowed size'
      }
    };
  }

  return {
    status: 500,
    body: {
      code: 'PDF_RENDER_FAILED',
      message: 'PDF render failed'
    }
  };
}
