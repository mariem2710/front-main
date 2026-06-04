import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';

interface Tache {
  id: number;
  titre: string;
  description: string;
  statut: string;
  priorite: string;
  dateCreation: string;
  dateLimite: string | null;
  sousTicketId: number;
  sousTicketTitre: string;
  ticketId: number;
  assigneeId: number;
  assigneeNom: string;
  assigneePrenom: string;
}

interface TicketGroupe {
  ticketId: number;
  ticketTitre: string;
  sousTickets: SousTicketGroupe[];
  progression: number;
  totalTaches: number;
  tachesFaites: number;
  ferme: boolean;
}

interface SousTicketGroupe {
  sousTicketId: number;
  sousTicketTitre: string;
  taches: Tache[];
}

interface ProgressionResponse {
  ticketId:       number;
  totalTaches:    number;
  tachesFaites:   number;
  progression:    number;
  progressionPct: string;
  ferme:          boolean;
}

@Component({
  selector: 'app-technique-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './technique-dashboard.component.html',
  styleUrls: ['./technique-dashboard.component.css']
})
export class TechniqueDashboardComponent implements OnInit, OnDestroy {

  // ── Données ───────────────────────────────────────
  taches:         Tache[]        = [];
  ticketsGroupes: TicketGroupe[] = [];
  isLoading       = false;
  errorMessage    = '';

  // ── Vue active ────────────────────────────────────
  view = 'taches';   // 'taches' | 'probleme'

  // ── Problème IA ───────────────────────────────────
  problemeText    = '';
  problemeReponse = '';
  selectedTache:  Tache | null = null;
  sendingProbleme = false;

  // ── Terminer tache ────────────────────────────────
  terminatingId: number | null = null;

  // ── Refresh auto ──────────────────────────────────
  private refreshSub?: Subscription;

  private apiUrl = 'http://localhost:8070/api';

  // ── User connecté ─────────────────────────────────
  private get currentUser(): any {
    return JSON.parse(
      localStorage.getItem('currentUser') ?? '{}'
    );
  }

  get employeId(): number {
    return this.currentUser?.id ?? 0;
  }

  get nomEmploye(): string {
    const u = this.currentUser;
    return [u?.prenom, u?.nom].filter(Boolean).join(' ') || 'Employé';
  }

  get initiales(): string {
    const u = this.currentUser;
    return (
      (u?.prenom?.[0] ?? '') +
      (u?.nom?.[0]    ?? '')
    ).toUpperCase() || 'T';
  }

