import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardCounts } from './dashboard-counts.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  getCounts(): Observable<DashboardCounts> {
    return this.http.get<DashboardCounts>(`${this.apiUrl}/counts`);
  }
}
