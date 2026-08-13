import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  // Structure du formulaire réactif
  public loginForm!: FormGroup;
  
  // États de l'interface utilisateur
  public isLoading: boolean = false;
  public errorMessage: string | null = null;

  // Point d'entrée de l'API Django Simple-JWT (sera créé à l'étape suivante)
   private readonly API_URL = `${environment.apiUrl}/authentications/login/`;
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initialiserFormulaire();
  }

  /**
   * Initialise le formulaire avec des règles de validation basiques mais strictes.
   */
  private initialiserFormulaire(): void {
    this.loginForm = this.fb.group({
      role: ['PARENT', [Validators.required]], // Rôle par défaut requis pour adapter la session
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  /**
   * Traite la soumission des identifiants et communique avec Django.
   */
  public onSubmit(): void {
    console.log("=== Clic détecté sur Se Connecter ===");
    console.log("Valeurs saisies :", this.loginForm.value);
    console.log("Le formulaire est-il valide ? :", this.loginForm.valid);

    if (this.loginForm.invalid) {
      console.warn("❌ Formulaire invalide. Liste des erreurs par champ :");
      Object.keys(this.loginForm.controls).forEach(key => {
        const controlErrors = this.loginForm.get(key)?.errors;
        if (controlErrors != null) {
          console.warn(`Champ [${key}] en erreur :`, controlErrors);
        }
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    console.log("🚀 Envoi de la requête réseau vers Django...");

    // ⚡ FIX: Utilisation de this.API_URL dynamique au lieu de localhost
    this.http.post<any>(this.API_URL, this.loginForm.value).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        console.log("✅ Authentification réussie ! Réponse Django :", response);
        
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        localStorage.setItem('user_role', response.role);

        this.redirigerSelonRole(response.role);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        console.error("❌ Échec réseau de l'authentification :", error);
        this.gererErreurConnexion(error); // 👈 Gestion du message d'erreur utilisateur
      }
    });
  }
   /**
     /**
   * Oriente l'utilisateur vers son espace dédié après authentification réussie.
   */
  private redirigerSelonRole(role: string): void {
    const roleNettoye = role ? role.toUpperCase().trim() : '';
    console.log("Aiguillage en cours pour le rôle nettoyé :", roleNettoye);

    if (roleNettoye === 'PARENT') {
      console.log("➡️ Redirection forcée vers l'espace Parent...");
      this.router.navigate(['/parent/dashboard']).then(
        success => console.log("Navigation parent réussie :", success),
        error => console.error("Échec navigation parent :", error)
      );
    } else if (roleNettoye === 'MEDECIN' || roleNettoye === 'AGENT_SANTE') {
      console.log("➡️ Redirection forcée vers l'espace Médecin...");
      
      // ⚡ RECTIFICATION STRICTE : Utilisation du chemin exact déclaré dans app.routes.ts
      this.router.navigate(['/medecin/dashboard']).then(
        success => console.log("Navigation médecin réussie :", success),
        error => console.error("Échec navigation médecin :", error)
      );
    } else if (roleNettoye === 'ADMIN_MINISTERE') {
      this.router.navigate(['/ministere/dashboard']);
    } else {
      console.warn("⚠️ Aucun itinéraire pour le rôle :", roleNettoye);
      this.router.navigate(['/login']);
    }
  }

  /**
   * Intercepte explicitement les codes de retour de l'API pour informer l'utilisateur.
   */
  private gererErreurConnexion(error: HttpErrorResponse): void {
    if (error.status === 0) {
      this.errorMessage = "Impossible de joindre le serveur VacciTrack. Vérifiez votre connexion internet.";
    } else if (error.status === 401) {
      this.errorMessage = "Adresse e-mail ou mot de passe incorrect. Veuillez réessayer.";
    } else if (error.status === 403) {
      this.errorMessage = "Votre compte n'est pas autorisé à se connecter avec ce profil.";
    } else {
      this.errorMessage = `Une erreur technique est survenue (Code: ${error.status}). Veuillez réessayer.`;
    }
  }
}
