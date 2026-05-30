import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AddTicketComponent } from '../../add-ticket/add-ticket.component';
import { ListeticketComponent } from '../listeticket/listeticket.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-metier-dashboard',
  standalone: true,
  imports: [CommonModule, AddTicketComponent, ListeticketComponent],
  templateUrl: './metier-dashboard.component.html',
  styleUrls: ['./metier-dashboard.component.css']
})
export class MetierDashboardComponent implements OnInit {
  view        = 'list';
  isDark      = false;
  currentUser: any;

  constructor(
    private authService: AuthService,
    private router:      Router
  ) {}

  ngOnInit(): void {
    this.currentUser = JSON.parse(
      localStorage.getItem('currentUser') || '{}'
    );
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') this.isDark = true;
  }

  toggleTheme(): void {
    this.isDark = !this.isDark;
    localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
  }

  logout(): void {
    this.authService.logout();
  }

  getInitials(): string {
    const p = this.currentUser?.prenom ?? '';
    const n = this.currentUser?.nom     ?? '';
    return ((p[0] ?? '') + (n[0] ?? '')).toUpperCase() || 'U';
  }

  getTitle(): string {
    return this.view === 'create' ? 'Nouveau ticket' : 'Mes tickets';
  }
}