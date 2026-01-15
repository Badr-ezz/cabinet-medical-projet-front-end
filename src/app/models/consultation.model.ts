export interface Medicament {
    nom: string;
    dosage?: string;
    duree?: string;
    description?: string;
}

export interface Ordonnance {
    id?: number;
    type: string;
    medicaments: Medicament[];
}

export interface Consultation {
    id: number;
    patientId: number;
    rendezVousId?: number;
    medecinId: number;
    type: string;
    dateConsultation: string; // LocalDate from backend
    createdAt?: string;  // LocalDateTime from backend - actual date/time of consultation
    diagnostic: string;
    examenClinique?: string;
    examenSupplementaire?: string;
    observations?: string;
    ordonnances?: Ordonnance[];
}

export interface ConsultationRequest {
    patientId: number;
    medecinId: number;
    rendezVousId?: number;
    type?: string;
    dateConsultation: string;
    examenClinique?: string;
    examenSupplementaire?: string;
    diagnostic?: string;
    observations?: string;
    medicaments?: Medicament[];
}
