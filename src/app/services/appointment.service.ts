import { Injectable, signal, computed } from '@angular/core';
import { Appointment, TimeSlot, PatientForAppointment } from '../models/appointment.model';

/**
 * AppointmentService - Service Mock pour la gestion des rendez-vous
 * 
 * Ce service gère les rendez-vous uniquement en mémoire (frontend).
 * Aucune API backend n'est appelée.
 * 
 * Fonctionnalités :
 * - Génération des créneaux horaires
 * - Gestion des rendez-vous (CRUD)
 * - Vérification des disponibilités
 */
@Injectable({
  providedIn: 'root'
})
export class AppointmentService {

  // Configuration du cabinet (mock)
  private readonly HEURE_DEBUT = 9;   // 09:00
  private readonly HEURE_FIN = 17;    // 17:00
  private readonly DUREE_CRENEAU = 30; // 30 minutes

  // Patients mock (synchronisé avec les données patients)
  private mockPatients = signal<PatientForAppointment[]>([
    { id: 1, nom: 'Benali', prenom: 'Ahmed', cin: 'AB123456' },
    { id: 2, nom: 'Zahrae', prenom: 'Fatima', cin: 'CD789012' },
    { id: 3, nom: 'Alami', prenom: 'Mohamed', cin: 'EF345678' },
    { id: 4, nom: 'Idrissi', prenom: 'Sara', cin: 'GH901234' },
    { id: 5, nom: 'Tazi', prenom: 'Youssef', cin: 'IJ567890' },
    { id: 6, nom: 'El Fassi', prenom: 'Amina', cin: 'KL123789' },
    { id: 7, nom: 'Bouazza', prenom: 'Karim', cin: 'MN456123' },
    { id: 8, nom: 'Senhaji', prenom: 'Leila', cin: 'OP789456' }
  ]);

  // Rendez-vous stockés en mémoire
  private appointments = signal<Appointment[]>([
    { 
      id: 1, 
      patientId: 1, 
      patientNom: 'Benali', 
      patientPrenom: 'Ahmed', 
      date: '2026-01-08', 
      heure: '09:00', 
      motif: 'Consultation générale', 
      status: 'confirmed' 
    },
    { 
      id: 2, 
      patientId: 2, 
      patientNom: 'Zahrae', 
      patientPrenom: 'Fatima', 
      date: '2026-01-08', 
      heure: '09:30', 
      motif: 'Suivi traitement', 
      status: 'confirmed' 
    },
    { 
      id: 3, 
      patientId: 3, 
      patientNom: 'Alami', 
      patientPrenom: 'Mohamed', 
      date: '2026-01-08', 
      heure: '10:30', 
      motif: 'Première visite', 
      status: 'pending' 
    },
    { 
      id: 4, 
      patientId: 4, 
      patientNom: 'Idrissi', 
      patientPrenom: 'Sara', 
      date: '2026-01-08', 
      heure: '14:00', 
      motif: 'Contrôle', 
      status: 'confirmed' 
    },
    { 
      id: 5, 
      patientId: 5, 
      patientNom: 'Tazi', 
      patientPrenom: 'Youssef', 
      date: '2026-01-09', 
      heure: '09:00', 
      motif: 'Consultation', 
      status: 'pending' 
    },
    { 
      id: 6, 
      patientId: 6, 
      patientNom: 'El Fassi', 
      patientPrenom: 'Amina', 
      date: '2026-01-09', 
      heure: '11:00', 
      motif: 'Suivi', 
      status: 'confirmed' 
    }
  ]);

  // Compteur pour les IDs
  private nextId = 7;

  /**
   * Récupère la liste des patients mock
   */
  getPatients(): PatientForAppointment[] {
    return this.mockPatients();
  }

  /**
   * Récupère un patient par son ID
   */
  getPatientById(id: number): PatientForAppointment | undefined {
    return this.mockPatients().find(p => p.id === id);
  }

  /**
   * Récupère tous les rendez-vous
   */
  getAllAppointments(): Appointment[] {
    return this.appointments();
  }

  /**
   * Récupère les rendez-vous pour une date donnée
   */
  getAppointmentsByDate(date: string): Appointment[] {
    return this.appointments().filter(apt => apt.date === date && apt.status !== 'cancelled');
  }

  /**
   * Génère tous les créneaux horaires pour une date donnée
   * avec indication de disponibilité
   */
  getTimeSlotsForDate(date: string): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const appointmentsForDate = this.getAppointmentsByDate(date);

    for (let hour = this.HEURE_DEBUT; hour < this.HEURE_FIN; hour++) {
      // Créneau à l'heure pile (ex: 09:00)
      const heure1 = `${hour.toString().padStart(2, '0')}:00`;
      const apt1 = appointmentsForDate.find(a => a.heure === heure1);
      slots.push({
        heure: heure1,
        isFree: !apt1,
        appointment: apt1
      });

      // Créneau à la demi-heure (ex: 09:30)
      const heure2 = `${hour.toString().padStart(2, '0')}:30`;
      const apt2 = appointmentsForDate.find(a => a.heure === heure2);
      slots.push({
        heure: heure2,
        isFree: !apt2,
        appointment: apt2
      });
    }

    return slots;
  }

  /**
   * Vérifie si un créneau est disponible
   */
  isSlotAvailable(date: string, heure: string, excludeAppointmentId?: number): boolean {
    const appointments = this.getAppointmentsByDate(date);
    return !appointments.some(apt => 
      apt.heure === heure && apt.id !== excludeAppointmentId
    );
  }

  /**
   * Crée un nouveau rendez-vous
   */
  createAppointment(
    patient: PatientForAppointment,
    date: string,
    heure: string,
    motif: string
  ): Appointment {
    const newAppointment: Appointment = {
      id: this.nextId++,
      patientId: patient.id,
      patientNom: patient.nom,
      patientPrenom: patient.prenom,
      date,
      heure,
      motif,
      status: 'pending'
    };

    this.appointments.update(apts => [...apts, newAppointment]);
    return newAppointment;
  }

  /**
   * Met à jour un rendez-vous existant
   */
  updateAppointment(
    id: number,
    updates: Partial<Pick<Appointment, 'date' | 'heure' | 'motif' | 'status'>>
  ): Appointment | null {
    let updatedApt: Appointment | null = null;
    
    this.appointments.update(apts => 
      apts.map(apt => {
        if (apt.id === id) {
          updatedApt = { ...apt, ...updates };
          return updatedApt;
        }
        return apt;
      })
    );

    return updatedApt;
  }

  /**
   * Annule un rendez-vous
   */
  cancelAppointment(id: number): void {
    this.appointments.update(apts =>
      apts.map(apt => 
        apt.id === id ? { ...apt, status: 'cancelled' as const } : apt
      )
    );
  }

  /**
   * Supprime définitivement un rendez-vous
   */
  deleteAppointment(id: number): void {
    this.appointments.update(apts => apts.filter(apt => apt.id !== id));
  }

  /**
   * Récupère un rendez-vous par son ID
   */
  getAppointmentById(id: number): Appointment | undefined {
    return this.appointments().find(apt => apt.id === id);
  }

  /**
   * Formate une date pour l'affichage
   */
  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  }

  /**
   * Retourne la date d'aujourd'hui au format YYYY-MM-DD
   */
  getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
}
