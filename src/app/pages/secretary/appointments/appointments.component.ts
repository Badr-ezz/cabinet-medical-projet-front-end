import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AppointmentService } from '../../../services/appointment.service';
import { Appointment, TimeSlot, PatientForAppointment } from '../../../models/appointment.model';

/**
 * AppointmentsComponent - Vue Agenda Journalier
 * 
 * Affiche les créneaux horaires d'une journée avec :
 * - Créneaux libres (cliquables pour prendre RDV)
 * - Créneaux occupés (avec nom du patient, cliquables pour modifier)
 * 
 * Fonctionnalités :
 * - Sélecteur de date
 * - Modal pour créer un RDV
 * - Modal pour modifier/annuler un RDV
 */
@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './appointments.component.html'
})
export class AppointmentsComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private route = inject(ActivatedRoute);

  // Date sélectionnée (par défaut: aujourd'hui)
  selectedDate = signal(this.appointmentService.getTodayDate());

  // Modals
  isCreateModalOpen = signal(false);
  isEditModalOpen = signal(false);

  // Patient pré-sélectionné (depuis la page patients)
  preselectedPatient = signal<PatientForAppointment | null>(null);

  // Créneau sélectionné pour création
  selectedSlot = signal<TimeSlot | null>(null);

  // RDV sélectionné pour modification
  selectedAppointment = signal<Appointment | null>(null);

  // Formulaire création
  createForm = signal({
    patientId: 0,
    motif: ''
  });

  // Formulaire modification
  editForm = signal({
    heure: '',
    motif: '',
    status: '' as 'confirmed' | 'pending' | 'cancelled'
  });

  // Messages
  successMessage = signal('');

  // Créneaux horaires pour la date sélectionnée
  timeSlots = computed(() => {
    return this.appointmentService.getTimeSlotsForDate(this.selectedDate());
  });

  // Liste des patients (mock)
  patients = computed(() => {
    return this.appointmentService.getPatients();
  });

  // Statistiques du jour
  stats = computed(() => {
    const slots = this.timeSlots();
    const total = slots.length;
    const occupied = slots.filter(s => !s.isFree).length;
    const free = slots.filter(s => s.isFree).length;
    return { total, occupied, free };
  });

  ngOnInit(): void {
    // Vérifie si un patient est pré-sélectionné via les query params
    this.route.queryParams.subscribe(params => {
      if (params['patientId']) {
        const patient = this.patients().find(p => p.id === +params['patientId']);
        if (patient) {
          this.preselectedPatient.set(patient);
        }
      }
      if (params['date']) {
        this.selectedDate.set(params['date']);
      }
    });
  }

  /**
   * Change la date sélectionnée
   */
  onDateChange(date: string): void {
    this.selectedDate.set(date);
  }

  /**
   * Navigue au jour précédent
   */
  previousDay(): void {
    const current = new Date(this.selectedDate());
    current.setDate(current.getDate() - 1);
    this.selectedDate.set(current.toISOString().split('T')[0]);
  }

  /**
   * Navigue au jour suivant
   */
  nextDay(): void {
    const current = new Date(this.selectedDate());
    current.setDate(current.getDate() + 1);
    this.selectedDate.set(current.toISOString().split('T')[0]);
  }

  /**
   * Revient à aujourd'hui
   */
  goToToday(): void {
    this.selectedDate.set(this.appointmentService.getTodayDate());
  }

  /**
   * Ouvre le modal de création pour un créneau libre
   */
  openCreateModal(slot: TimeSlot): void {
    if (!slot.isFree) return;
    
    this.selectedSlot.set(slot);
    
    // Si un patient est pré-sélectionné, on le met dans le formulaire
    const preselected = this.preselectedPatient();
    this.createForm.set({
      patientId: preselected ? preselected.id : 0,
      motif: ''
    });
    
    this.isCreateModalOpen.set(true);
  }

  /**
   * Ferme le modal de création
   */
  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
    this.selectedSlot.set(null);
  }

  /**
   * Crée un nouveau rendez-vous
   */
  createAppointment(): void {
    const slot = this.selectedSlot();
    const form = this.createForm();
    
    if (!slot || !form.patientId || !form.motif) return;
    
    const patient = this.patients().find(p => p.id === form.patientId);
    if (!patient) return;

    this.appointmentService.createAppointment(
      patient,
      this.selectedDate(),
      slot.heure,
      form.motif
    );

    this.showSuccess('Rendez-vous créé avec succès');
    this.closeCreateModal();
    
    // Réinitialise le patient pré-sélectionné après création
    this.preselectedPatient.set(null);
  }

  /**
   * Ouvre le modal de modification pour un RDV existant
   */
  openEditModal(appointment: Appointment): void {
    this.selectedAppointment.set(appointment);
    this.editForm.set({
      heure: appointment.heure,
      motif: appointment.motif,
      status: appointment.status
    });
    this.isEditModalOpen.set(true);
  }

  /**
   * Ferme le modal de modification
   */
  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.selectedAppointment.set(null);
  }

  /**
   * Met à jour un rendez-vous
   */
  updateAppointment(): void {
    const apt = this.selectedAppointment();
    const form = this.editForm();
    
    if (!apt) return;

    // Vérifie si le nouveau créneau est disponible
    if (form.heure !== apt.heure) {
      if (!this.appointmentService.isSlotAvailable(this.selectedDate(), form.heure, apt.id)) {
        alert('Ce créneau est déjà occupé');
        return;
      }
    }

    this.appointmentService.updateAppointment(apt.id, {
      heure: form.heure,
      motif: form.motif,
      status: form.status
    });

    this.showSuccess('Rendez-vous modifié avec succès');
    this.closeEditModal();
  }

  /**
   * Annule un rendez-vous
   */
  cancelAppointment(): void {
    const apt = this.selectedAppointment();
    if (!apt) return;

    if (confirm(`Êtes-vous sûr de vouloir annuler le rendez-vous de ${apt.patientPrenom} ${apt.patientNom} ?`)) {
      this.appointmentService.cancelAppointment(apt.id);
      this.showSuccess('Rendez-vous annulé');
      this.closeEditModal();
    }
  }

  /**
   * Récupère les créneaux libres pour la modification
   */
  getAvailableSlots(): string[] {
    const apt = this.selectedAppointment();
    const slots = this.timeSlots();
    
    return slots
      .filter(s => s.isFree || (apt && s.appointment?.id === apt.id))
      .map(s => s.heure);
  }

  /**
   * Formate la date pour l'affichage
   */
  formatDate(dateStr: string): string {
    return this.appointmentService.formatDate(dateStr);
  }

  /**
   * Retourne la classe CSS pour le statut
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Retourne le libellé du statut
   */
  getStatusLabel(status: string): string {
    switch (status) {
      case 'confirmed': return 'Confirmé';
      case 'pending': return 'En attente';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  }

  /**
   * Affiche un message de succès temporaire
   */
  private showSuccess(message: string): void {
    this.successMessage.set(message);
    setTimeout(() => this.successMessage.set(''), 3000);
  }

  // ===== Méthodes pour mettre à jour les formulaires (évite les arrow functions dans le template) =====

  updateCreatePatientId(patientId: string): void {
    this.createForm.update(f => ({ ...f, patientId: +patientId }));
  }

  updateCreateMotif(motif: string): void {
    this.createForm.update(f => ({ ...f, motif }));
  }

  updateEditHeure(heure: string): void {
    this.editForm.update(f => ({ ...f, heure }));
  }

  updateEditMotif(motif: string): void {
    this.editForm.update(f => ({ ...f, motif }));
  }

  updateEditStatus(status: string): void {
    this.editForm.update(f => ({ ...f, status: status as 'confirmed' | 'pending' | 'cancelled' }));
  }
}
