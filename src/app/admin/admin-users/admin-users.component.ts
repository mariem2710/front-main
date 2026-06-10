import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User, Role } from '../../services/user.service';
import { EquipeService, Equipe } from '../../services/equip.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminUsersComponent implements OnInit {
  // Injections
  private userService = inject(UserService);
  private equipeService = inject(EquipeService);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);

  // Données
  users: User[] = [];
  filtered: User[] = [];
  equipes: Equipe[] = [];
  isLoading = false;
  errorMessage = '';

  // Filtres
  searchTerm = '';
  sortCol = 'nom';
  sortAsc = true;

  // Pagination
  pageSize = 10;
  currentPage = 1;

  // Modal
  showModal = false;
  currentStep = 1;
  editUser: User | null = null;
  
  // Formulaire
  form: Partial<User> = { nom: '', prenom: '', email: '', role: Role.METIER };
  selectedEquipeId: number | null = null;
  
  // Mots de passe
  password: string = '';
  confirmPassword: string = '';
  
  // Validation
  fieldErrors: { [key: string]: string } = {};
  touchedFields: { [key: string]: boolean } = {};
  
  // ✅ Variables pour validation des étapes
  step1Valid: boolean = false;
  step2Valid: boolean = false;
  step3Valid: boolean = false;
  
  // Modal acceptation
  showPasswordModal = false;
  userToAccept: User | null = null;
  passwordInput = '';

  Role = Role;
  

  ngOnInit(): void { 
    this.loadUsers();
    this.loadEquipes();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.applyFilter();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Erreur de chargement.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadEquipes(): void {
    this.equipeService.getEquipes().subscribe({
      next: (data) => {
        this.equipes = data;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Erreur chargement équipes', err)
    });
  }

  // Statistiques
  get totalUsers(): number { return this.users.length; }
  get countAdmins(): number { return this.users.filter(u => u.role === Role.ADMIN).length; }
  get countMetier(): number { return this.users.filter(u => u.role === Role.METIER).length; }
  get countBA(): number { return this.users.filter(u => u.role === Role.BUSINESS_ANALYST).length; }
  get countTechnique(): number { return this.users.filter(u => u.role === Role.TECHNIQUE).length; }

  // Filtre et tri
  onSearch(): void {
    this.currentPage = 1;
    this.applyFilter();
    this.cdr.markForCheck();
  }

  applyFilter(): void {
    const q = this.searchTerm.toLowerCase();
    let list = this.users.filter(u =>
      [u.nom, u.prenom, u.email].some(v => v?.toLowerCase().includes(q))
    );
    list = list.sort((a, b) => {
      const va = (a as any)[this.sortCol] ?? '';
      const vb = (b as any)[this.sortCol] ?? '';
      return this.sortAsc
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
    this.filtered = list;
  }

  sort(col: string): void {
    if (this.sortCol === col) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortCol = col;
      this.sortAsc = true;
    }
    this.applyFilter();
    this.cdr.markForCheck();
  }

  get totalPages(): number { return Math.ceil(this.filtered.length / this.pageSize) || 1; }
  get pages(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
  get paginated(): User[] {
    const s = (this.currentPage - 1) * this.pageSize;
    return this.filtered.slice(s, s + this.pageSize);
  }

  goPage(p: number): void {
    if (p >= 1 && p <= this.totalPages) {
      this.currentPage = p;
      this.cdr.markForCheck();
    }
  }

  // ──────────────────────────────────────────────────────────────
  // MODAL - GESTION
  // ──────────────────────────────────────────────────────────────
  openModal(u?: User): void {
    this.editUser = u ?? null;
    this.currentStep = 1;
    this.selectedEquipeId = u?.equipeId ?? null;
    this.form = u
      ? { nom: u.nom, prenom: u.prenom, email: u.email, role: u.role }
      : { nom: '', prenom: '', email: '', role: Role.METIER };
    
    this.password = '';
    this.confirmPassword = '';
    this.fieldErrors = {};
    this.touchedFields = {};
    
    // ✅ Réinitialiser les validations des étapes
    this.step1Valid = false;
    this.step2Valid = false;
    this.step3Valid = false;
    
    this.showModal = true;
    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.showModal = false;
    this.currentStep = 1;
    this.selectedEquipeId = null;
    this.password = '';
    this.confirmPassword = '';
    this.fieldErrors = {};
    this.touchedFields = {};
    this.cdr.markForCheck();
  }

  nextStep(): void {
    if (this.currentStep === 1 && this.validateStep1()) {
      this.currentStep = 2;
      this.step1Valid = true;
      this.cdr.markForCheck();
    } else if (this.currentStep === 2 && this.validateStep2()) {
      this.currentStep = 3;
      this.step2Valid = true;
      this.cdr.markForCheck();
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.cdr.markForCheck();
    }
  }

  // ──────────────────────────────────────────────────────────────
  // VALIDATION DES CHAMPS
  // ──────────────────────────────────────────────────────────────
  validateField(field: string): boolean {
    let isValid = true;
    
    switch (field) {
      case 'nom':
        if (!this.form.nom?.trim()) {
          this.fieldErrors['nom'] = 'Le nom est requis';
          isValid = false;
        } else if (this.form.nom.length < 2) {
          this.fieldErrors['nom'] = 'Le nom doit contenir au moins 2 caractères';
          isValid = false;
        } else {
          delete this.fieldErrors['nom'];
        }
        break;

      case 'prenom':
        if (!this.form.prenom?.trim()) {
          this.fieldErrors['prenom'] = 'Le prénom est requis';
          isValid = false;
        } else if (this.form.prenom.length < 2) {
          this.fieldErrors['prenom'] = 'Le prénom doit contenir au moins 2 caractères';
          isValid = false;
        } else {
          delete this.fieldErrors['prenom'];
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!this.form.email?.trim()) {
          this.fieldErrors['email'] = 'L\'email est requis';
          isValid = false;
        } else if (!emailRegex.test(this.form.email)) {
          this.fieldErrors['email'] = 'Email invalide (ex: nom@domaine.com)';
          isValid = false;
        } else {
          delete this.fieldErrors['email'];
        }
        break;

      case 'role':
        if (!this.form.role) {
          this.fieldErrors['role'] = 'Le rôle est requis';
          isValid = false;
        } else {
          delete this.fieldErrors['role'];
        }
        break;

      case 'equipe':
        if (this.form.role === Role.TECHNIQUE && !this.selectedEquipeId) {
          this.fieldErrors['equipe'] = 'Veuillez sélectionner une équipe';
          isValid = false;
        } else {
          delete this.fieldErrors['equipe'];
        }
        break;

      case 'password':
        if (!this.editUser) {
          if (!this.password) {
            this.fieldErrors['password'] = 'Le mot de passe est requis';
            isValid = false;
          } else if (this.password.length < 6) {
            this.fieldErrors['password'] = 'Le mot de passe doit contenir au moins 6 caractères';
            isValid = false;
          } else {
            delete this.fieldErrors['password'];
          }
        } else if (this.password && this.password.length < 6) {
          this.fieldErrors['password'] = 'Le mot de passe doit contenir au moins 6 caractères';
          isValid = false;
        } else {
          delete this.fieldErrors['password'];
        }
        break;

      case 'confirmPassword':
        if (!this.editUser) {
          if (!this.confirmPassword) {
            this.fieldErrors['confirmPassword'] = 'Veuillez confirmer le mot de passe';
            isValid = false;
          } else if (this.password !== this.confirmPassword) {
            this.fieldErrors['confirmPassword'] = 'Les mots de passe ne correspondent pas';
            isValid = false;
          } else {
            delete this.fieldErrors['confirmPassword'];
          }
        } else if (this.password || this.confirmPassword) {
          if (this.password !== this.confirmPassword) {
            this.fieldErrors['confirmPassword'] = 'Les mots de passe ne correspondent pas';
            isValid = false;
          } else {
            delete this.fieldErrors['confirmPassword'];
          }
        } else {
          delete this.fieldErrors['confirmPassword'];
        }
        break;
    }
    
    return isValid;
  }

  // ✅ Validation avec logs pour déboguer
  validateStep1(): boolean {
    const nomValid = this.validateField('nom');
    const prenomValid = this.validateField('prenom');
    const emailValid = this.validateField('email');
    
    const isValid = nomValid && prenomValid && emailValid;
    
    console.log('Step1 validation:', { nomValid, prenomValid, emailValid, isValid });
    
    return isValid;
  }

  validateStep2(): boolean {
    const roleValid = this.validateField('role');
    let equipeValid = true;
    
    if (this.form.role === Role.TECHNIQUE) {
      equipeValid = this.validateField('equipe');
    }
    
    const isValid = roleValid && equipeValid;
    
    console.log('Step2 validation:', { roleValid, equipeValid, isValid, role: this.form.role, equipeId: this.selectedEquipeId });
    
    return isValid;
  }

  validateStep3(): boolean {
    const passwordValid = this.validateField('password');
    const confirmValid = this.validateField('confirmPassword');
    
    const isValid = passwordValid && confirmValid;
    
    console.log('Step3 validation:', { passwordValid, confirmValid, isValid });
    
    return isValid;
  }

  // ✅ Événements de formulaire avec revalidation
  onBlur(field: string): void {
    this.touchedFields[field] = true;
    this.validateField(field);
    
    // Revalider l'étape en cours
    if (this.currentStep === 1) {
      this.validateStep1();
    } else if (this.currentStep === 2) {
      this.validateStep2();
    } else if (this.currentStep === 3) {
      this.validateStep3();
    }
    
    this.cdr.markForCheck();
  }

  onInput(field: string): void {
    this.validateField(field);
    
    // Revalider l'étape en cours
    if (this.currentStep === 1) {
      this.validateStep1();
    } else if (this.currentStep === 2) {
      this.validateStep2();
    } else if (this.currentStep === 3) {
      this.validateStep3();
    }
    
    this.cdr.markForCheck();
  }

  onRoleChange(): void {
    if (this.form.role !== Role.TECHNIQUE) {
      this.selectedEquipeId = null;
      delete this.fieldErrors['equipe'];
    }
    
    this.validateField('role');
    
    if (this.form.role === Role.TECHNIQUE && this.touchedFields['equipe']) {
      this.validateField('equipe');
    }
    
    // Revalider l'étape 2
    this.validateStep2();
    
    this.cdr.markForCheck();
  }

  onEquipeChange(): void {
    this.validateField('equipe');
    this.validateStep2();
    this.cdr.markForCheck();
  }

  onPasswordChange(): void {
    this.validateField('password');
    if (this.confirmPassword) {
      this.validateField('confirmPassword');
    }
    this.validateStep3();
    this.cdr.markForCheck();
  }

  onConfirmPasswordChange(): void {
    this.validateField('confirmPassword');
    this.validateStep3();
    this.cdr.markForCheck();
  }

  // ✅ Vérifications pour activer/désactiver les boutons
  canProceedToStep2(): boolean {
    return this.validateStep1();
  }

  canProceedToStep3(): boolean {
    return this.validateStep2();
  }

  canSave(): boolean {
    return this.validateStep3();
  }

  // ──────────────────────────────────────────────────────────────
  // SAUVEGARDE
  // ──────────────────────────────────────────────────────────────
  saveUser(): void {
    if (!this.canSave()) {
      console.log('Cannot save: validation failed');
      return;
    }
    
    const userData = { ...this.form };
    
    if (this.password) {
      userData.password = this.password;
    }
    
    if (this.form.role === Role.TECHNIQUE && this.selectedEquipeId) {
      userData.equipeId = this.selectedEquipeId;
    }
    
    const request = this.editUser
      ? this.userService.updateUser(this.editUser.id!, userData as User)
      : this.userService.createUser(userData as User);
    
    request.subscribe({
      next: () => {
        this.closeModal();
        this.loadUsers();
      },
      error: (err) => {
        console.error(err);
        alert('Erreur lors de l\'opération.');
      }
    });
  }

  // ──────────────────────────────────────────────────────────────
  // GESTION DES COMPTES
  // ──────────────────────────────────────────────────────────────
  deleteUser(u: User): void {
    if (!confirm(`Supprimer ${u.nom} ${u.prenom} ?`)) return;
    this.userService.deleteUser(u.id!).subscribe({
      next: () => this.loadUsers(),
      error: () => alert('Erreur lors de la suppression.')
    });
  }

  accepter(u: User): void {
    this.userToAccept = u;
    this.passwordInput = '';
    this.showPasswordModal = true;
    this.cdr.markForCheck();
  }

  confirmerAcceptation(): void {
    if (!this.passwordInput || !this.userToAccept?.id) return;
    this.userService.accepterCompte(this.userToAccept.id, this.passwordInput).subscribe({
      next: () => {
        this.showPasswordModal = false;
        this.userToAccept = null;
        this.passwordInput = '';
        this.loadUsers();
      },
      error: () => alert('Erreur lors de l\'acceptation.')
    });
  }

  refuser(u: User): void {
    if (!confirm(`Refuser le compte de ${u.nom} ${u.prenom} ?`)) return;
    this.userService.refuserCompte(u.id!).subscribe({
      next: () => this.loadUsers(),
      error: () => alert('Erreur lors du refus.')
    });
  }

  // ──────────────────────────────────────────────────────────────
  // UTILITAIRES
  // ──────────────────────────────────────────────────────────────
  initials(u: User): string {
    return ((u.nom?.[0] ?? '') + (u.prenom?.[0] ?? '')).toUpperCase() || '?';
  }

  private readonly PALETTES = [
    { bg: 'rgba(74,144,217,.18)', color: '#6eaaec' },
    { bg: 'rgba(61,176,122,.18)', color: '#3db07a' },
    { bg: 'rgba(212,160,23,.18)', color: '#d4a017' },
    { bg: 'rgba(180,100,220,.18)', color: '#b464dc' },
    { bg: 'rgba(224,85,85,.18)', color: '#e05555' },
  ];

  avatarBg(u: User): string {
    const i = (u.nom?.charCodeAt(0) ?? 0) % this.PALETTES.length;
    return this.PALETTES[i].bg;
  }

  avatarColor(u: User): string {
    const i = (u.nom?.charCodeAt(0) ?? 0) % this.PALETTES.length;
    return this.PALETTES[i].color;
  }

  getRoleClass(role: Role): string {
    if (role === Role.ADMIN) return 'badge badge-admin';
    if (role === Role.BUSINESS_ANALYST) return 'badge badge-agent';
    if (role === Role.TECHNIQUE) return 'badge badge-technique';
    return 'badge badge-user';
  }

  getRoleLabel(role: Role): string {
    if (role === Role.ADMIN) return 'Admin';
    if (role === Role.BUSINESS_ANALYST) return 'Business Analyst';
    if (role === Role.TECHNIQUE) return 'Technique';
    return 'Métier';
  }

  getStatutClass(statut?: string): string {
    if (statut === 'ACCEPTE') return 'badge badge-active';
    if (statut === 'REFUSE') return 'badge badge-inactive';
    return 'badge badge-todo';
  }

  getStatutLabel(statut?: string): string {
    if (statut === 'ACCEPTE') return 'Accepté';
    if (statut === 'REFUSE') return 'Refusé';
    return 'En attente';
  }
}