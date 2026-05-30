import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, LoginResponse } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  email:        string  = '';
  password:     string  = '';
  errorMessage: string  = '';
  isLoading:    boolean = false;
  isDark:       boolean = false;
  showPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private router:      Router
  ) {}

  toggleTheme(): void {
    this.isDark = !this.isDark;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  login(): void {
    // ── Validation côté client ──
    if (!this.email.trim() || !this.password.trim()) {
      this.errorMessage = 'Veuillez remplir tous les champs.';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email.trim())) {
      this.errorMessage = 'Format d\'email invalide.';
      return;
    }

    this.errorMessage = '';
    this.isLoading    = true;

    this.authService.login({
      email:    this.email.trim(),
      password: this.password
    }).subscribe({
      next: (response: LoginResponse) => {
        this.isLoading = false;
        console.log('✅ Connecté :', response.email, '| Rôle :', response.role);
        this.redirectByRole(response.role);
      },
      error: (err: any) => {
        this.isLoading = false;

        // ── Log complet pour debug ──
        console.error('❌ Erreur login — status:', err.status);
        console.error('❌ Body complet:', err.error);

        if (err.status === 0) {
          this.errorMessage =
            'Serveur inaccessible. Vérifiez que Spring Boot tourne sur le port 8060.';

        } else if (err.status === 400) {
          // ✅ Le backend retourne toujours { message: "..." } en cas de 400
          // Causes possibles :
          //   - "Email introuvable."
          //   - "Mot de passe incorrect."
          //   - "Compte non encore activé ou refusé."
          const backendMessage = err.error?.message;

          if (backendMessage?.toLowerCase().includes('activé') ||
              backendMessage?.toLowerCase().includes('refusé')) {
            this.errorMessage =
              'Votre compte n\'est pas encore activé ou a été refusé. ' +
              'Contactez votre administrateur.';

          } else if (backendMessage?.toLowerCase().includes('introuvable') ||
                     backendMessage?.toLowerCase().includes('incorrect')) {
            this.errorMessage = 'Email ou mot de passe incorrect.';

          } else {
            // Affiche le message exact du backend comme fallback
            this.errorMessage = backendMessage || 'Identifiants invalides.';
          }

        } else if (err.status === 401 || err.status === 403) {
          this.errorMessage = 'Accès refusé. Vérifiez vos identifiants.';

        } else if (err.status === 404) {
          this.errorMessage =
            'Endpoint introuvable — vérifiez la configuration du backend.';

        } else {
          this.errorMessage =
            err.error?.message || `Erreur serveur (${err.status}).`;
        }
      }
    });
  }

  // ── Soumission via touche Entrée ──
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !this.isLoading) {
      this.login();
    }
  }

  private redirectByRole(role: string): void {
    const routeMap: Record<string, string> = {
      ADMIN:            '/admin-dashboard',
      BUSINESS_ANALYST: '/analyse-dashboard',
      TECHNICIEN:       '/technique-dashboard',
      TECHNIQUE:        '/technique-dashboard',
      METIER:           '/metier-dashboard'
    };
    const target = routeMap[role] ?? '/login';
    console.log('→ Redirection vers:', target);
    this.router.navigate([target]);
  }
}