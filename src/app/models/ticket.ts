import { SousTicket } from './sous-ticket';

export interface Ticket {

  id?: number;

  titre?: string;

  description?: string;

  statut?: string;

  priorite?: string;

  dateCreation?: string;

  dateSouhaite?: string;

  dateMiseAJour?: string;

  progression?: number;

  createdBy?: string;

  // ✅ AJOUTS IMPORTANTS
  createdById?: number;

  nombreCommentaires?: number;

  nombreSousTickets?: number;

  analyseIAEffectuee?: boolean;

  aiSummary?: string;

  sousTickets?: SousTicket[];
}