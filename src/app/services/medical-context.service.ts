import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class MedicalContextService {
    // Signal to hold the ID of the patient currently being consulted/viewed
    activePatientId = signal<number | null>(null);

    setPatientId(id: number) {
        this.activePatientId.set(id);
    }

    getPatientId() {
        return this.activePatientId();
    }

    clearContext() {
        this.activePatientId.set(null);
    }
}
