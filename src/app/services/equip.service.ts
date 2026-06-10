// services/equipe.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Equipe {
  id: number;
  nom: string;
  description: string;
  systemeAssocie: string;
}

@Injectable({
  providedIn: 'root'
})
export class EquipeService {
  private apiUrl = 'http://localhost:8070/api/equipes';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getEquipes(): Observable<Equipe[]> {
    return this.http.get<Equipe[]>(this.apiUrl, { headers: this.getHeaders() });
  }
}