import { Component, ViewEncapsulation } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-demandecompte',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, RouterModule],
  templateUrl: './demandecompte.component.html',
  styleUrls: ['./demandecompte.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class DemandecompteComponent {

  nom = '';
  prenom = '';
  email = '';

  role = 'METIER';

  roles: string[] = [
    'METIER',
    'BUSINESS_ANALYST',
    'TECHNICIEN'
  ];

  successMessage = '';
  errorMessage = '';
  isDark = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  goToLogin() {
    this.router.navigate(['/login']);
  }

  toggleTheme() {
    this.isDark = !this.isDark;
  }

  register() {

    if (!this.nom || !this.prenom || !this.email) {
      this.errorMessage = 'Veuillez remplir tous les champs.';
      return;
    }

    const demande = {
      nom: this.nom,
      prenom: this.prenom,
      email: this.email,
      role: this.role
    };

    this.authService.demanderCompte(demande).subscribe({

      next: () => {

        this.successMessage =
          '✅ Votre demande a été envoyée.';

        this.errorMessage = '';

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },

      error: (err: any) => {

        this.errorMessage =
          err?.error?.message ||
          '❌ Erreur lors de l’envoi.';

        this.successMessage = '';
      }
    });
  }
}