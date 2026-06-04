import { Routes } from '@angular/router';

import { LoginComponent }
  from './auth/login/login.component';
import { DemandecompteComponent }
  from './app/demandecompte/demandecompte.component';
import { authGuard }
  from './guards/auth.guard';
import { roleGuard }
  from './guards/role.guard';
import { ProfileComponent }
  from './shared/profile/profile.component';
import { DashboardComponent }
  from './admin/dashboard/dashboard.component';
import { AdminUsersComponent }
  from './admin/admin-users/admin-users.component';
import { MetierDashboardComponent }
  from './metier/listeticket/metier-dashboard/metier-dashboard.component';
import { AddTicketComponent }
  from './add-ticket/add-ticket.component';
import { AnalyseDashboardComponent }
  from './analyse/analyse-dashboard/analyse-dashboard.component';
import { AnalyseTicketComponent }
  from './analyse/analyse-ticket/analyse-ticket.component';
import { TechniqueDashboardComponent }
  from './technique/technique-dashboard/technique-dashboard.component';

export const routes: Routes = [

  // ── PUBLIC ────────────────────────────────────────
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: DemandecompteComponent
  },

  // ── ADMIN ─────────────────────────────────────────
  {
    path: 'admin-dashboard',        // ✅ aligné avec login
    component: DashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'admin-users',
    component: AdminUsersComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] }
  },

  // ── METIER ────────────────────────────────────────
  {
    path: 'metier-dashboard',       // ✅ aligné avec login
    component: MetierDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['METIER'] }
  },
  {
    path: 'add-ticket',
    component: AddTicketComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['METIER'] }
  },

  // ── BUSINESS ANALYST ──────────────────────────────
  {
    path: 'analyse-dashboard',      // ✅ aligné avec login
    component: AnalyseDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['BUSINESS_ANALYST'] }
  },
  {
    path: 'analyse-tickets/:id',
    component: AnalyseTicketComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['BUSINESS_ANALYST'] }
  },

  // ── TECHNIQUE ─────────────────────────────────────
  {
    path: 'technique-dashboard',    // ✅ aligné avec login
    component: TechniqueDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['TECHNIQUE', 'TECHNICIEN'] }
  },

  // ── PROFIL ────────────────────────────────────────
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard]
  },

  // ── FALLBACK ──────────────────────────────────────
  {
    path: '**',
    redirectTo: 'login'
  }
];
