import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TicketService } from '../services/ticket.service';
import { Ticket } from '../models/ticket';

@Component({
  selector: 'app-add-ticket',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './add-ticket.component.html',
  styleUrls: ['./add-ticket.component.css']
})
export class AddTicketComponent {

  today = new Date();

  get minDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  // ── Utilisateur connecté ──────────────────────────
  private get currentUser(): any {
    return JSON.parse(
      localStorage.getItem('currentUser') ?? '{}'
    );
  }

  private get createdByLabel(): string {
    const u = this.currentUser;
    return [u?.prenom, u?.nom].filter(Boolean).join(' ')
      || u?.email
      || 'Utilisateur';
  }

  // ── Formulaire ────────────────────────────────────
  ticket: Partial<Ticket> = this.emptyTicket();

  message   = '';
  isSuccess = false;
  errors:   { [k: string]: string } = {};

  showForm = true;
  showList = false;
  ticketList: Ticket[] = [];

  constructor(private ticketService: TicketService) {}

  // ── Valider ───────────────────────────────────────
  private validate(): boolean {
    this.errors = {};
    if (!this.ticket.titre?.trim())
      this.errors['titre']       = 'Titre obligatoire';
    if (!this.ticket.description?.trim())
      this.errors['description'] = 'Description obligatoire';
    if (!this.ticket.priorite)
      this.errors['priorite']    = 'Priorité obligatoire';
    if (!this.ticket.dateSouhaite)
      this.errors['dateSouhaite'] = 'Date obligatoire';
    else {
      const sel   = new Date(this.ticket.dateSouhaite);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (sel <= today)
        this.errors['dateSouhaite'] =
          'La date doit être supérieure à aujourd\'hui';
    }
    return Object.keys(this.errors).length === 0;
  }

  hasError(field: string): boolean {
    return !!this.errors[field];
  }

  // ── Créer ticket ──────────────────────────────────
  createTicket(): void {
    if (!this.validate()) {
      this.message   = '❌ Veuillez remplir tous les champs.';
      this.isSuccess = false;
      return;
    }

    // ✅ Ne PAS envoyer createdBy → Spring Boot l'ignore
    // Le backend doit récupérer l'utilisateur via le token JWT
    const payload: Partial<Ticket> = {
      titre:        this.ticket.titre!.trim(),
      description:  this.ticket.description!.trim(),
      statut:       'A_FAIRE',
      priorite:     this.ticket.priorite!,
      dateSouhaite: this.ticket.dateSouhaite
    };

    this.ticketService.createTicket(payload).subscribe({
      next: (created) => {
        // Ajouter createdBy côté Angular uniquement (affichage local)
        const newTicket: Ticket = {
          ...created,
          createdBy: this.createdByLabel
        };
        this.ticketList.unshift(newTicket);
        this.showList  = true;
        this.showForm  = false;
        this.message   = '✅ Ticket créé avec succès.';
        this.isSuccess = true;
        this.errors    = {};
      },
      error: (err) => {
        console.error('Erreur création ticket:', err);
        this.message   = err.error?.message || '❌ Erreur serveur.';
        this.isSuccess = false;
      }
    });
  }

  // ── Reset ─────────────────────────────────────────
  resetForm(): void {
    this.ticket    = this.emptyTicket();
    this.errors    = {};
    this.message   = '';
    this.isSuccess = false;
    this.showForm  = true;
    this.showList  = this.ticketList.length > 0;
  }

  removeTicket(index: number): void {
    this.ticketList.splice(index, 1);
    if (this.ticketList.length === 0) {
      this.showList = false;
    }
  }

  // ── Helpers affichage ─────────────────────────────
  getPrioriteClass(p: string): string {
    const map: Record<string, string> = {
      HAUTE:   'prio prio-haute',
      HIGH:    'prio prio-haute',
      MOYENNE: 'prio prio-moyenne',
      MEDIUM:  'prio prio-moyenne',
      BASSE:   'prio prio-basse',
      LOW:     'prio prio-basse'
    };
    return map[p?.toUpperCase()] ?? 'prio';
  }

  getPrioriteLabel(p: string): string {
    const map: Record<string, string> = {
      HAUTE:   'Haute',
      HIGH:    'Haute',
      MOYENNE: 'Moyenne',
      MEDIUM:  'Moyenne',
      BASSE:   'Basse',
      LOW:     'Basse'
    };
    return map[p?.toUpperCase()] ?? p ?? '—';
  }

  private emptyTicket(): Partial<Ticket> {
    return {
      titre:        '',
      description:  '',
      statut:       'A_FAIRE',
      priorite:     'MOYENNE',
      dateSouhaite: this.minDate
    };
  }
}