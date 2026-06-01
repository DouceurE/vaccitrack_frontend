import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

export interface MessageForum {
  id: string;
  auteur_nom: string;
  auteur_role: string;
  contenu: string;
  date: string;
}

@Component({
  selector: 'app-medecin-forum',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="forum-global-container">
      <header class="forum-header">
        <div class="header-content">
          <button type="button" class="btn-back" (click)="retournerAuDashboard()">⬅️ Portails Pro</button>
          <h1>⚕️ Centre d'Échanges Cliniques & Entraide</h1>
          <p>Sélectionnez le salon de discussion pour interagir avec les usagers ou vos confrères sous-régionaux.</p>
        </div>
        <div class="forum-tabs-nav">
          <button type="button" class="tab-btn" [class.tab-active]="salonActuel === 'COMMUNAUTAIRE'" (click)="changerDeSalon('COMMUNAUTAIRE')">
            👥 Espace Parents & Médecins
          </button>
          <button type="button" class="tab-btn" [class.tab-active]="salonActuel === 'MEDICAL_PRIVE'" (click)="changerDeSalon('MEDICAL_PRIVE')">
            🔒 Salon Confidentiel Praticiens (Privé)
          </button>
        </div>
      </header>

      <main class="forum-messages-zone">
        <div *ngIf="isLoading" class="forum-state-info">Chargement du flux de discussion sécurisé PostgreSQL...</div>
        <div *ngIf="errorMessage" class="forum-alert alert-danger">⚠️ {{ errorMessage }}</div>
        <div *ngIf="!isLoading && listeMessages.length === 0" class="forum-state-info">Aucune publication dans ce salon pour le moment.</div>

        <div *ngIf="!isLoading && listeMessages.length > 0" class="messages-list">
          <div *ngFor="let msg of listeMessages" class="message-card" [class.is-doctor]="msg.auteur_role === 'MEDECIN'">
            <div class="message-meta">
              <span class="author-name">{{ msg.auteur_role === 'MEDECIN' ? '🩺 ' : '👤 ' }} {{ msg.auteur_nom }}</span>
              <span class="author-badge" [class.badge-doc]="msg.auteur_role === 'MEDECIN'">{{ msg.auteur_role === 'MEDECIN' ? 'Médecin' : 'Parent' }}</span>
              <span class="message-date">{{ msg.date }}</span>
            </div>
            <div class="message-body"><p>{{ msg.contenu }}</p></div>
          </div>
        </div>
      </main>

      <footer class="forum-input-footer">
        <form (submit)="envoyerMessage($event)" class="message-form">
          <input type="text" 
                 name="nouveauMessage"
                 [(ngModel)]="nouveauMessage"
                 [placeholder]="salonActuel === 'MEDICAL_PRIVE' ? 'Échangez de manière sécurisée avec vos confrères...' : 'Répondez à la question de ce parent...'" 
                 maxlength="1000" 
                 class="form-input-text"
                 [disabled]="isSending">
          <button type="submit" class="btn-send-message" [disabled]="!nouveauMessage.trim() || isSending">
            {{ isSending ? 'Envoi...' : 'Publier 🚀' }}
          </button>
        </form>
      </footer>
    </div>
  `,
  styles: [`
    $color-brand: #0084df; $color-brand-hover: #0073c4; $color-bg-panel: #f8fafc; $color-text-dark: #1e293b; $color-text-light: #f1f5f9; $color-text-muted: #64748b; $color-border: #cbd5e1; $color-danger: #ef4444;
    .forum-global-container { display: flex; flex-direction: column; height: 100vh; background-color: $color-bg-panel; font-family: system-ui, sans-serif; }
    .forum-header { background-color: #ffffff; padding: 1.25rem 2rem 0 2rem; border-bottom: 1px solid $color-border; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02); }
    .header-content { max-width: 900px; margin: 0 auto 1rem auto; h1 { font-size: 1.35rem; color: $color-text-dark; margin: 0.5rem 0 0.25rem 0; font-weight: 700; } p { font-size: 0.85rem; color: $color-text-muted; margin: 0; } }
    .btn-back { background: transparent; border: 1px solid $color-border; color: $color-text-dark; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: 600; &:hover { background: $color-text-light; } }
    .forum-tabs-nav { max-width: 900px; margin: 0 auto; display: flex; gap: 1rem; }
    .tab-btn { background: transparent; border: none; border-bottom: 3px solid transparent; padding: 0.75rem 1rem; font-size: 0.9rem; font-weight: 600; color: $color-text-muted; cursor: pointer; transition: all 0.2s; &:hover { color: $color-brand; } &.tab-active { color: $color-brand; border-bottom-color: $color-brand; } }
    .forum-messages-zone { flex: 1; padding: 2rem; overflow-y: auto; .messages-list { max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.25rem; } }
    .message-card { background-color: #ffffff; padding: 1.25rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border-left: 4px solid $color-text-muted; max-width: 80%; align-self: flex-start; &.is-doctor { border-left-color: $color-brand; background-color: rgba(0, 132, 223, 0.04); align-self: flex-end; } .message-meta { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; font-size: 0.8rem; .author-name { font-weight: 700; color: $color-text-dark; } .author-badge { background-color: $color-text-light; color: $color-text-dark; padding: 2px 6px; border-radius: 4px; font-weight: 600; &.badge-doc { background-color: rgba(0, 132, 223, 0.12); color: $color-brand-hover; } } .message-date { color: $color-text-muted; } } .message-body p { margin: 0; font-size: 0.95rem; line-height: 1.5; color: $color-text-dark; } }
    .forum-input-footer { background-color: #ffffff; padding: 1.25rem 2rem; border-top: 1px solid $color-border; .message-form { max-width: 900px; margin: 0 auto; display: flex; gap: 1rem; } .form-input-text { flex: 1; height: 46px; padding: 0 1.25rem; border: 1px solid $color-border; border-radius: 8px; font-size: 0.95rem; color: $color-text-dark; background-color: $color-bg-panel; &:focus { outline: none; border-color: $color-brand; background: #fff; box-shadow: 0 0 0 3px rgba(0, 132, 223, 0.1); } } .btn-send-message { height: 46px; padding: 0 1.5rem; background-color: $color-brand; color: #ffffff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s; &:hover:not(:disabled) { background-color: $color-brand-hover; } &:disabled { background-color: $color-text-muted; cursor: not-allowed; opacity: 0.6; } } }
    .forum-state-info { text-align: center; color: $color-text-muted; font-weight: 500; padding-top: 3rem; }
    .forum-alert.alert-danger { padding: 0.85rem 1rem; border-radius: 6px; font-size: 0.9rem; color: $color-danger; background-color: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); max-width: 900px; margin: 0 auto 1.5rem auto; }
  `]
})
export class MedecinForumComponent implements OnInit {
  public listeMessages: MessageForum[] = [];
  public nouveauMessage: string = '';
  public salonActuel: 'COMMUNAUTAIRE' | 'MEDICAL_PRIVE' = 'COMMUNAUTAIRE';
  public isLoading: boolean = true;
  public isSending: boolean = false;
  public errorMessage: string | null = null;

  private readonly API_FORUM_URL = 'http://localhost:8000/api/v1/core/forum/messages/';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.chargerMessagesDuSalon();
  }

  private obtenirHeadersSecurises(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  public chargerMessagesDuSalon(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.http.get<MessageForum[]>(`${this.API_FORUM_URL}?type=${this.salonActuel}`, {
      headers: this.obtenirHeadersSecurises()
    }).subscribe({
      next: (messages: MessageForum[]) => {
        this.listeMessages = messages;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        if (error.status === 403) {
          this.errorMessage = "Accès refusé. Ce salon est strictement réservé aux médecins.";
        } else {
          this.errorMessage = "Impossible de récupérer le flux de discussion.";
        }
      }
    });
  }

  public changerDeSalon(nouveauSalon: 'COMMUNAUTAIRE' | 'MEDICAL_PRIVE'): void {
    if (this.salonActuel === nouveauSalon) return;
    this.salonActuel = nouveauSalon;
    this.listeMessages = [];
    this.chargerMessagesDuSalon();
  }

  public envoyerMessage(event: Event): void {
    event.preventDefault();
    if (!this.nouveauMessage.trim() || this.isSending) return;

    this.isSending = true;
    const payload = {
      contenu: this.nouveauMessage.trim(),
      type_forum: this.salonActuel
    };

    this.http.post(this.API_FORUM_URL, payload, {
      headers: this.obtenirHeadersSecurises()
    }).subscribe({
      next: () => {
        this.nouveauMessage = '';
        this.isSending = false;
        this.chargerMessagesDuSalon();
      },
      error: (error: HttpErrorResponse) => {
        this.isSending = false;
        alert("Erreur lors de la publication de votre message.");
      }
    });
  }

  public retournerAuDashboard(): void {
    this.router.navigate(['/medecin/dashboard']);
  }
}
