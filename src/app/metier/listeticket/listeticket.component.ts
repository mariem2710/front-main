import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { TicketService } from '../../services/ticket.service';
import { CommentaireService } from '../../services/commentaire.service';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-listeticket',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './listeticket.component.html',
  styleUrls: ['./listeticket.component.css']
})
export class ListeticketComponent implements OnInit, OnDestroy {

  tickets: any[] = [];
  filteredTickets: any[] = [];

  selectedStatut = 'ALL';
  selectedPriorite = 'ALL';
  searchText = '';

  isDark = false;

  successMsg = '';
  errorMsg = '';

  //-------------------------------------------------
  commentModalOpen = false;
  selectedTicketId: number | null = null;

  comments: any[] = [];
  newComment = '';
  loadingComments = false;

  editModalOpen = false;
  editingComment: any = null;
  //-------------------------------------------------

  private sub?: Subscription;

  constructor(private ticketService: TicketService,
    private commentaireService: CommentaireService,
    private authService: AuthService,
    public themeService: ThemeService
  ) {
       this.isDark$ = this.themeService.isDark$;

  }

  isDark$!: Observable<boolean>;


  ngOnInit(): void {
    this.loadTickets();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // ================= LOAD =================
  loadTickets(): void {
    this.sub = this.ticketService.getAllTickets().subscribe({
      next: (data) => {
        this.tickets = data || [];
        this.filterTickets();
      },
      error: () => this.showError('Erreur chargement')
    });
  }

  // ================= FILTER =================
  filterTickets(): void {

    const norm = (v: any) =>
      (v ?? '').toString().toUpperCase().trim();

    this.filteredTickets = this.tickets.filter(t => {

      const matchStatut =
        this.selectedStatut === 'ALL' ||
        norm(t.statut) === norm(this.selectedStatut);

      const matchPrio =
        this.selectedPriorite === 'ALL' ||
        norm(t.priorite) === norm(this.selectedPriorite) ||
        (this.selectedPriorite === 'HIGH' && norm(t.priorite) === 'HAUTE') ||
        (this.selectedPriorite === 'MEDIUM' && norm(t.priorite) === 'MOYENNE') ||
        (this.selectedPriorite === 'LOW' && norm(t.priorite) === 'BASSE');

      const matchSearch =
        !this.searchText ||
        (t.titre ?? '').toLowerCase().includes(this.searchText.toLowerCase());

      return matchStatut && matchPrio && matchSearch;
    });
  }

  // ================= FIX ✔️ STATS (MANQUAIT) =================
get countTodo(): number {
  return this.tickets.filter(t => t.statut === 'A_FAIRE').length;
}

get countInProgress(): number {
  return this.tickets.filter(t => t.statut === 'EN_COURS').length;
}

get countDone(): number {
  return this.tickets.filter(t => t.statut === 'TERMINE').length;
}
  // ================= ACTIONS =================

  loadComments(ticketId: number) {
    this.loadingComments = true;

    this.commentaireService.getByTicket(ticketId).subscribe({
      next: (data) => {
        this.comments = data || [];
        this.loadingComments = false;
      },
      error: () => {
        this.comments = [];
        this.loadingComments = false;
      }
    });
  }
  // OPEN POPUP
  openCommentBox(id: number) {
    this.selectedTicketId = id;
    this.commentModalOpen = true;
    document.body.style.overflow = 'hidden';

    this.loadComments(id);
  }

  // CLOSE POPUP
  closeCommentBox() {
    this.commentModalOpen = false;
    this.selectedTicketId = null;
    this.comments = [];
    this.newComment = '';
    document.body.style.overflow = 'auto';
  }



  addComment() {
    if (!this.selectedTicketId || !this.newComment.trim()) return;

    const user = this.authService.getCurrentUser();

    const body = {
      commentaire: this.newComment,
      userId: user?.id
    };
    
    this.commentaireService.addComment(this.selectedTicketId, body).subscribe({
      next: () => {
        this.newComment = '';
        this.loadComments(this.selectedTicketId!);
      },
      error: (err) => console.error('error add comment', err)
    });
  }
  //-------------------------------------------------------------
  openEditComment(comment: any) {
    this.editingComment = comment;
    
    // close comments modal
    this.commentModalOpen = false;
    
    // open edit modal
    this.editModalOpen = true;
    
    document.body.style.overflow = 'hidden';
  }
  
  closeEditModal() {
    this.editModalOpen = false;
    this.editingComment = null;
    this.commentModalOpen = true;
    
    document.body.style.overflow = 'auto';
  }
  deleteComment(id: number) {
    console.log('delete comment', id);
  }   

  isOwner(comment: any): boolean {
    const user = this.authService.getCurrentUser();
    return comment?.userId === user?.id;
  }

    openEditModal(t: any) {
      console.log('edit', t);
    }
  //-------------------------------------------------------------
  
  deleteTicket(id: number) {
    if (!confirm('Supprimer ?')) return;
    
    this.ticketService.deleteTicket(id).subscribe({
      next: () => this.loadTickets(),
      error: () => this.showError('Erreur suppression')
    });
  }
  //-------------------------------------------------------------

  // ================= LABELS =================
  getStatutLabel(s: string) {
    const map: any = {
      A_FAIRE: 'A faire',
      EN_COURS: 'En cours',
      TERMINE: 'Terminé',
      APPROUVE: 'Approuvé'
    };
    return map[s] || s;
  }

  getStatutClass(s: string) {
    const map: any = {
      A_FAIRE: 'badge-todo',
      EN_COURS: 'badge-progress',
      TERMINE: 'badge-done',
      APPROUVE: 'badge-done'
    };
    return map[s] || 'badge';
  }

  getPrioriteLabel(p: string) {
    const map: any = {
      HIGH: 'Haute',
      HAUTE: 'Haute',
      MEDIUM: 'Moyenne',
      MOYENNE: 'Moyenne',
      LOW: 'Basse',
      BASSE: 'Basse'
    };
    return map[p] || p;
  }

  getPrioriteClass(p: string) {
    const v = (p ?? '').toUpperCase();
    if (v === 'HIGH' || v === 'HAUTE') return 'prio-haute';
    if (v === 'MEDIUM' || v === 'MOYENNE') return 'prio-moyenne';
    if (v === 'LOW' || v === 'BASSE') return 'prio-basse';
    return '';
  }

  formatTicketId(id: number) {
    return '#TKT-' + String(id).padStart(4, '0');
  }

  // ================= ERROR =================
  showError(msg: string) {
    this.errorMsg = msg;
    setTimeout(() => this.errorMsg = '', 3000);
  }
  
  toggleTheme() {
    this.themeService.toggle();
  }
}