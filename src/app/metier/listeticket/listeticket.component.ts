import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Ticket } from '../../models/ticket';
import { TicketService } from '../../services/ticket.service';
import { CommentaireService } from '../../services/commentaire.service';

@Component({
  selector: 'app-listeticket',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './listeticket.component.html',
  styleUrls: ['./listeticket.component.css']
})
export class ListeticketComponent implements OnInit {

  tickets:         Ticket[] = [];
  filteredTickets: Ticket[] = [];
  selectedStatut   = 'ALL';
  selectedPriorite = 'ALL';
  searchText       = '';

  activeCommentTicketId!: number;
  commentText   = '';
  commentaires: any[] = [];

  editingTicket:   any = null;
  showEditModal    = false;
  showCommentModal = false;

  successMsg = '';
  errorMsg   = '';

  constructor(
    private ticketService:      TicketService,
    private commentaireService: CommentaireService
  ) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  // ══════════════════════════════════════════════════
  //  CHARGEMENT
  // ══════════════════════════════════════════════════
  loadTickets(): void {
    this.ticketService.getAllTickets().subscribe({
      next: (data) => {
        const user = JSON.parse(
          localStorage.getItem('currentUser') ?? '{}'
        );
        this.tickets = user?.id
          ? data.filter(t =>
              t.createdById === user.id || !t.createdById
            )
          : data;
        this.filterTickets();
      },
      error: () => this.showError('Impossible de charger les tickets.')
    });
  }

  // ══════════════════════════════════════════════════
  //  FILTRES
  // ══════════════════════════════════════════════════
  filterTickets(): void {
    this.filteredTickets = this.tickets.filter(t => {
      const matchStatut = this.selectedStatut === 'ALL' ||
        t.statut === this.selectedStatut;
      const matchPrio   = this.selectedPriorite === 'ALL' ||
        (t.priorite ?? '').toUpperCase() ===
        this.selectedPriorite.toUpperCase();
      const matchSearch = !this.searchText ||
        t.titre?.toLowerCase()
          .includes(this.searchText.toLowerCase()) ||
        (t.description ?? '').toLowerCase()
          .includes(this.searchText.toLowerCase());
      return matchStatut && matchPrio && matchSearch;
    });
  }

  quickFilter(statut: string): void {
    this.selectedStatut = statut;
    this.filterTickets();
  }

  // ── Compteurs ─────────────────────────────────────
  get countTodo(): number {
    return this.tickets.filter(
      t => t.statut === 'A_FAIRE'
    ).length;
  }
  get countInProgress(): number {
    return this.tickets.filter(
      t => t.statut === 'EN_COURS'
    ).length;
  }
  get countDone(): number {
    return this.tickets.filter(
      t => t.statut === 'TERMINE'
    ).length;
  }
  get countApprouve(): number {
    return this.tickets.filter(
      t => t.statut === 'APPROUVE'
    ).length;
  }

  // ══════════════════════════════════════════════════
  //  CRUD
  // ══════════════════════════════════════════════════
  deleteTicket(id: number): void {
    if (!confirm('Confirmer la suppression ?')) return;
    this.ticketService.deleteTicket(id).subscribe({
      next: () => {
        this.showSuccess('Ticket supprimé.');
        this.loadTickets();
      },
      error: () => this.showError('Erreur lors de la suppression.')
    });
  }

  // ══════════════════════════════════════════════════
  //  MODAL EDIT
  // ══════════════════════════════════════════════════
  openEditModal(ticket: any): void {
    if (ticket.statut !== 'A_FAIRE') {
      this.showError(
        'Seuls les tickets "À faire" peuvent être modifiés.'
      );
      return;
    }
    this.editingTicket = {
      ...ticket,
      dateSouhaite: ticket.dateSouhaite ?? null
    };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingTicket = null;
  }

  saveEdit(): void {
    if (!this.editingTicket) return;
    this.ticketService.updateTicket(
      this.editingTicket.id,
      {
        titre:        this.editingTicket.titre,
        description:  this.editingTicket.description,
        statut:       'A_FAIRE',
        priorite:     this.editingTicket.priorite,
        dateSouhaite: this.editingTicket.dateSouhaite || null
      }
    ).subscribe({
      next: () => {
        this.closeEditModal();
        this.showSuccess('Ticket modifié.');
        this.loadTickets();
      },
      error: (err) =>
        this.showError(err.error?.message || 'Erreur modification.')
    });
  }

