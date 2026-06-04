import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CommentaireService {

  private api = 'http://localhost:8070/api/commentaires';

  constructor(private http: HttpClient) {}

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json'
    });
  }

  getByTicket(ticketId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.api}/ticket/${ticketId}`,
      { headers: this.authHeaders() }
    );
  }


  // Alias pour compatibilité
  addComment(
    ticketId: number,
    body: { commentaire: string; userId: number }
  ): Observable<any> {
    return this.http.post<any>(
      `${this.api}/${ticketId}`,
      body,
      { headers: this.authHeaders() }
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.api}/${id}`,
      { headers: this.authHeaders() }
    );
  }
}