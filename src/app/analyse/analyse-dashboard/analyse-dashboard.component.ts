import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../services/ticket.service';
import { Ticket } from '../../models/ticket';
import { AnalyseCountPipe } from '../pipes/analyse-count.pipe';
import { AuthService } from '../../services/auth.service';

interface SousTicketSimple {
  id: number;
  titre: string;
  equipeResponsable: string;
}

interface TacheResponse {
  id: number;
  titre: string;
  statut: string;
  priorite: string;
  assigneeNom: string;
  assigneePrenom: string;
}

interface AnalyseIAResult {
  success: boolean;
  summary?: string;
  systems_detected?: string[];
  root_cause?: string;
  technical_tickets?: {
    system: string;
    title: string;
    description: string;
    priority: string;
    suggested_team: string;
  }[];
  processing_time_ms?: number;
  error?: string;
}

@Component({
  selector: 'app-analyse-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, AnalyseCountPipe],
  templateUrl: './analyse-dashboard.component.html',
  styleUrls: ['./analyse-dashboard.component.css']
})
export class AnalyseDashboardComponent implements OnInit {

  // ── Vue active ────────────────────────────────────
  activeView: 'validation' | 'analyse' = 'validation';

  // ── Tickets en attente de validation ─────────────
  ticketsEnAttente:     Ticket[] = [];
  filteredEnAttente:    Ticket[] = [];
  searchTermAttente     = '';
  filterPrioriteAttente = '';
  isLoadingAttente      = false;

  // ── Tickets approuvés pour l'IA ───────────────────
  tickets:      Ticket[] = [];
  isLoading     = false;
  errorMessage  = '';
  analyzingId:  number | null = null;

  // ── Panel rejet ───────────────────────────────────
  showRejetPanel   = false;
  ticketArejeter:  Ticket | null = null;
  motifRejet       = '';

  // ── Sous-tickets & tâches ─────────────────────────
  generatingTachesId: number | null = null;
  sousTicketsMap: { [ticketId: number]: SousTicketSimple[] } = {};
  tachesMap:      { [sousTicketId: number]: TacheResponse[] } = {};
  expandedTicketId: number | null = null;

  // ── Popup analyse IA ──────────────────────────────
  showAnalysePopup   = false;
  analysePopupTicket: Ticket | null = null;
  analysePopupResult: AnalyseIAResult | null = null;
  analysePopupLoading = false;

  // ── Cache des analyses ────────────────────────────
  analyseCache: { [ticketId: number]: AnalyseIAResult } = {};

  private springUrl = 'http://localhost:8070/api';
  private iaUrl     = 'http://localhost:8000/api/v1';

