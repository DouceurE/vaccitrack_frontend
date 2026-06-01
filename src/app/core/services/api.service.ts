import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://127.0.0';

  constructor(private http: HttpClient) { }

  getDoctorStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/stats/`);
  }

  getEnfantParToken(token: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/recherche/${token}/`);
  }

  postCertifierInjection(ligneId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/certifier/${ligneId}/`, {});
  }
    /**
   * Récupère l'état des stocks de vaccins (BCG, Penta...)
   */
  getStocksVaccins(): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8000/api/v1/vaccinations/doctor/stocks/`);
  }

  /**
   * Récupère l'historique des relevés de température de la chaîne du froid
   */
  getChaineFroid(): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8000/api/v1/vaccinations/doctor/chaine-froid/`);
  }

}
