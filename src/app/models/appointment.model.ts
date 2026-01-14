/**
 * Appointment Model - Modèles pour la gestion des rendez-vous
 * 
 * Ces modèles correspondent aux DTOs de l'API rendezvous-service (port 8083)
 */

/**
 * Statuts possibles pour un rendez-vous
 */
export type StatutRDV = 'EN_ATTENTE' | 'CONFIRME' | 'ANNULE' | 'EN_COURS' | 'TERMINE';

/**
 * Interface pour créer/mettre à jour un rendez-vous (Request DTO)
 */
export interface RendezVousRequest {
  dateRdv: string;        // Format: "YYYY-MM-DD"
  heureRdv: string;       // Format: "HH:mm:ss"
  motif: string;
  statut: StatutRDV;
  notes?: string;
  medecinId?: number;
  patientId?: number;
  cabinetId?: number;
}

/**
 * Interface pour la réponse de l'API (Response DTO)
 */
export interface RendezVousResponse {
  idRendezVous: number;
  dateRdv: string;        // Format: "YYYY-MM-DD"
  heureRdv: string;       // Format: "HH:mm:ss"
  motif: string;
  statut: StatutRDV;
  notes: string | null;
  medecinId: number;
  patientId: number;
  cabinetId: number;
}

/**
 * Interface Créneau horaire pour l'affichage agenda
 */
export interface TimeSlot {
  heure: string;          // Format: "HH:mm"
  isFree: boolean;
  appointment?: RendezVousResponse;
}

/**
 * Interface Patient simplifié pour les rendez-vous
 * (utilisé pour le dropdown de sélection)
 */
export interface PatientForAppointment {
  id: number;
  nom: string;
  prenom: string;
  cin: string;
}
