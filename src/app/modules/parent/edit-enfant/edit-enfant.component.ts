import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-edit-enfant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-enfant.component.html',
  styleUrls: ['./edit-enfant.component.scss']
})
export class EditEnfantComponent implements OnInit {
  public enfantId!: string;
  public isLoading: boolean = true;
  public isSaving: boolean = false;
  public errorMessage: string | null = null;
  public successMessage: string | null = null;

  // Modèle de données lié au formulaire
  public enfant = {
    prenom: '',
    nom: '',
    date_naissance: '',
    genre: '',
    pays_residence: ''
  };

  // Liste des pays qui sera surchargée dynamiquement par l'API PostgreSQL
  public listePays: any[] = [];

  private readonly API_BASE_URL = 'http://localhost:8000/api/v1/patients/enfants/';
  private readonly API_PAYS_URL = 'http://localhost:8000/api/v1/locations/pays/';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Extrait l'ID de l'enfant présent dans l'adresse URL
    this.enfantId = this.route.snapshot.paramMap.get('id')!;
    this.chargerListePays(); // Étape 1 : Charger la cartographie (Sénégal, Burkina, Mali)
    if (this.enfantId) {
      this.chargerDonneesEnfant(); // Étape 2 : Charger les informations de l'enfant
    }
  }

  /**
   * Récupère la liste officielle des pays d'Afrique de l'Ouest depuis PostgreSQL
   */
  private chargerListePays(): void {
    const token = localStorage.getItem('access_token');
    this.http.get<any[]>(this.API_PAYS_URL, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe({
      next: (pays) => this.listePays = pays,
      error: (err) => console.error("Échec du chargement des pays", err)
    });
  }

  /**
   * Récupère les informations actuelles de l'enfant pour pré-remplir le formulaire
   */
  private chargerDonneesEnfant(): void {
    const token = localStorage.getItem('access_token');
    this.http.get<any>(`${this.API_BASE_URL}${this.enfantId}/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe({
      next: (data) => {
        this.enfant.prenom = data.prenom;
        this.enfant.nom = data.nom;
        this.enfant.date_naissance = data.date_naissance;
        this.enfant.genre = data.genre;
        this.enfant.pays_residence = data.pays_residence; // ID du pays
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = "Impossible de récupérer les données de l'enfant.";
        this.isLoading = false;
      }
    });
  }

  /**
   * Envoie les modifications validées au serveur Django via une requête PUT
   */
  public enregistrerModifications(event: Event): void {
    event.preventDefault();
    this.isSaving = true;
    this.errorMessage = null;
    this.successMessage = null;

    const token = localStorage.getItem('access_token');
    this.http.put(`${this.API_BASE_URL}${this.enfantId}/`, this.enfant, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe({
      next: () => {
        this.successMessage = "Le profil a été mis à jour avec succès.";
        this.isSaving = false;
        // Retour automatique vers le tableau de bord parent d'où l'on vient après 1.5 seconde
        setTimeout(() => this.router.navigate(['/parent/dashboard']), 1500);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = "Erreur lors de la sauvegarde des modifications.";
        this.isSaving = false;
      }
    });
  }

  /**
   * Retourne manuellement au tableau de bord parent lors d'un clic sur Annuler
   */
  public annuler(): void {
    this.router.navigate(['/parent/dashboard']);
  }
}
