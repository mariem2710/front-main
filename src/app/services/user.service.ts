import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export enum Role {
  ADMIN            = 'ADMIN',
  METIER           = 'METIER',
  BUSINESS_ANALYST = 'BUSINESS_ANALYST',
  TECHNIQUE        = 'TECHNIQUE'
}

export interface User {
  id?:      number;
  nom:      string;
  prenom:   string;
  email:    string;
  password?: string;
  role:     Role;
  statut?:  string;
  equipeId?: number;
  equipeNom?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {

  private api = 'http://localhost:8070/api/users';

  constructor(private http: HttpClient) {}

  private get headers(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token') ?? ''}`
    });
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.api, { headers: this.headers });
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.api}/${id}`, { headers: this.headers });
  }

  createUser(user: User): Observable<User> {
    return this.http.post<User>(
      `${this.api}/creer`, user, { headers: this.headers });
  }

  updateUser(id: number, user: User): Observable<User> {
    return this.http.put<User>(
      `${this.api}/${id}`, user, { headers: this.headers });
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.api}/${id}`, { headers: this.headers });
  }

  accepterCompte(id: number, password: string): Observable<any> {
    return this.http.put<any>(
      `${this.api}/${id}/accepter`,
      { password },
      { headers: this.headers }
    );
  }

  refuserCompte(id: number): Observable<any> {
    return this.http.put<any>(
      `${this.api}/${id}/refuser`, {}, { headers: this.headers });
  }

  getDemandesEnAttente(): Observable<User[]> {
    return this.http.get<User[]>(
      `${this.api}/demandes/en-attente`, { headers: this.headers });
  }

  getUsersByRole(role: Role): Observable<User[]> {
    return this.http.get<User[]>(
      `${this.api}/role/${role}`, { headers: this.headers });
  }
}