  private get headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`
    });
  }

  constructor(
    private ticketService: TicketService,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadTicketsEnAttente();
    this.loadTicketsApprouves();
  }

  // ══════════════════════════════════════════════════
  //  CHARGEMENT
  // ══════════════════════════════════════════════════
  loadTicketsEnAttente(): void {
    this.isLoadingAttente = true;
    this.ticketService.getAllTickets().subscribe({
      next: (data) => {
        this.ticketsEnAttente = data.filter(t => {
          const s = (t.statut as string)?.toUpperCase();
          return s === 'A_FAIRE';
        });
        this.applyFilterAttente();
        this.isLoadingAttente = false;
      },
      error: () => { this.isLoadingAttente = false; }
    });
  }

  logout(): void {
    this.authService.logout(); // supprime token + user
    this.router.navigate(['/login']); // ou route login
  }

  loadTicketsApprouves(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.ticketService.getAllTickets().subscribe({
      next: (data) => {
        console.log('ALL TICKETS:', data);

        this.tickets = data.filter(t => {
          const statut    = (t.statut as string)?.toUpperCase();
          const isApproved = statut === 'APPROUVE';
          const isAnalysed = t.analyseIAEffectuee === true;
          return isApproved || isAnalysed;
        });

        console.log('TICKETS IA:', this.tickets);
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Erreur lors du chargement';
        this.isLoading = false;
      }
    });
  }

  loadAcceptedTickets(): void {
    this.loadTicketsApprouves();
  }

  // ══════════════════════════════════════════════════
  //  FILTRES
  // ══════════════════════════════════════════════════
  applyFilterAttente(): void {
    const term = this.searchTermAttente.toLowerCase().trim();
    this.filteredEnAttente = this.ticketsEnAttente.filter(t => {
      const matchSearch = !term ||
        t.titre?.toLowerCase().includes(term) ||
        t.description?.toLowerCase().includes(term);
      let matchPrio = true;
      if (this.filterPrioriteAttente) {
        const p = (t.priorite as string)?.toUpperCase();
        switch (this.filterPrioriteAttente) {
          case 'HIGH':   matchPrio = p === 'HIGH'   || p === 'HAUTE';   break;
          case 'MEDIUM': matchPrio = p === 'MEDIUM' || p === 'MOYENNE'; break;
          case 'LOW':    matchPrio = p === 'LOW'    || p === 'BASSE';   break;
        }
      }
      return matchSearch && matchPrio;
    });
  }

  countAttentePrio(level: string): number {
    return this.ticketsEnAttente.filter(t => {
      const p = (t.priorite as string)?.toUpperCase();
      switch (level) {
        case 'HIGH':   return p === 'HIGH'   || p === 'HAUTE';
        case 'MEDIUM': return p === 'MEDIUM' || p === 'MOYENNE';
        case 'LOW':    return p === 'LOW'    || p === 'BASSE';
        default:       return false;
      }
    }).length;
  }

  // ══════════════════════════════════════════════════
  //  ACCEPTER
  // ══════════════════════════════════════════════════
  accepterTicket(ticket: Ticket): void {
    if (!ticket.id) return;

    this.ticketService.approveTicket(ticket.id).subscribe({
      next: () => {
        this.ticketsEnAttente = this.ticketsEnAttente
          .filter(t => t.id !== ticket.id);
        this.applyFilterAttente();

        const ticketApprouve: Ticket = {
          ...ticket,
          statut: 'APPROUVE',
          analyseIAEffectuee: false
        };
        this.tickets.unshift(ticketApprouve);
      },
      error: () => {
        this.errorMessage = 'Erreur lors de l\'acceptation.';
      }
    });
  }

  // ══════════════════════════════════════════════════
  //  REJETER
  // ══════════════════════════════════════════════════
  ouvrirRejet(ticket: Ticket): void {
    this.ticketArejeter = ticket;
    this.motifRejet     = '';
    this.showRejetPanel = true;
  }

  annulerRejet(): void {
    this.showRejetPanel = false;
    this.ticketArejeter = null;
    this.motifRejet     = '';
  }

  confirmerRejet(): void {
    if (!this.ticketArejeter?.id) return;

    this.ticketService.rejectTicket(this.ticketArejeter.id).subscribe({
      next: () => {
        this.ticketsEnAttente = this.ticketsEnAttente
          .filter(t => t.id !== this.ticketArejeter!.id);
        this.applyFilterAttente();
        this.annulerRejet();
      },
      error: () => {
        this.errorMessage = 'Erreur lors du rejet.';
      }
    });
  }

  // ══════════════════════════════════════════════════
  //  ANALYSE IA — Lancer
  // ══════════════════════════════════════════════════
  lancerAnalyse(ticket: Ticket): void {
    if (!ticket.id) return;

    this.analyzingId  = ticket.id;
    this.errorMessage = '';

    this.ticketService.analyzeTicket(ticket.id).subscribe({
      next: (updated: Ticket) => {
        const index = this.tickets.findIndex(t => t.id === updated.id);
        if (index !== -1) {
          this.tickets[index] = {
            ...this.tickets[index],
            ...updated,
            analyseIAEffectuee: true
          };
          this.tickets = [...this.tickets];
        }
        console.log('Analyse OK:', updated);
        this.analyzingId = null;
      },
      error: (err) => {
        console.error('Erreur analyse IA:', err);
        this.errorMessage =
          err?.error?.message || 'Erreur lors de l\'analyse du ticket';
        this.analyzingId = null;
      }
    });
  }

  // ══════════════════════════════════════════════════
  //  POPUP VOIR ANALYSE
  // ══════════════════════════════════════════════════
  voirAnalyse(ticket: Ticket): void {
    this.analysePopupTicket  = ticket;
    this.analysePopupResult  = null;
    this.analysePopupLoading = true;
    this.showAnalysePopup    = true;

    // Si déjà en cache → afficher directement
    if (ticket.id && this.analyseCache[ticket.id]) {
      this.analysePopupResult  = this.analyseCache[ticket.id];
      this.analysePopupLoading = false;
      return;
    }

    // Appeler le service IA Python pour récupérer l'analyse
    this.http.post<AnalyseIAResult>(
      `${this.iaUrl}/analyze`,
      {
        title:       ticket.titre,
        description: ticket.description,
        ticket_id:   String(ticket.id)
      },
      { headers: this.headers }
    ).subscribe({
      next: (result) => {
        this.analysePopupResult  = result;
        this.analysePopupLoading = false;
        // Mettre en cache
        if (ticket.id) {
          this.analyseCache[ticket.id] = result;
        }
      },
      error: (err) => {
        console.error('Erreur récupération analyse:', err);
        this.analysePopupResult = {
          success: false,
          error:   'Impossible de récupérer l\'analyse. Réessayez.'
        };
        this.analysePopupLoading = false;
      }
    });
  }

  fermerAnalysePopup(): void {
    this.showAnalysePopup    = false;
    this.analysePopupTicket  = null;
    this.analysePopupResult  = null;
    this.analysePopupLoading = false;
  }

  // ══════════════════════════════════════════════════
  //  SOUS-TICKETS
  // ══════════════════════════════════════════════════
  voirSousTickets(ticket: Ticket): void {
    if (!ticket.id) return;
    console.log(ticket.id);
    if (this.expandedTicketId === ticket.id) {
      this.expandedTicketId = null;
      return;
    }
    this.expandedTicketId = ticket.id;
    this.chargerSousTicketsAvecTaches(ticket.id);
  }

  private chargerSousTicketsAvecTaches(ticketId: number): void {
    if (this.sousTicketsMap[ticketId]) return;

    this.http.get<SousTicketSimple[]>(
      `${this.springUrl}/sous-tickets/ticket/${ticketId}`,
      { headers: this.headers }
    ).subscribe({
      next: (data) => {
        this.sousTicketsMap[ticketId] = data;
        data.forEach(st => {
          this.http.get<TacheResponse[]>(
            `${this.springUrl}/taches/sous-ticket/${st.id}`,
            { headers: this.headers }
          ).subscribe({
            next: (taches) => {
              if (taches?.length > 0) this.tachesMap[st.id] = taches;
            },
            error: () => {}
          });
        });
      },
      error: () => {
        this.errorMessage = 'Erreur chargement sous-tickets.';
      }
    });
  }

  genererTaches(sousTicketId: number): void {
    this.generatingTachesId = sousTicketId;
    this.http.post<TacheResponse[]>(
      `${this.springUrl}/taches/generer/${sousTicketId}`,
      {},
      { headers: this.headers }
    ).subscribe({
      next: (taches) => {
        this.tachesMap[sousTicketId] = taches;
        this.generatingTachesId = null;
      },
      error: () => {
        this.errorMessage = 'Erreur génération tâches.';
        this.generatingTachesId = null;
      }
    });
  }

  // ══════════════════════════════════════════════════
  //  HELPERS
  // ══════════════════════════════════════════════════
  getProgress(ticket: Ticket): number {
    return this.ticketService.getTicketProgress(ticket);
  }

  getPrioriteClass(priorite: string | undefined): string {
    const p = priorite?.toUpperCase();
    if (p === 'HIGH'   || p === 'HAUTE')   return 'prio-haute';
    if (p === 'MEDIUM' || p === 'MOYENNE') return 'prio-moyenne';
    if (p === 'LOW'    || p === 'BASSE')   return 'prio-basse';
    return '';
  }

  getPrioriteLabel(priorite: string | undefined): string {
    const p = priorite?.toUpperCase();
    if (p === 'HIGH'   || p === 'HAUTE')   return 'Haute';
    if (p === 'MEDIUM' || p === 'MOYENNE') return 'Moyenne';
    if (p === 'LOW'    || p === 'BASSE')   return 'Basse';
    return priorite ?? '—';
  }

  getPrioriteClassTicket(priority: string | undefined): string {
    const p = priority?.toUpperCase();
    if (p === 'HIGH'     || p === 'HAUTE')    return 'prio-haute';
    if (p === 'MEDIUM'   || p === 'MOYENNE')  return 'prio-moyenne';
    if (p === 'LOW'      || p === 'BASSE')    return 'prio-basse';
    if (p === 'CRITICAL' || p === 'CRITIQUE') return 'prio-critique';
    return '';
  }
}