import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { VocalService } from '../../core/services/vocal.service';

export interface Enfant {
  id: string;
  prenom: string;
  nom: string;
  nom_complet: string;
  date_naissance: string;
  genre: string;
  pays_residence_nom: string;
  qr_code_token: string;
}

export interface VaccinLigne {
  id: number;
  vaccin_code: string;
  nom_maladie_cible: string;
  statut: 'ADMINISTRE' | 'A_VENIR' | 'EN_RETARD';
  date_prevue: string;
}

@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './parent-dashboard.component.html',
  styleUrls: ['./parent-dashboard.component.scss']
})
export class ParentDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<boolean>();
  public listeEnfants: Enfant[] = [];
  public enfantSelectionne: Enfant | null = null;
  public carnetVaccination: VaccinLigne[] = [];
  public isLoading: boolean = true;
  public errorMessage: string | null = null;

  private readonly API_ENFANTS_URL = 'http://localhost:8000/api/v1/patients/enfants/';

  constructor(
    private http: HttpClient,
    private router: Router,
    private vocalService: VocalService // 🟢 L'INJECTION A ÉTÉ CORRIGÉE ET PLACÉE ICI
  ) {}

  ngOnInit(): void {
    this.chargerDonneesDashboard();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  /**
   * Charge la fratrie liée au parent connecté depuis l'API Django
   */
  public chargerDonneesDashboard(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.http.get<Enfant[]>(this.API_ENFANTS_URL)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (enfants: Enfant[]) => {
          this.listeEnfants = enfants;
          if (enfants && enfants.length > 0) {
            this.selectionnerEnfant(enfants[0]); 
          } else {
            this.isLoading = false;
          }
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;
          console.error("Détail de l'erreur interceptée :", error);
          this.errorMessage = "Impossible de joindre la base de données.";
        }
      });
  }

  /**
   * Charge le carnet de vaccination de l'enfant sélectionné
   */
  public selectionnerEnfant(enfant: Enfant): void {
    this.enfantSelectionne = enfant;
    this.isLoading = true;
    this.errorMessage = null;

    const API_CALENDRIER_URL = `http://localhost:8000/api/v1/vaccinations/calendrier/${enfant.id}/`;

    this.http.get<VaccinLigne[]>(API_CALENDRIER_URL)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lignes: VaccinLigne[]) => {
          this.carnetVaccination = lignes;
          this.isLoading = false;
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;
          this.errorMessage = "Erreur lors du chargement de son calendrier PEV.";
        }
      });
  }

  /**
   * Ouvre la cinématique de modification et redirige vers le formulaire d'édition
   */
  public modifierEnfant(id: string): void {
    console.log("Demande de modification pour l'enfant ID :", id);
    this.router.navigate(['/parent/edit-enfant', id]);
  }

  /**
   * Supprime définitivement l'enfant et ses lignes de vaccins associées
   */
  public supprimerEnfant(id: string): void {
    if (confirm("Voulez-vous vraiment supprimer définitivement le profil de cet enfant ainsi que tout son carnet vaccinal ?")) {
      this.http.delete(`http://localhost:8000/api/v1/patients/enfants/${id}/`)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            alert("Profil supprimé avec succès.");
            this.chargerDonneesDashboard();
          },
          error: (error: HttpErrorResponse) => {
            alert("Erreur lors du traitement de la suppression.");
          }
        });
    }
  }

  /**
   * Navigue vers l'écran d'enregistrement d'un nouvel enfant
   */
  public naviguerVersAjoutEnfant(): void {
    this.router.navigate(['/parent/add-enfant']);
  }

  /**
   * Navigue vers l'espace communautaire global du forum
   */
  public naviguerVersForum(): void {
    this.router.navigate(['/parent/forum']); 
  }

  /**
   * Ouvre une discussion ou un message spécifique du forum
   */
  public ouvrirDiscussionForum(idMessage: string = 'general'): void {
    console.log("Navigation vers le fil de discussion :", idMessage);
    this.router.navigate(['/parent/forum'], { queryParams: { thread: idMessage } });
  }

  /**
   * Efface les jetons et déconnecte l'utilisateur
   */
  public deconnecterEspace(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  /**
   * Déclenche le téléchargement du PDF certifié généré par WeasyPrint depuis le backend Django.
   */
  public telechargerPDF(): void {
    if (!this.enfantSelectionne) return;

    const API_PDF_URL = `http://localhost:8000/api/v1/vaccinations/carnet-pdf/${this.enfantSelectionne.id}/`;
    const token = localStorage.getItem('access_token');

    fetch(API_PDF_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) throw new Error("Erreur de téléchargement du PDF.");
      return response.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `carnet_vaccinal_${this.enfantSelectionne?.prenom.toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    })
    .catch(error => console.error("Erreur Impression PDF :", error));
  }
  
  public declencherSyntheseVocale(): void {
    if (!this.enfantSelectionne) return;

    // Récupération de la langue préférée enregistrée dans PostgreSQL (stockée au login)
    // Si non spécifiée, l'application basculera sur le Français ('FR') automatiquement
    const langueParent = localStorage.getItem('langue_preferee') || 'FR';

    // Déclenchement du moteur d'inclusion audio VacciTrack
    this.vocalService.lireCalendrierVocal(
      this.enfantSelectionne.prenom,
      this.carnetVaccination,
      langueParent
    );
  }
}