  private get headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`
    });
  }

  constructor(
    private http:        HttpClient,
    private router:      Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadMesTaches();
    // Refresh auto toutes les 30 secondes
    this.refreshSub = interval(30000).subscribe(() => {
      this.loadMesTaches();
    });
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
  }

  // ══════════════════════════════════════════════════
  //  CHARGEMENT TÂCHES
  // ══════════════════════════════════════════════════
  loadMesTaches(): void {
    if (!this.employeId) {
      this.errorMessage = 'Utilisateur non identifié.';
      return;
    }

    this.isLoading    = true;
    this.errorMessage = '';

    this.http.get<Tache[]>(
      `${this.apiUrl}/taches/mes-taches/${this.employeId}`,
      { headers: this.headers }
    ).subscribe({
      next: (data) => {
        this.taches    = data;
        this.isLoading = false;
        this.grouperParTicket();
        // Charger la progression de chaque ticket
        const ticketIds = [...new Set(data.map(t => t.ticketId))];
        ticketIds.forEach(id => this.loadProgression(id));
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des tâches.';
        this.isLoading    = false;
      }
    });
  }

  // ── Grouper les tâches par Ticket → SousTicket ────
  private grouperParTicket(): void {
    const map = new Map<number, TicketGroupe>();

    for (const tache of this.taches) {
      if (!map.has(tache.ticketId)) {
        map.set(tache.ticketId, {
          ticketId:     tache.ticketId,
          ticketTitre:  `Ticket #${tache.ticketId}`,
          sousTickets:  [],
          progression:  0,
          totalTaches:  0,
          tachesFaites: 0,
          ferme:        false
        });
      }

      const groupe = map.get(tache.ticketId)!;

      // Chercher ou créer le sous-ticket
      let st = groupe.sousTickets.find(
        s => s.sousTicketId === tache.sousTicketId
      );
      if (!st) {
        st = {
          sousTicketId:    tache.sousTicketId,
          sousTicketTitre: tache.sousTicketTitre || `Sous-ticket #${tache.sousTicketId}`,
          taches:          []
        };
        groupe.sousTickets.push(st);
      }

      st.taches.push(tache);
    }

    this.ticketsGroupes = Array.from(map.values());
  }

  // ── Charger la progression d'un ticket ────────────
  loadProgression(ticketId: number): void {
    this.http.get<ProgressionResponse>(
      `${this.apiUrl}/taches/progression/ticket/${ticketId}`,
      { headers: this.headers }
    ).subscribe({
      next: (data) => {
        const groupe = this.ticketsGroupes.find(
          g => g.ticketId === ticketId
        );
        if (groupe) {
          groupe.progression  = data.progression   ?? 0;
          groupe.totalTaches  = data.totalTaches   ?? 0;
          groupe.tachesFaites = data.tachesFaites  ?? 0;
          groupe.ferme        = data.ferme          ?? false;
        }
      },
      error: () => {}
    });
  }

  // ══════════════════════════════════════════════════
  //  TERMINER UNE TÂCHE
  // ══════════════════════════════════════════════════
  terminerTache(tache: Tache): void {
    if (this.terminatingId === tache.id) return;
    this.terminatingId = tache.id;

    this.http.put<Tache>(
      `${this.apiUrl}/taches/${tache.id}/terminer/${this.employeId}`,
      {},
      { headers: this.headers }
    ).subscribe({
      next: (updated) => {
        // Mettre à jour la tâche dans la liste
        const idx = this.taches.findIndex(t => t.id === tache.id);
        if (idx !== -1) this.taches[idx] = updated;

        // Mettre à jour dans les groupes
        for (const groupe of this.ticketsGroupes) {
          for (const st of groupe.sousTickets) {
            const tidx = st.taches.findIndex(t => t.id === tache.id);
            if (tidx !== -1) {
              st.taches[tidx] = updated;
            }
          }
        }

        // Recharger la progression
        this.loadProgression(tache.ticketId);
        this.terminatingId = null;
      },
      error: () => {
        this.errorMessage  = 'Erreur lors de la mise à jour de la tâche.';
        this.terminatingId = null;
      }
    });
  }

  // ══════════════════════════════════════════════════
  //  PROBLÈME IA
  // ══════════════════════════════════════════════════
  ouvrirProbleme(tache: Tache): void {
    this.selectedTache  = tache;
    this.problemeText   = '';
    this.problemeReponse= '';
    this.view           = 'probleme';
  }

  envoyerProbleme(): void {
    if (!this.selectedTache || !this.problemeText.trim()) return;
    this.sendingProbleme = true;
    this.problemeReponse = '';

    this.http.post<{ reponse: string }>(
      `${this.apiUrl}/taches/${this.selectedTache.id}/probleme?` +
      `probleme=${encodeURIComponent(this.problemeText)}`,
      {},
      { headers: this.headers }
    ).subscribe({
      next: (res) => {
        this.problemeReponse = res.reponse;
        this.sendingProbleme = false;
      },
      error: () => {
        this.problemeReponse = 'Erreur lors de la communication avec l\'IA.';
        this.sendingProbleme = false;
      }
    });
  }

  // ══════════════════════════════════════════════════
  //  HELPERS
  // ══════════════════════════════════════════════════
  getCircleDashoffset(progression: number): number {
    const r = 54;
    const circumference = 2 * Math.PI * r;
    return circumference - (progression / 100) * circumference;
  }

  getProgressColor(progression: number): string {
    if (progression >= 100) return '#3db07a';
    if (progression >= 50)  return '#4a90d9';
    if (progression >= 25)  return '#d4a017';
    return '#e05555';
  }

  getPrioriteClass(p: string | undefined): string {
    const map: Record<string, string> = {
      HAUTE:    'prio-haute',
      HIGH:     'prio-haute',
      MOYENNE:  'prio-moyenne',
      MEDIUM:   'prio-moyenne',
      BASSE:    'prio-basse',
      LOW:      'prio-basse',
      CRITIQUE: 'prio-critique',
      CRITICAL: 'prio-critique'
    };
    return map[(p ?? '').toUpperCase()] ?? 'prio-moyenne';
  }

  getPrioriteLabel(p: string | undefined): string {
    const map: Record<string, string> = {
      HAUTE:    'Haute',
      HIGH:     'Haute',
      MOYENNE:  'Moyenne',
      MEDIUM:   'Moyenne',
      BASSE:    'Basse',
      LOW:      'Basse',
      CRITIQUE: 'Critique',
      CRITICAL: 'Critique'
    };
    return map[(p ?? '').toUpperCase()] ?? (p ?? '—');
  }

  getStatutClass(s: string): string {
    if (s === 'Fait')     return 'statut-fait';
    if (s === 'En_cours') return 'statut-encours';
    return 'statut-afaire';
  }

  getStatutLabel(s: string): string {
    if (s === 'Fait')     return 'Terminée';
    if (s === 'En_cours') return 'En cours';
    return 'À faire';
  }

  // ── Compteurs sidebar ─────────────────────────────
  get tachesFaites(): number {
    return this.taches.filter(t => t.statut === 'Fait').length;
  }

  get tachesEnCours(): number {
    return this.taches.filter(t => t.statut === 'En_cours').length;
  }

  get tachesAFaire(): number {
    return this.taches.filter(
      t => t.statut !== 'Fait' && t.statut !== 'En_cours'
    ).length;
  }

  get ticketsFermes(): number {
    return this.ticketsGroupes.filter(g => g.ferme).length;
  }

  logout(): void {
    this.authService.logout();
  }
}