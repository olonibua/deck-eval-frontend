export interface ApiIssue {
  path?: string;
  message: string;
  fieldId?: string;
  responseId?: string | null;
  label?: string;
  responseLabel?: string | null;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly issues: ApiIssue[] = [],
  ) {
    super(message);
  }
}

export async function toApiError(res: Response): Promise<ApiError> {
  const body = await res.json().catch(() => ({}));
  const message = Array.isArray(body.message) ? body.message.join(', ') : body.message ?? res.statusText;
  return new ApiError(res.status, message || 'Something went wrong', body.issues ?? []);
}
