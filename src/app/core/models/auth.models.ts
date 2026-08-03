export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthenticationResponse {
  userId: string;
  email: string;
  token: string;
  expiresAtUtc: string;
}

export interface DecodedClaims {
  sub: string;
  email: string;
  roles: string[];
  exp: number;
  firstName?: string;
  lastName?: string;
}
