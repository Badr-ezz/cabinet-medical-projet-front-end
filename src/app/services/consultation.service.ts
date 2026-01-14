import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Consultation, ConsultationRequest } from '../models/consultation.model';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class ConsultationService {

    // Port 8084 as configured for consultation-service
    private readonly API_URL = 'http://localhost:8084/api/consultations';

    private http = inject(HttpClient);
    private authService = inject(AuthService);

    private getAuthHeaders(): HttpHeaders {
        const token = this.authService.getToken();
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        });
    }

    getAll(): Observable<Consultation[]> {
        return this.http.get<Consultation[]>(this.API_URL, { headers: this.getAuthHeaders() });
    }

    getById(id: number): Observable<Consultation> {
        return this.http.get<Consultation>(`${this.API_URL}/${id}`, { headers: this.getAuthHeaders() });
    }

    getByPatientId(patientId: number): Observable<Consultation[]> {
        return this.http.get<Consultation[]>(`${this.API_URL}/patient/${patientId}`, { headers: this.getAuthHeaders() });
    }

    getByMedecinId(medecinId: number): Observable<Consultation[]> {
        return this.http.get<Consultation[]>(`${this.API_URL}/medecin/${medecinId}`, { headers: this.getAuthHeaders() });
    }

    create(consultation: ConsultationRequest): Observable<Consultation> {
        return this.http.post<Consultation>(this.API_URL, consultation, { headers: this.getAuthHeaders() });
    }

    update(id: number, consultation: ConsultationRequest): Observable<Consultation> {
        return this.http.put<Consultation>(`${this.API_URL}/${id}`, consultation, { headers: this.getAuthHeaders() });
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/${id}`, { headers: this.getAuthHeaders() });
    }
}
