import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-medecin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="medecin-global-container">
      
      <!-- BARRE LATÉRALE CLINIQUES -->
      <aside class="medecin-sidebar">
        <div class="sidebar-brand-area">
          <h2>🛡️ VacciTrack Espace Pro</h2>
        </div>
        <div class="sidebar-medical-meta">
          <div class="doctor-badge-info">
            <span class="doc-icon">🩺</span>
            <div class="doc-text">
              <strong>Portail Praticien</strong>
              <small>Agent de Santé Habilité</small>
            </div>
          </div>
          <div class="stats-card-widget">
            <span class="stats-label">Injections validées (Ce mois)</span>
            <span class="stats-value">{{ injectionsDuMois }}</span>
          </div>
          <button type="button" class="btn-forum-nav" (click)="naviguerVersForum()">
            💬 Accéder aux Forums
          </button>
        </div>
        <div class="sidebar-footer-area">
          <button type="button" class="btn-logout" (click)="deconnecterSession()">
            🚪 Quitter la Session
          </button>
        </div>
      </aside>

      <!-- PANNEAU CENTRAL WORKSPACE -->
      <main class="medecin-main-content">
        <div class="search-section-header">
          <h1>Scanner ou Rechercher un Passeport Vaccinal</h1>
          <p>Saisissez le jeton d'identification sous-régional pour charger le carnet numérique crypté dans PostgreSQL.</p>
        </div>

        <!-- MODULE DE SAISIE DU JETON UNIQUE -->
        <div class="search-action-bar">
          <div class="input-search-wrapper">
            <span class="search-prefix-icon">🔍</span>
            <input type="text" 
                   [value]="tokenSaisi" 
                   (input)="onTokenInput($event)" 
                   (keyup.enter)="rechercherDossierEnfant()" 
                   placeholder="EX : VACCITRACK-8B9EBAD4..." 
                   class="form-control-search">
          </div>
          <button type="button" class="btn-action-search" [disabled]="!tokenSaisi || isLoading" (click)="rechercherDossierEnfant()">
            @if (isLoading) { Recherche... } @else { Charger le Dossier }
          </button>
        </div>

        <!-- BANNÈRES DE STATUT ET NOTIFICATIONS -->
        @if (errorMessage) { 
          <div class="alert-banner alert-danger">⚠️ {{ errorMessage }}</div> 
        }
        @if (successMessage) { 
          <div class="alert-banner alert-success">🎉 {{ successMessage }}</div> 
        }

        <!-- COMPOSANT DOSSIER PATIENT (S'AFFICHE SI ENFANT TROUVÉ) -->
        @if (!isLoading && enfantTrouve) {
          <div class="patient-file-layout">
            
            <!-- CARTE D'IDENTITÉ DU PATIENT (BALISE RE-FERMÉE PROPREMENT ICI) -->
            
              <div class="patient-avatar-box">👶</div>
              <div class="patient-meta-details">
                <h2>Patient : {{ enfantTrouve.nom_complet }}</h2>
                <div class="patient-badges-row">
                  <span class="badge-tag">Naissance : {{ enfantTrouve.date_naissance }}</span>
                  <span class="badge-tag">Réglementation : {{ enfantTrouve.pays_residence_nom }}</span>
                  <span class="badge-tag token-tag">Jeton : {{ enfantTrouve.qr_code_token }}</span>
                </div>
              </div>
            </div>

            <!-- TABLEAU DES VACCINS PEV -->
            <div class="medical-timeline-card">
              <h3>Statut du Programme Élargi de Vaccination (PEV)</h3>
              <div class="clinical-table-wrapper">
                <table class="clinical-table">
                  <thead>
                    <tr>
                      <th>Vaccin</th>
                      <th>Maladie Ciblée</th>
                      <th>Échéance Planifiée</th>
                      <th>Date d'administration</th>
                      <th style="text-align: right;">Action Clinique</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (ligne of carnetVaccinal; track ligne.id) {
                      <tr>
                        <td><strong>{{ ligne.vaccin_code }}</strong></td>
                        <td class="text-dimmed">{{ ligne.nom_maladie_cible }}</td>
                        <td>{{ ligne.date_prevue }}</td>
                        <td>
                          @if (ligne.statut === 'ADMINISTRE') {
                            <span class="date-check">✔️ {{ ligne.date_administration_reelle || "Aujourd'hui" }}</span>
                          } @else {
                            <span>-</span>
                          }
                        </td>
                        <td style="text-align: right;">
                          @if (ligne.statut === 'ADMINISTRE') {
                            <span class="badge-status status-done">Injecté</span>
                          } @else {
                            <button type="button" class="btn-clinical-validate" (click)="validerInjection(ligne['id'])">💉 Certifier</button>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

          
        }
                    <!-- BANNÈRE D'URGENCE SÉCURITÉ CHAÎNE DU FROID -->
        @if (alerteFrigoCritique) {
          <div class="alert-banner alert-danger" style="background-color: #fef2f2; color: #ef4444; border-color: #fca5a5;">
            🚨 ALERTE CRITIQUE RUPTURE CHAÎNE DU FROID : Un réfrigérateur a dépassé les normes (+2°C / +8°C). Les vaccins risquent d'être altérés !
          </div>
        }

        <!-- BLOCS JUMEAUX STOCKS ET TEMPÉRATURES -->
        <div class="pro-modules-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem;">
          
          <!-- COMPOSANT GESTION DES STOCKS -->
          <div class="medical-timeline-card">
            <h3>📦 État des Stocks et Inventaire des Doses</h3>
            <div class="clinical-table-wrapper">
              <table class="clinical-table">
                <thead>
                  <tr>
                    <th>Vaccin</th>
                    <th>Doses Restantes</th>
                    <th>Numéro Lot</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of listeStocks; track item.id) {
                    <tr>
                      <td><strong>{{ item.vaccin_code }}</strong></td>
                      <td>{{ item.quantite_disponible }} doses</td>
                      <td class="text-dimmed">{{ item.numero_lot }}</td>
                      <td>
                        @if (item.alerte_rupture) {
                          <span style="background-color: #fee2e2; color: #ef4444; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 700;">⚠️ RUPTURE PROCHE</span>
                        } @else {
                          <span style="background-color: #dcfce7; color: #10b981; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 700;">✅ DISPONIBLE</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- COMPOSANT SUIVI DE LA CHAÎNE DU FROID -->
          <div class="medical-timeline-card">
            <h3>❄️ Traçabilité Thermique (Chaîne du Froid)</h3>
            <div class="clinical-table-wrapper">
              <table class="clinical-table">
                <thead>
                  <tr>
                    <th>Équipement</th>
                    <th>Température (°C)</th>
                    <th>Date Relevé</th>
                    <th>État</th>
                  </tr>
                </thead>
                <tbody>
                  @for (temp of listeTemperatures; track temp.id) {
                    <tr>
                      <td>{{ temp.nom_refrigerateur }}</td>
                      <td [style.color]="temp.est_anomalie ? '#ef4444' : '#1e293b'"><strong>{{ temp.temperature }} °C</strong></td>
                      <td class="text-dimmed">{{ temp.date }}</td>
                      <td>
                        @if (temp.est_anomalie) {
                          <span style="color: #ef4444; font-weight: 700;">🚨 HORS-NORME</span>
                        } @else {
                          <span style="color: #10b981; font-weight: 700;">✔️ STABLE</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

        </div>


        <!-- PANNEAU D'ATTENTE S'IL N'Y A PAS DE RECHERCHE ACTIVE -->
        @if (!isLoading && !enfantTrouve && !errorMessage) {
          <div class="waiting-state-card">
            <span class="waiting-icon">📁</span>
            <h3>En attente de lecture</h3>
            <p>Veuillez saisir son token unique ci-dessus pour faire remonter son dossier médical sécurisé.</p>
          </div>
        }
      </main>
    </div>
  `,
   
styles: [`
    /* Structure Globale */
    .medecin-global-container { display: flex; min-height: 100vh; background-color: #f8fafc; font-family: 'Segoe UI', system-ui, sans-serif; color: #334155; }
    
    /* Sidebar Harmonisée en Bleu Clair */
    .medecin-sidebar { width: 280px; background-color: #006fc2; color: #ffffff; display: flex; flex-direction: column; justify-content: space-between; padding: 2rem 1.5rem; box-shadow: 4px 0 15px rgba(0, 111, 194, 0.1); }
    .sidebar-brand-area h2 { font-size: 1.25rem; margin: 0 0 2rem 0; color: #ffffff; font-weight: 700; letter-spacing: -0.5px; opacity: 0.95; }
    .sidebar-medical-meta { flex-grow: 1; display: flex; flex-direction: column; gap: 1.5rem; }
    
    /* Badges et Cartes internes de la Sidebar (Harmonie Translucide) */
    .doctor-badge-info { display: flex; align-items: center; gap: 0.75rem; background-color: rgba(255, 255, 255, 0.12); padding: 1rem; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.18); }
    .doctor-badge-info .doc-icon { font-size: 1.5rem; }
    .doctor-badge-info .doc-text { display: flex; flex-direction: column; }
    .doctor-badge-info .doc-text strong { font-size: 0.95rem; color: #ffffff; }
    .doctor-badge-info .doc-text small { font-size: 0.8rem; color: rgba(255, 255, 255, 0.75); margin-top: 2px; }
    
    .stats-card-widget { background: rgba(255, 255, 255, 0.15); padding: 1.25rem; border-radius: 8px; border-left: 4px solid #00f2fe; border-top: 1px solid rgba(255, 255, 255, 0.1); border-right: 1px solid rgba(255, 255, 255, 0.1); border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
    .stats-label { display: block; font-size: 0.8rem; color: rgba(255, 255, 255, 0.8); margin-bottom: 0.5rem; font-weight: 500; }
    .stats-value { font-size: 2rem; font-weight: 700; color: #ffffff; }
    
    /* Boutons de Navigation de la Sidebar */
    .btn-forum-nav { width: 100%; margin-top: 1rem; background: #ffffff; color: #006fc2; border: none; padding: 12px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
    .btn-forum-nav:hover { background: #f0fdf4; transform: translateY(-1px); }
    
    /* Bouton Déconnexion Propre et Lisible */
    .btn-logout { width: 100%; background-color: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.3); color: #ffffff; padding: 0.75rem; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
    .btn-logout:hover { background-color: #ef4444; border-color: #ef4444; color: #ffffff; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2); }
    
    /* Zone Principale de Contenu */
    .medecin-main-content { flex: 1; padding: 2.5rem; overflow-y: auto; }
    .search-section-header { margin-bottom: 2rem; }
    .search-section-header h1 { font-size: 1.75rem; color: #1e293b; margin: 0 0 0.5rem 0; font-weight: 700; }
    .search-section-header p { font-size: 0.95rem; color: #64748b; margin: 0; }
    
    /* Barre de Recherche et Bouton "Charger le Dossier" Modernisé */
    .search-action-bar { display: flex; gap: 1rem; margin-bottom: 2rem; background-color: #ffffff; padding: 0.75rem; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .input-search-wrapper { flex: 1; position: relative; }
    .search-prefix-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); }
    .form-control-search { padding-left: 2.5rem; width: 100%; height: 48px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 1rem; color: #1e293b; font-weight: 600; background-color: #f8fafc; box-sizing: border-box; transition: all 0.2s ease; }
    .form-control-search:focus { outline: none; border-color: #006fc2; background-color: #ffffff; box-shadow: 0 0 0 3px rgba(0, 111, 194, 0.15); }
    
    .btn-action-search { height: 48px; padding: 0 1.75rem; background-color: #006fc2; color: #ffffff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(0, 111, 194, 0.15); }
    .btn-action-search:hover:not(:disabled) { background-color: #005696; transform: translateY(-1px); }
    .btn-action-search:disabled { background-color: #cbd5e1; color: #94a3b8; cursor: not-allowed; box-shadow: none; }
    
    /* Bannières d'Alerte */
    .alert-banner { padding: 1rem; border-radius: 6px; margin-bottom: 2rem; font-weight: 500; font-size: 0.95rem; display: flex; align-items: center; }
    .alert-danger { background-color: #fef2f2; color: #991b1b; border: 1px solid #fee2e2; }
    .alert-success { background-color: #f0fdf4; color: #166534; border: 1px solid #dcfce7; }
    
    /* Fiche Patient et Timeline */
    .patient-file-layout { display: flex; flex-direction: column; gap: 2rem; animation: fadeIn 0.3s ease-in-out; }
    .patient-avatar-box { width: 64px; height: 64px; background-color: #e0f2fe; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; }
    .patient-meta-details h2 { font-size: 1.35rem; color: #1e293b; margin: 0 0 0.5rem 0; }
    .patient-badges-row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .badge-tag { background-color: #f8fafc; color: #334155; padding: 4px 10px; border-radius: 4px; font-size: 0.85rem; font-weight: 500; border: 1px solid #e2e8f0; }
    .badge-tag.token-tag { background-color: #fef3c7; color: #92400e; border-color: #fde68a; font-family: monospace; }
    
    /* Tableaux Cliniques */
    .medical-timeline-card { background-color: #ffffff; padding: 1.5rem; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .medical-timeline-card h3 { font-size: 1.1rem; color: #1e293b; margin: 0 0 1.25rem 0; font-weight: 600; }
    .clinical-table-wrapper { overflow-x: auto; }
    .clinical-table { width: 100%; border-collapse: collapse; text-align: left; }
    .clinical-table th, .clinical-table td { padding: 1rem; border-bottom: 1px solid #e2e8f0; font-size: 0.95rem; }
    .clinical-table th { background-color: #f8fafc; color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.5px; }
    .clinical-table tbody tr:hover { background-color: rgba(248, 250, 252, 0.7); }
    .text-dimmed { color: #64748b; font-size: 0.9rem; }
    .date-check { color: #10b981; font-weight: 600; }
    
    /* Status et Actions Éléments */
    .badge-status.status-done { background-color: #dcfce7; color: #166534; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; display: inline-block; }
    .btn-clinical-validate { background-color: #f0fdf4; color: #10b981; border: 1px solid rgba(34, 197, 94, 0.3); padding: 6px 14px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
    .btn-clinical-validate:hover { background-color: #10b981; color: #ffffff; border-color: #10b981; }
    
    /* État d'attente */
    .waiting-state-card { background-color: #ffffff; padding: 4rem 2rem; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); text-align: center; border: 2px dashed #e2e8f0; margin-top: 2rem; }
    .waiting-state-card h3 { color: #1e293b; font-size: 1.2rem; margin: 0 0 0.5rem 0; }
    .waiting-state-card p { color: #64748b; font-size: 0.95rem; max-width: 400px; margin: 0 auto; }
    
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
`]

})
export class MedecinDashboardComponent implements OnInit {
  public injectionsDuMois: number = 0;
  public tokenSaisi: string = '';
  public isLoading: boolean = false;
  public enfantTrouve: any = null;
  public carnetVaccinal: any[] = [];
  
  public errorMessage: string = '';
  public successMessage: string = '';

  private readonly API_BASE_URL = 'http://localhost:8000/api/v1/vaccinations/doctor/';
  // 🟢 NOUVELLES VARIABLES AJOUTÉES POUR LES MODULES PRO
  public listeStocks: any[] = [];
  public listeTemperatures: any[] = [];
  public alerteFrigoCritique: boolean = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private apiService: ApiService
  ) { }

  ngOnInit(): void {
    this.chargerStatistiquesCliniques();
    this.chargerGestionStocks();
    this.chargerSuiviChaineFroid();
  }

  private obtenirHeadersSecurises(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }
  
  public chargerGestionStocks(): void {
    this.apiService.getStocksVaccins().subscribe({
      next: (data) => this.listeStocks = data,
      error: (err) => console.error("Erreur chargement stocks", err)
    });
  }

  public chargerSuiviChaineFroid(): void {
    this.apiService.getChaineFroid().subscribe({
      next: (data) => {
        this.listeTemperatures = data;
        // 🟢 COMMENTAIRE PYTHON HASH (#) REMPLACÉ PAR UN DOUBLE SLASH (//)
        // Détection d'une anomalie thermique sur le dernier relevé (+2°C / +8°C)
        if (data && data.length > 0) {
          this.alerteFrigoCritique = data[0].est_anomalie;
        }
      },
      error: (err) => console.error("Erreur chaîne du froid", err)
    });
  }

  public chargerStatistiquesCliniques(): void {
    this.http.get<any>(`${this.API_BASE_URL}stats/`, { headers: this.obtenirHeadersSecurises() }).subscribe({
      next: (data) => this.injectionsDuMois = data.injectionsDuMois,
      error: (err) => console.error("Erreur de communication API Stats", err)
    });
  }

  public onTokenInput(event: any): void {
    this.tokenSaisi = event.target.value.trim();
  }

  public rechercherDossierEnfant(): void {
    if (!this.tokenSaisi) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.enfantTrouve = null;
    this.carnetVaccinal = [];

    this.http.get<any>(`${this.API_BASE_URL}recherche/${this.tokenSaisi}/`, { headers: this.obtenirHeadersSecurises() }).subscribe({
      next: (data) => {
        this.enfantTrouve = data.enfant;
        this.carnetVaccinal = data.carnetVaccinal;
        this.successMessage = "Dossier médical crypté chargé avec succès depuis PostgreSQL.";
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err.error?.message || "Aucun passeport vaccinal trouvé pour ce jeton sous-régional.";
        this.isLoading = false;
      }
    });
  }

  public validerInjection(ligneId: string): void {
    this.http.post<any>(`${this.API_BASE_URL}certifier/${ligneId}/`, {}, { headers: this.obtenirHeadersSecurises() }).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        const vaccin = this.carnetVaccinal.find(v => v.id === ligneId);
        if (vaccin) {
          vaccin.statut = 'ADMINISTRE';
          vaccin.date_administration_reelle = new Date().toLocaleDateString('fr-FR');
        }
        this.injectionsDuMois++;
      },
      error: () => this.errorMessage = "Erreur lors de la certification de l'injection."
    });
  }

  public naviguerVersForum(): void {
    this.router.navigate(['/medecin/forum']);
  }

  public deconnecterSession(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