  // ══════════════════════════════════════════════════
  //  COMMENTAIRES
  // ══════════════════════════════════════════════════
  openCommentBox(ticketId: number): void {
    this.activeCommentTicketId = ticketId;
    this.commentText           = '';
    this.commentaires          = [];
    this.loadComments(ticketId);
    this.showCommentModal = true;
  }

  closeCommentBox(): void {
    this.showCommentModal      = false;
    this.activeCommentTicketId = null!;
    this.commentText           = '';
    this.commentaires          = [];
  }

  loadComments(ticketId: number): void {
    this.commentaireService.getByTicket(ticketId).subscribe({
      next: (data) => {
        this.commentaires = data;
        const t = this.tickets.find(x => x.id === ticketId);
        if (t) t.nombreCommentaires = data.length;
      },
      error: () => {}
    });
  }

  addComment(): void {
    if (!this.commentText.trim()) return;
    const user = JSON.parse(
      localStorage.getItem('currentUser') ?? '{}'
    );
    this.commentaireService.add({
      commentaire: this.commentText.trim(),
      ticketId:    this.activeCommentTicketId,
      userId:      user?.id
    }).subscribe({
      next: (r) => {
        this.commentaires = Array.isArray(r)
          ? r
          : [...this.commentaires, r];
        this.commentText = '';
        const t = this.tickets.find(
          x => x.id === this.activeCommentTicketId
        );
        if (t) t.nombreCommentaires = this.commentaires.length;
      },
      error: () => this.showError('Erreur ajout commentaire.')
    });
  }

  deleteComment(id: number): void {
    this.commentaireService.delete(id).subscribe({
      next: () => this.loadComments(this.activeCommentTicketId),
      error: () => {}
    });
  }

  // ══════════════════════════════════════════════════
  //  HELPERS — AFFICHAGE
  // ══════════════════════════════════════════════════
  formatTicketId(id: number): string {
    return '#TKT-' + String(id).padStart(4, '0');
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    return name.split(' ')
               .map(w => w[0])
               .join('')
               .slice(0, 2)
               .toUpperCase();
  }

  // ── Statut ────────────────────────────────────────
  getStatutLabel(s: string | undefined): string {
    const map: Record<string, string> = {
      A_FAIRE:  'À faire',
      EN_COURS: 'En cours',
      APPROUVE: 'Approuvé',
      REJETE:   'Rejeté',
      TERMINE:  'Terminé'
    };
    return map[(s ?? '').toUpperCase()] ?? (s ?? '—');
  }

  getStatutClass(s: string | undefined): string {
    const map: Record<string, string> = {
      A_FAIRE:  'badge-todo',
      EN_COURS: 'badge-progress',
      APPROUVE: 'badge-done',
      REJETE:   'badge-danger',
      TERMINE:  'badge-done'
    };
    return map[(s ?? '').toUpperCase()] ?? 'badge-todo';
  }

  // ── Priorité ✅ méthode manquante ajoutée ─────────
  getPrioriteClass(p: string | undefined): string {
    const map: Record<string, string> = {
      HIGH:    'prio prio-haute',
      HAUTE:   'prio prio-haute',
      MEDIUM:  'prio prio-moyenne',
      MOYENNE: 'prio prio-moyenne',
      LOW:     'prio prio-basse',
      BASSE:   'prio prio-basse'
    };
    return map[(p ?? '').toUpperCase()] ?? 'prio';
  }

  getPrioriteLabel(p: string | undefined): string {
    const map: Record<string, string> = {
      HIGH:    'Haute',
      HAUTE:   'Haute',
      MEDIUM:  'Moyenne',
      MOYENNE: 'Moyenne',
      LOW:     'Basse',
      BASSE:   'Basse'
    };
    return map[(p ?? '').toUpperCase()] ?? (p ?? '—');
  }

  // ── Messages ──────────────────────────────────────
  private showSuccess(msg: string): void {
    this.successMsg = msg;
    this.errorMsg   = '';
    setTimeout(() => { this.successMsg = ''; }, 3000);
  }

  private showError(msg: string): void {
    this.errorMsg   = msg;
    this.successMsg = '';
    setTimeout(() => { this.errorMsg = ''; }, 4000);
  }
}