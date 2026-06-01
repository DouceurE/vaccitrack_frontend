import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

export interface MessageForum {
  id: string;
  auteur_nom: string;
  auteur_role: string;
  contenu: string;
  date: string;
}

@Component({
  selector: 'app-parent-forum',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './parent-forum.component.html',
  styleUrls: ['./parent-forum.component.scss']
})
export class ParentForumComponent implements OnInit {
  public listeMessages: MessageForum[] = [];
  public nouveauMessage: string = '';
  public isLoading: boolean = true;
  public isSending: boolean = false;
  public errorMessage: string | null = null;

  private readonly API_FORUM_URL = 'http://localhost:8000/api/v1/core/forum/messages/';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.chargerMessagesCommunautaires();
  }

  /**
   * Génère les en-têtes sécurisés avec le token JWT du localStorage
   */
  private obtenirHeadersSecurises(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Charge tous les messages du salon COMMUNAUTAIRE
   */
  public chargerMessagesCommunautaires(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.http.get<MessageForum[]>(`${this.API_FORUM_URL}?type=COMMUNAUTAIRE`, {
      headers: this.obtenirHeadersSecurises()
    }).subscribe({
      next: (messages: MessageForum[]) => {
        this.listeMessages = messages;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.errorMessage = "Impossible de récupérer les discussions de l'espace d'entraide.";
        console.error(error);
      }
    });
  }

  /**
   * Capte le texte en cours de saisie
   */
  public onMessageInput(event: any): void {
    this.nouveauMessage = event.target.value;
  }

  /**
   * Envoie le nouveau message à l'API Django
   */
  public envoyerMessage(event: Event): void {
    event.preventDefault();
    if (!this.nouveauMessage.trim() || this.isSending) return;

    this.isSending = true;
    const payload = {
      contenu: this.nouveauMessage.trim(),
      type_forum: 'COMMUNAUTAIRE'
    };

    this.http.post(this.API_FORUM_URL, payload, {
      headers: this.obtenirHeadersSecurises()
    }).subscribe({
      next: () => {
        this.nouveauMessage = ''; // Vise le champ d'écriture
        this.isSending = false;
        this.chargerMessagesCommunautaires(); // Rafraîchit automatiquement la liste
      },
      error: (error: HttpErrorResponse) => {
        this.isSending = false;
        alert("Échec de la publication du message. Veuillez réessayer.");
      }
    });
  }

  public retournerAuDashboard(): void {
    this.router.navigate(['/parent/dashboard']);
  }
}
