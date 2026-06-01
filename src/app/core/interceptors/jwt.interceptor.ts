import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const jwtInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const router = inject(Router);
  
  // Lecture de la clé harmonisée
  const accessToken = localStorage.getItem('access_token');
  let clonedRequest = req;

  // Si le jeton est trouvé, on l'injecte obligatoirement dans les en-têtes
  if (accessToken) {
    clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`
      }
    });
  } else {
    console.warn("⚠️ Aucun access_token trouvé dans le LocalStorage pour la requête :", req.url);
  }

  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.error("❌ Django a rejeté le jeton (401 Unauthorized) pour :", req.url);
        // On ne redirige pas sauvagement si c'est la page de login elle-même
        if (!req.url.includes('/authentications/login/')) {
          localStorage.clear();
          router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    })
  );
};
