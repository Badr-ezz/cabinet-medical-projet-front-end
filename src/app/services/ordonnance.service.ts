import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export enum TypeOrdonnance {
    MEDICAMENT = 'MEDICAMENT',
    EXAMEN = 'EXAMEN'
}

export interface OrdonnanceRequest {
    consultationId: number;
    type: TypeOrdonnance;
    contenuLibre?: string;
}

export interface Ordonnance {
    id: number;
    consultationId: number;
    type: TypeOrdonnance;
    dateCreation: string;
    contenuLibre?: string;
    medicaments?: Medicament[];
}

export interface MedicamentRequest {
    ordonnanceId: number;
    nom: string;
    description?: string;
    dosage?: string;
    duree?: string;
}

export interface Medicament {
    id: number;
    nom: string;
    description?: string;
    dosage?: string;
    duree?: string;
}

@Injectable({
    providedIn: 'root'
})
export class OrdonnanceService {
    // Using Consultation Service port because OrdonnanceController is likely there
    // Based on backend file location: consultation-service
    private readonly BASE_URL = 'http://localhost:8084/api';

    private http = inject(HttpClient);
    private authService = inject(AuthService);

    private getAuthHeaders(): HttpHeaders {
        // Basic auth for now or Bearer if auth service provides it
        const token = this.authService.getToken();
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        });
    }

    // --- Ordonnances ---

    createOrdonnance(request: OrdonnanceRequest): Observable<Ordonnance> {
        return this.http.post<Ordonnance>(`${this.BASE_URL}/ordonnances`, request, { headers: this.getAuthHeaders() });
    }

    getOrdonnanceById(id: number): Observable<Ordonnance> {
        return this.http.get<Ordonnance>(`${this.BASE_URL}/ordonnances/${id}`, { headers: this.getAuthHeaders() });
    }

    // --- Medicaments ---

    addMedicament(request: MedicamentRequest): Observable<Medicament> {
        return this.http.post<Medicament>(`${this.BASE_URL}/medicaments`, request, { headers: this.getAuthHeaders() });
    }
}
