import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment'; // 👈 Import de environment

@Component({
  selector: 'app-add-enfant',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  styleUrls: ['./add-enfant.component.scss'],
  templateUrl: './add-enfant.component.html'
})
export class AddEnfantComponent implements OnInit {
  public enfantForm!: FormGroup;
  public isLoading: boolean = false;
  public errorMessage: string | null = null;
  public successMessage: string | null = null;

  public listePays = [
    { id: 'SEN', nom: 'Sénégal', flag: '🇸🇳' },
    { id: 'BFA', nom: 'Burkina Faso', flag: '🇧🇫' },
    { id: 'MLI', nom: 'Mali', flag: '🇲🇱' }
  ];

  // ⚡ FIX: Remplacement de http://localhost:8000 par environment.apiUrl
  private readonly API_URL = `${environment.apiUrl}/patients/enfants/`;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initialiserFormulaire();
  }

  private initialiserFormulaire(): void {
    this.enfantForm = this.fb.group({
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      nom: ['', [Validators.required, Validators.minLength(2)]],
      date_naissance: ['', [Validators.required, this.validerDatePasDansLeFutur]],
      genre: ['', [Validators.required]],
      pays_residence_code: ['', [Validators.required]]
    });
  }

  private validerDatePasDansLeFutur(control: AbstractControl): { [key: string]: boolean } | null {
    if (control.value) {
      const dateSaisie = new Date(control.value);
      const dateActuelle = new Date();
      dateActuelle.setHours(0, 0, 0, 0);
      if (dateSaisie > dateActuelle) {
        return { 'dateFuture': true };
      }
    }
    return null;
  }

  public onSubmit(): void {
    if (this.enfantForm.invalid) {
      this.errorMessage = "Veuillez remplir correctement tous les champs requis.";
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.http.post(this.API_URL, this.enfantForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = "L'enfant a été enregistré et son calendrier PEV a été généré.";
        this.enfantForm.reset();
        setTimeout(() => {
          this.router.navigate(['/parent/dashboard']);
        }, 1500);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        if (error.status === 401) {
          this.errorMessage = "Erreur d'authentification. Votre session a expiré.";
        } else {
          this.errorMessage = "Impossible d'enregistrer l'enfant. Vérifiez les champs.";
        }
      }
    });
  }

  public retournerDashboard(): void {
    this.router.navigate(['/parent/dashboard']);
  }
}