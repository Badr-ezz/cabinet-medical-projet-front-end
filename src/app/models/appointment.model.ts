/**
 * Appointment Model - Modèles pour la gestion des rendez-vous (Mock)
 * 
 * Ces modèles sont utilisés uniquement côté frontend pour l'UI/UX.
 * Aucune API backend n'est appelée.
 */

/**
 * Interface Rendez-vous
 */
export interface Appointment {
  id: number;
  patientId: number;
  patientNom: string;
  patientPrenom: string;
  date: string;       // Format: YYYY-MM-DD
  heure: string;      // Format: HH:mm
  motif: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

/**
 * Interface Créneau horaire
 */
export interface TimeSlot {
  heure: string;
  isFree: boolean;
  appointment?: Appointment;
}

/**
 * Interface Patient simplifié pour les rendez-vous
 */
export interface PatientForAppointment {
  id: number;
  nom: string;
  prenom: string;
  cin: string;
}
