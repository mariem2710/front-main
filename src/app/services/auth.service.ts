import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface LoginRequest {
  email:    string;
  password: string;
}

export interface LoginResponse {
  token:   string;
  email:   string;
  role:    string;
  id?:     number;
  nom?:    string;
  prenom?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private api = 'http://localhost:8070/api/users';

  constructor(
    private http:   HttpClient,
    private router: Router
  ) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.api}/login`,
      credentials,
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        })
      }
    ).pipe(
      tap((response: LoginResponse) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('role',  response.role);
        localStorage.setItem('email', response.email);

        // ✅ Sauvegarder userId séparément
        if (response.id) {
          localStorage.setItem('userId', String(response.id));
        }
        if (response.nom) {
          localStorage.setItem('nom', response.nom);
        }
        if (response.prenom) {
          localStorage.setItem('prenom', response.prenom);
        }

        localStorage.setItem('currentUser', JSON.stringify({
          id:     response.id,
          nom:    response.nom,
          prenom: response.prenom,
          email:  response.email,
          role:   response.role
        }));

        console.log('✅ Token sauvegardé:', response.token);
        console.log('✅ UserId sauvegardé:', response.id);
      })
    );
  }

  demanderCompte(demande: {
    nom:    string;
    prenom: string;
    email:  string;
    role:   string;
  }): Observable<any> {
    return this.http.post<any>(
      `${this.api}/demande`,
      demande,
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        })
      }
    );
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }

  getUserId(): number {
    return parseInt(
      localStorage.getItem('userId') ?? '0'
    );
  }

  getCurrentUser(): any {
    return JSON.parse(
      localStorage.getItem('currentUser') ?? 'null'
    );
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}