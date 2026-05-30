import { Routes } from '@angular/router';

import { LoginComponent } from './auth/login/login.component';
import { DemandecompteComponent } from './app/demandecompte/demandecompte.component';

import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

import { ProfileComponent } from './shared/profile/profile.component';

import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { AdminUsersComponent } from './admin/admin-users/admin-users.component';

import { MetierDashboardComponent } from './metier/metier-dashboard/metier-dashboard.component';
import { AddTicketComponent } from './add-ticket/add-ticket.component';

import { AnalyseDashboardComponent } from './analyse/analyse-dashboard/analyse-dashboard.component';
import { AnalyseTicketComponent } from './analyse/analyse-ticket/analyse-ticket.component';

import { TechniqueDashboardComponent } from './technique/technique-dashboard/technique-dashboard.component';

export const routes: Routes = [

  // ================= PUBLIC =================
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },
  { path: 'register', component: DemandecompteComponent },

  // ================= PROTECTED =================
  {
    path: '',
    canActivate: [authGuard],

    children: [

      // PROFILE (tous connectés)
      {
        path: 'profile',
        component: ProfileComponent
      },

      // ================= ADMIN =================
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        children: [
          { path: 'dashboard', component: DashboardComponent },
          { path: 'users', component: AdminUsersComponent }
        ]
      },

      // ================= METIER =================
      {
        path: 'metier',
        canActivate: [roleGuard],
        data: { roles: ['METIER'] },
        children: [
          { path: 'dashboard', component: MetierDashboardComponent },
          { path: 'add-ticket', component: AddTicketComponent }
        ]
      },

      // ================= ANALYSE =================
      {
        path: 'analyse',
        canActivate: [roleGuard],
        data: { roles: ['BUSINESS_ANALYST'] },
        children: [
          { path: 'dashboard', component: AnalyseDashboardComponent },
          { path: 'ticket/:id', component: AnalyseTicketComponent }
        ]
      },

      // ================= TECHNIQUE =================
      {
        path: 'technique',
        canActivate: [roleGuard],
        data: { roles: ['TECHNIQUE', 'TECHNICIEN'] },
        children: [
          { path: 'dashboard', component: TechniqueDashboardComponent }
        ]
      }
    ]
  },

  // ================= FALLBACK =================
  { path: '**', redirectTo: 'login' }
];
