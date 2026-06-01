import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // 🟢 Remplacement de localhost par votre URL Render officielle (sans oublier le suffixe de l'API)
  private readonly baseUrl = 'https://vaccitrack-backend-4.onrender.com/api/v1/vaccinations/doctor';

  constructor(private http: HttpClient) { }

  /**
   * Récupère le token d'authentification pour sécuriser les requêtes vers Render
   */
  private obtenirHeadersSecurises(): { headers: HttpHeaders } {
    const token = localStorage.getItem('access_token');
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };
  }

  getDoctorStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/stats/`, this.obtenirHeadersSecurises());
  }

  getEnfantParToken(token: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/recherche/${token}/`, this.obtenirHeadersSecurises());
  }

  postCertifierInjection(ligneId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/certifier/${ligneId}/`, {}, this.obtenirHeadersSecurises());
  }

  /**
   * Récupère l'état des stocks de vaccins (BCG, Penta...) depuis Render
   */
  getStocksVaccins(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/stocks/`, this.obtenirHeadersSecurises());
  }

  /**
   * Récupère l'historique de la chaîne du froid depuis Render
   */
  getChaineFroid(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/chaine-froid/`, this.obtenirHeadersSecurises());
  }
}