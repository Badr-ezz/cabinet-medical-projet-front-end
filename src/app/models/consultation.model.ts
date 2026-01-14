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
    medecinId: number;
    rendezVousId?: number;
    dateConsultation: string;
    type: string;
    diagnostic: string;
    examenClinique?: string;        // Added
    examenSupplementaire?: string;  // Added
    observations?: string;
    ordonnances?: Ordonnance[];     // Added (Backend returns list of Ordonnances)
    createdAt?: string;
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
