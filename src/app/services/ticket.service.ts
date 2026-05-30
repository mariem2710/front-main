import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ticket } from '../models/ticket';

@Injectable({ providedIn: 'root' })
export class TicketService {

  private api = 'http://localhost:8060/api/tickets';

  constructor(private http: HttpClient) {}

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json'
    });
  }

  getAllTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(
      this.api,
      { headers: this.authHeaders() }
    );
  }

  getTicketById(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(
      `${this.api}/${id}`,
      { headers: this.authHeaders() }
    );
  }

  createTicket(ticket: Partial<Ticket>): Observable<Ticket> {
    return this.http.post<Ticket>(
      this.api,
      ticket,
      { headers: this.authHeaders() }
    );
  }

  updateTicket(
    id: number,
    ticket: Partial<Ticket>
  ): Observable<Ticket> {
    return this.http.put<Ticket>(
      `${this.api}/${id}`,
      ticket,
      { headers: this.authHeaders() }
    );
  }

  // ✅ Méthode manquante ajoutée
  deleteTicket(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.api}/${id}`,
      { headers: this.authHeaders() }
    );
  }

  approveTicket(id: number): Observable<Ticket> {
    return this.http.put<Ticket>(
      `${this.api}/${id}/approve`,
      {},
      { headers: this.authHeaders() }
    );
  }

  rejectTicket(id: number): Observable<Ticket> {
    return this.http.put<Ticket>(
      `${this.api}/${id}/reject`,
      {},
      { headers: this.authHeaders() }
    );
  }

  analyzeTicket(id: number): Observable<Ticket> {
    return this.http.post<Ticket>(
      `http://localhost:8000/api/v1/analyze`,
      {},
      { headers: this.authHeaders() }
    );
  }

  getTicketProgress(ticket: Ticket): number {
    return ticket.progression ?? 0;
  }

  decomposerTicket(id: number): Observable<any> {
    return this.http.post<any>(
      `${this.api}/${id}/decomposer`,
      {},
      { headers: this.authHeaders() }
    );
  }

  getDecomposition(id: number): Observable<any> {
    return this.http.get<any>(
      `${this.api}/${id}/decomposition`,
      { headers: this.authHeaders() }
    );
  }
  getProgression(ticket: Ticket): number {
  return ticket.progression ?? 0;   // ✅ plus d'erreur TS2339
}
}