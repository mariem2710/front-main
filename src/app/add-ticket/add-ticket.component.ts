import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../services/ticket.service';

@Component({
  selector: 'app-add-ticket',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-ticket.component.html',
  styleUrls: ['./add-ticket.component.css']
})
export class AddTicketComponent {

  today: Date = new Date(); // ✅ AJOUT ICI

  ticket: any = {
    titre: '',
    description: '',
    priorite: '',
    dateSouhaite: ''
  };

  minDate: string = new Date().toISOString().split('T')[0];

  constructor(private ticketService: TicketService) {}

  // ✅ VALIDATION FORMULAIRE
  isFormValid(): boolean {
    return (
      this.ticket.titre.trim() !== '' &&
      this.ticket.description.trim() !== '' &&
      this.ticket.priorite !== '' &&
      this.ticket.dateSouhaite !== '' &&
      this.ticket.dateSouhaite >= this.minDate
    );
  }

  // CREATE TICKET
  createTicket(): void {

    if (!this.isFormValid()) {
      alert("Veuillez remplir tous les champs correctement !");
      return;
    }

    const user = JSON.parse(localStorage.getItem('currentUser') ?? '{}');

    const payload = {
      titre: this.ticket.titre,
      description: this.ticket.description,
      statut: 'A_FAIRE',
      priorite: this.ticket.priorite,
      dateSouhaite: this.ticket.dateSouhaite,
      createdById: user?.id,
      createdBy: user?.email
    };

    this.ticketService.createTicket(payload).subscribe({
      next: () => {
        alert("Ticket créé avec succès !");
        this.resetForm();
      },
      error: (err) => {
        console.log(err);
        alert("Erreur création ticket");
      }
    });
  }

  resetForm(): void {
    this.ticket = {
      titre: '',
      description: '',
      priorite: '',
      dateSouhaite: ''
    };
  }
}