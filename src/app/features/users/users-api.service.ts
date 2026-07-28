import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateUserRequest, UpdateUserRequest, UserSummary } from './models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/admin`;

  list(): Observable<UserSummary[]> {
    return this.http.get<UserSummary[]>(`${this.baseUrl}/users`);
  }

  getById(userId: string): Observable<UserSummary> {
    return this.http.get<UserSummary>(`${this.baseUrl}/users/${userId}`);
  }

  create(request: CreateUserRequest): Observable<UserSummary> {
    return this.http.post<UserSummary>(`${this.baseUrl}/users`, request);
  }

  update(userId: string, request: UpdateUserRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/users/${userId}`, request);
  }

  remove(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${userId}`);
  }

  roles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/roles`);
  }

  assignRole(userId: string, role: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/users/${userId}/roles/${role}`, {});
  }

  removeRole(userId: string, role: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${userId}/roles/${role}`);
  }
}
