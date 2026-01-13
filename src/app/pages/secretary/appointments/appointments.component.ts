import { Component, signal, computed, inject, OnInit, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AppointmentService } from '../../../services/appointment.service';
import { PatientService } from '../../../services/patient.service';
import { AuthService } from '../../../services/auth.service';
import { RendezVousResponse, RendezVousRequest, TimeSlot, PatientForAppointment, StatutRDV } from '../../../models/appointment.model';
import { Patient } from '../../../models/patient.model';

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
 * - Intégration avec l'API rendezvous-service (port 8083)
 */
@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './appointments.component.html'
})
export class AppointmentsComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private patientService = inject(PatientService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  // ID du cabinet (extrait du token JWT)
  cabinetId = signal<number>(0);

  // Date sélectionnée (par défaut: aujourd'hui)
  selectedDate = signal(this.appointmentService.getTodayDate());

  // Modals
  isCreateModalOpen = signal(false);
  isEditModalOpen = signal(false);

  // Loading states
  isLoading = signal(false);
  isSubmitting = signal(false);

  // Patient pré-sélectionné (depuis la page patients)
  preselectedPatient = signal<PatientForAppointment | null>(null);

  // Créneau sélectionné pour création
  selectedSlot = signal<TimeSlot | null>(null);

  // RDV sélectionné pour modification
  selectedAppointment = signal<RendezVousResponse | null>(null);

  // Rendez-vous du jour (depuis l'API)
  appointments = signal<RendezVousResponse[]>([]);

  // Patients du cabinet (depuis l'API)
  patients = signal<PatientForAppointment[]>([]);

  // Formulaire création
  createForm = signal({
    patientId: 0,
    motif: '',
    notes: ''
  });

  // Formulaire modification
  editForm = signal({
    heure: '',
    motif: '',
    notes: '',
    statut: 'EN_ATTENTE' as StatutRDV
  });

  // Messages
  successMessage = signal('');
  errorMessage = signal('');

  // Créneaux horaires calculés à partir des RDV
  timeSlots = computed(() => {
    return this.appointmentService.generateTimeSlots(this.appointments());
  });

  // Statistiques du jour
  stats = computed(() => {
    const slots = this.timeSlots();
    const total = slots.length;
    const occupied = slots.filter(s => !s.isFree).length;
    const free = slots.filter(s => s.isFree).length;
    return { total, occupied, free };
  });

  constructor() {
    // Effet pour recharger les RDV quand la date change
    effect(() => {
      const date = this.selectedDate();
      const cabinet = this.cabinetId();
      if (cabinet > 0) {
        this.loadAppointments();
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    // Récupère l'ID du cabinet depuis le token
    const cabinetId = this.authService.getCabinetId();
    if (cabinetId) {
      this.cabinetId.set(cabinetId);
    }

    // Charge les patients du cabinet
    this.loadPatients();

    // Vérifie si un patient est pré-sélectionné via les query params
    this.route.queryParams.subscribe(params => {
      if (params['patientId']) {
        const patientId = +params['patientId'];
        // On cherche le patient une fois la liste chargée
        const patient = this.patients().find(p => p.id === patientId);
        if (patient) {
          this.preselectedPatient.set(patient);
        } else {
          // Si pas encore chargé, on attend
          this.patientService.getById(patientId).subscribe({
            next: (p) => {
              this.preselectedPatient.set({
                id: p.id,
                nom: p.nom,
                prenom: p.prenom,
                cin: p.cin
              });
            }
          });
        }
      }
      if (params['date']) {
        this.selectedDate.set(params['date']);
      }
    });
  }

  /**
   * Charge les patients du cabinet
   */
  private loadPatients(): void {
    const cabinetId = this.authService.getCabinetId();
    if (!cabinetId) return;

    this.patientService.getByCabinetId(cabinetId).subscribe({
      next: (patients) => {
        this.patients.set(patients.map(p => ({
          id: p.id,
          nom: p.nom,
          prenom: p.prenom,
          cin: p.cin
        })));
      },
      error: (err) => {
        console.error('Erreur chargement patients:', err);
      }
    });
  }

  /**
   * Charge les rendez-vous pour la date sélectionnée
   */
  loadAppointments(): void {
    const cabinetId = this.cabinetId();
    const date = this.selectedDate();
    
    if (!cabinetId) return;

    this.isLoading.set(true);
    this.appointmentService.getByCabinetAndDate(cabinetId, date).subscribe({
      next: (appointments) => {
        this.appointments.set(appointments);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement RDV:', err);
        this.showError('Erreur lors du chargement des rendez-vous');
        this.isLoading.set(false);
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
      motif: '',
      notes: ''
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
   * Crée un nouveau rendez-vous via l'API
   */
  createAppointment(): void {
    const slot = this.selectedSlot();
    const form = this.createForm();
    
    if (!slot || !form.patientId || !form.motif) {
      this.showError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const request: RendezVousRequest = {
      dateRdv: this.selectedDate(),
      heureRdv: this.appointmentService.formatHeureForApi(slot.heure),
      motif: form.motif,
      statut: 'EN_ATTENTE',
      notes: form.notes || undefined,
      patientId: form.patientId,
      cabinetId: this.cabinetId()
    };

    this.isSubmitting.set(true);
    this.appointmentService.create(request).subscribe({
      next: () => {
        this.showSuccess('Rendez-vous créé avec succès');
        this.closeCreateModal();
        this.loadAppointments(); // Recharge la liste
        this.preselectedPatient.set(null);
        this.isSubmitting.set(false);
      },
      error: (err) => {
        console.error('Erreur création RDV:', err);
        this.showError('Erreur lors de la création du rendez-vous');
        this.isSubmitting.set(false);
      }
    });
  }

  /**
   * Ouvre le modal de modification pour un RDV existant
   */
  openEditModal(appointment: RendezVousResponse): void {
    this.selectedAppointment.set(appointment);
    this.editForm.set({
      heure: this.appointmentService.formatHeureForSlot(appointment.heureRdv),
      motif: appointment.motif,
      notes: appointment.notes || '',
      statut: appointment.statut
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
   * Met à jour un rendez-vous via l'API
   */
  updateAppointment(): void {
    const apt = this.selectedAppointment();
    const form = this.editForm();
    
    if (!apt) return;

    // Vérifie si le nouveau créneau est disponible
    if (form.heure !== this.appointmentService.formatHeureForSlot(apt.heureRdv)) {
      if (!this.appointmentService.isSlotAvailable(this.appointments(), form.heure, apt.idRendezVous)) {
        this.showError('Ce créneau est déjà occupé');
        return;
      }
    }

    const request: RendezVousRequest = {
      dateRdv: apt.dateRdv,
      heureRdv: this.appointmentService.formatHeureForApi(form.heure),
      motif: form.motif,
      statut: form.statut,
      notes: form.notes || undefined,
      patientId: apt.patientId,
      medecinId: apt.medecinId,
      cabinetId: apt.cabinetId
    };

    this.isSubmitting.set(true);
    this.appointmentService.update(apt.idRendezVous, request).subscribe({
      next: () => {
        this.showSuccess('Rendez-vous modifié avec succès');
        this.closeEditModal();
        this.loadAppointments();
        this.isSubmitting.set(false);
      },
      error: (err) => {
        console.error('Erreur modification RDV:', err);
        this.showError('Erreur lors de la modification du rendez-vous');
        this.isSubmitting.set(false);
      }
    });
  }

  /**
   * Annule un rendez-vous via l'API
   */
  cancelAppointment(): void {
    const apt = this.selectedAppointment();
    if (!apt) return;

    const patient = this.patients().find(p => p.id === apt.patientId);
    const patientName = patient ? `${patient.prenom} ${patient.nom}` : `Patient #${apt.patientId}`;

    if (confirm(`Êtes-vous sûr de vouloir annuler le rendez-vous de ${patientName} ?`)) {
      this.isSubmitting.set(true);
      this.appointmentService.cancel(apt.idRendezVous).subscribe({
        next: () => {
          this.showSuccess('Rendez-vous annulé');
          this.closeEditModal();
          this.loadAppointments();
          this.isSubmitting.set(false);
        },
        error: (err) => {
          console.error('Erreur annulation RDV:', err);
          this.showError('Erreur lors de l\'annulation du rendez-vous');
          this.isSubmitting.set(false);
        }
      });
    }
  }

  /**
   * Supprime définitivement un rendez-vous (ADMIN uniquement)
   */
  deleteAppointment(): void {
    const apt = this.selectedAppointment();
    if (!apt) return;

    if (confirm('Êtes-vous sûr de vouloir supprimer définitivement ce rendez-vous ?')) {
      this.isSubmitting.set(true);
      this.appointmentService.delete(apt.idRendezVous).subscribe({
        next: () => {
          this.showSuccess('Rendez-vous supprimé');
          this.closeEditModal();
          this.loadAppointments();
          this.isSubmitting.set(false);
        },
        error: (err) => {
          console.error('Erreur suppression RDV:', err);
          this.showError('Erreur lors de la suppression du rendez-vous');
          this.isSubmitting.set(false);
        }
      });
    }
  }

  /**
   * Récupère les créneaux libres pour la modification
   */
  getAvailableSlots(): string[] {
    const apt = this.selectedAppointment();
    const slots = this.timeSlots();
    
    return slots
      .filter(s => s.isFree || (apt && s.appointment?.idRendezVous === apt.idRendezVous))
      .map(s => s.heure);
  }

  /**
   * Récupère le nom du patient pour un RDV
   */
  getPatientName(patientId: number): string {
    const patient = this.patients().find(p => p.id === patientId);
    return patient ? `${patient.prenom} ${patient.nom}` : `Patient #${patientId}`;
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
  getStatusClass(statut: string): string {
    return this.appointmentService.getStatutClass(statut);
  }

  /**
   * Retourne le libellé du statut
   */
  getStatusLabel(statut: string): string {
    return this.appointmentService.getStatutLabel(statut);
  }

  /**
   * Affiche un message de succès temporaire
   */
  private showSuccess(message: string): void {
    this.successMessage.set(message);
    this.errorMessage.set('');
    setTimeout(() => this.successMessage.set(''), 3000);
  }

  /**
   * Affiche un message d'erreur temporaire
   */
  private showError(message: string): void {
    this.errorMessage.set(message);
    this.successMessage.set('');
    setTimeout(() => this.errorMessage.set(''), 5000);
  }

  // ===== Méthodes pour mettre à jour les formulaires =====

  updateCreatePatientId(patientId: string): void {
    this.createForm.update(f => ({ ...f, patientId: +patientId }));
  }

  updateCreateMotif(motif: string): void {
    this.createForm.update(f => ({ ...f, motif }));
  }

  updateCreateNotes(notes: string): void {
    this.createForm.update(f => ({ ...f, notes }));
  }

  updateEditHeure(heure: string): void {
    this.editForm.update(f => ({ ...f, heure }));
  }

  updateEditMotif(motif: string): void {
    this.editForm.update(f => ({ ...f, motif }));
  }

  updateEditNotes(notes: string): void {
    this.editForm.update(f => ({ ...f, notes }));
  }

  updateEditStatut(statut: string): void {
    this.editForm.update(f => ({ ...f, statut: statut as StatutRDV }));
  }
}
