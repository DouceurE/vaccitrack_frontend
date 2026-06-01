import { Routes } from '@angular/router';
import { SignupComponent } from './modules/auth/signup.component';
import { LoginComponent } from './modules/auth/login.component';
import { AddEnfantComponent } from './modules/parent/add-enfant.component';
import { ParentDashboardComponent } from './modules/parent/parent-dashboard.component';
import { ParentForumComponent } from './modules/parent/parent-forum.component';
import { MedecinDashboardComponent } from './modules/medecin/medecin-dashboard.component'; // ⚡ IMPORTATION NETTOYÉE
import { EditEnfantComponent } from './modules/parent/edit-enfant/edit-enfant.component';
import { authGuard } from './core/guards/auth.guard';
import { MedecinForumComponent } from './modules/medecin/medecin-forum.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'signup', component: SignupComponent },
  { path: 'login', component: LoginComponent },
  
  // Espace Parent Sécurisé
  { path: 'parent/dashboard', component: ParentDashboardComponent, canActivate: [authGuard] },
  { path: 'parent/add-enfant', component: AddEnfantComponent, canActivate: [authGuard] },
  { path: 'parent/forum', component: ParentForumComponent, canActivate: [authGuard] },
   { path: 'parent/edit-enfant/:id', component: EditEnfantComponent },
   
  // Espace Médecin Sécurisé
  { path: 'medecin/dashboard', component: MedecinDashboardComponent, canActivate: [authGuard] }, // ⚡ ROUTE NETTOYÉE
  { path: 'medecin/forum', component: MedecinForumComponent, canActivate: [authGuard] },
  
  { path: '**', redirectTo: 'login' }
];
