import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('user_role');

  // 1. Si aucun jeton n'est stocké, accès interdit immédiatement
  if (!token) {
    localStorage.clear();
    router.navigate(['/login']);
    return false;
  }

  // 2. Sécurisation et vérification de la route selon le rôle utilisateur
  const urlDemandee = state.url;

  if (urlDemandee.includes('/parent/') && role !== 'PARENT') {
    router.navigate(['/login']);
    return false;
  }

  if (urlDemandee.includes('/medecin/') && role !== 'MEDECIN' && role !== 'AGENT_SANTE') {
    router.navigate(['/login']);
    return false;
  }

  return true;
};
