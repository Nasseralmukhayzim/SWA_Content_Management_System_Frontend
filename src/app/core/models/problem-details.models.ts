export interface ProblemDetails {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  traceId?: string;
}

export interface ValidationProblemDetails extends ProblemDetails {
  errors: Record<string, string[]>;
}

/** Shape returned for Result-pattern failures (e.g. auth, role assignment) — not a ProblemDetails. */
export interface ResultError {
  code: string;
  description: string;
}

export interface AppError {
  title: string;
  detail?: string;
  status: number;
  fieldErrors?: Record<string, string[]>;
}
