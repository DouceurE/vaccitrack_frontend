import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule
  ],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
  public signupForm!: FormGroup;
  public currentStep: number = 1;
  public isLoading: boolean = false;
  public errorMessage: string | null = null;
  public successMessage: string | null = null;

  public listePays = [
    { code: 'SEN', nom: 'Sénégal', drapeau: '🇸🇳', indicatif: '+221' },
    { code: 'BFA', nom: 'Burkina Faso', drapeau: '🇧🇫', indicatif: '+226' },
    { code: 'MLI', nom: 'Mali', drapeau: '🇲🇱', indicatif: '+223' }
  ];

  public listeLangues = [
    { code: 'FR', nom: 'Français' },
    { code: 'WO', nom: 'Wolof' },
    { code: 'BA', nom: 'Bambara' },
    { code: 'MO', nom: 'Mooré' }
  ];

  // ⚡ URL dynamique selon l'environnement (Dev / Production)
  private readonly API_URL = `${environment.apiUrl}/authentications/register/`;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.initialiserFormulaire();
  }

  private initialiserFormulaire(): void {
    this.signupForm = this.fb.group({
      role: ['PARENT', [Validators.required]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      languePreferee: ['FR', [Validators.required]],
      paysCode: ['', [Validators.required]],
      telephone: ['', [Validators.required, Validators.pattern(/^\d{8,12}$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.verifierMotsDePasseIdentiques
    });
  }

  private verifierMotsDePasseIdentiques(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { 'notMatching': true };
  }

  public etapeSuivante(): void {
    if (this.currentStep === 1 && this.signupForm.get('firstName')?.valid && this.signupForm.get('lastName')?.valid) {
      this.currentStep = 2;
    } else if (this.currentStep === 2 && this.signupForm.get('paysCode')?.valid && this.signupForm.get('telephone')?.valid) {
      this.currentStep = 3;
    }
  }

  public etapePrecedente(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  public onSubmit(): void {
    if (this.signupForm.invalid) {
      this.errorMessage = "Veuillez remplir correctement tous les champs requis.";
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const formValues = this.signupForm.value;
    const paysSelectionne = this.listePays.find(p => p.code === formValues.paysCode);
    const telephoneInternational = `${paysSelectionne?.indicatif}${formValues.telephone}`;

    const payload = {
      email: formValues.email,
      password: formValues.password,
      password_confirm: formValues.confirmPassword,
      first_name: formValues.firstName,
      last_name: formValues.lastName,
      role: formValues.role,
      langue_preferee: formValues.languePreferee,
      telephone: telephoneInternational
    };

    this.http.post(this.API_URL, payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = "Votre compte VacciTrack a été créé avec succès !";
        this.signupForm.reset({ role: 'PARENT', languePreferee: 'FR' });
        this.currentStep = 1;
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.gererErreurServeur(error);
      }
    });
  }

  private gererErreurServeur(error: HttpErrorResponse): void {
    console.log("Détail de l'erreur Django :", error.error);
    if (error.status === 0) {
      this.errorMessage = "Impossible de joindre le serveur VacciTrack. Veuillez vérifier votre connexion Internet.";
    } else if (error.status === 400 && error.error) {
      if (error.error.email) {
        this.errorMessage = "Cette adresse e-mail est déjà utilisée.";
      } else if (error.error.telephone) {
        this.errorMessage = "Ce numéro de téléphone est déjà enregistré.";
      } else {
        this.errorMessage = "Les données saisies sont invalides.";
      }
    } else {
      this.errorMessage = `Une erreur critique est survenue (Code: ${error.status}).`;
    }
  }
}