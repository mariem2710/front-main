import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ticket } from '../models/ticket';

@Injectable({ providedIn: 'root' })
export class TicketService {

  private api = 'http://localhost:8070/api/tickets';

  constructor(private http: HttpClient) {}

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json'
    });
  }

  getAllTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(this.api, {
      headers: this.authHeaders()
    });
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

  updateTicket(id: number, ticket: Partial<Ticket>): Observable<Ticket> {
    return this.http.put<Ticket>(
      `${this.api}/${id}`,
      ticket,
      { headers: this.authHeaders() }
    );
  }

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
      `${this.api}/${id}/analyze`,
      {},
      { headers: this.authHeaders() }
    );
  }

  getTicketProgress(ticket: Ticket): number {
    return ticket.progression ?? 0;
  }
}