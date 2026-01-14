import { Component, signal, inject, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { PatientService } from '../../../services/patient.service';
import { AppointmentService } from '../../../services/appointment.service';
import { AuthService } from '../../../services/auth.service';
import { Patient, DossierMedical } from '../../../models/patient.model';
import { RendezVousResponse } from '../../../models/appointment.model';

interface WaitingPatient {
  id: number;              // ID du patient dans la base de données
  rdvId: number;           // ID du rendez-vous
  nom: string;
  prenom: string;
  heureArrivee: string;    // Heure du RDV
  motif: string;
  position: number;
  statut: string;          // Statut du RDV (EN_ATTENTE, CONFIRME, etc.)
}

/**
 * Données complètes du patient à envoyer au médecin
 */
interface PatientFullData {
  patient: Patient;
  dossierMedical: DossierMedical | null;
  historiqueConsultations: RendezVousResponse[];
}

@Component({
  selector: 'app-waiting-list',
  standalone: true,
  imports: [],
  templateUrl: './waiting-list.component.html'
})
export class WaitingListComponent implements OnInit {
  private patientService = inject(PatientService);
  private appointmentService = inject(AppointmentService);
  private authService = inject(AuthService);

  // ID du cabinet (extrait du token JWT)
  private cabinetId: number = 0;

  // Liste d'attente dynamique (RDV du jour)
  waitingPatients = signal<WaitingPatient[]>([]);

  // Cache des patients pour afficher les noms
  private patientsCache = new Map<number, Patient>();

  // État de chargement
  isLoading = signal(false);
  isLoadingList = signal(false);

  // Message d'erreur
  errorMessage = signal('');

  // Temps d'attente estimé par patient (en minutes)
  estimatedWaitTime = signal(15);

  // Date du jour
  today = this.appointmentService.getTodayDate();

  ngOnInit(): void {
    // Récupère l'ID du cabinet depuis le token JWT
    const cabinetId = this.authService.getCabinetId();
    if (cabinetId) {
      this.cabinetId = cabinetId;
      // Charge les RDV du jour
      this.loadTodayAppointments();
    }
  }

  /**
   * Charge les rendez-vous du jour et les transforme en liste d'attente
   */
  loadTodayAppointments(): void {
    this.isLoadingList.set(true);
    this.errorMessage.set('');

    // 1. Charger les RDV du jour pour ce cabinet
    this.appointmentService.getByCabinetAndDate(this.cabinetId, this.today).pipe(
      switchMap(appointments => {
        // Filtrer les RDV en attente ou confirmés (exclure annulés et terminés)
        const activeAppointments = appointments.filter(
          apt => apt.statut === 'EN_ATTENTE' || apt.statut === 'CONFIRME'
        );

        // Trier par heure
        activeAppointments.sort((a, b) => a.heureRdv.localeCompare(b.heureRdv));

        if (activeAppointments.length === 0) {
          return of({ appointments: [], patients: [] as Patient[] });
        }

        // 2. Récupérer les infos des patients pour chaque RDV
        const patientIds = [...new Set(activeAppointments.map(apt => apt.patientId))];
        const patientRequests = patientIds.map(id => 
          this.patientService.getById(id).pipe(
            catchError(() => of(null)) // Si un patient n'est pas trouvé, on continue
          )
        );

        return forkJoin(patientRequests).pipe(
          switchMap(patients => {
            // Stocker les patients dans le cache
            patients.forEach(p => {
              if (p) this.patientsCache.set(p.id, p);
            });
            return of({ 
              appointments: activeAppointments, 
              patients: patients.filter(p => p !== null) as Patient[] 
            });
          })
        );
      })
    ).subscribe({
      next: ({ appointments, patients }) => {
        // Transformer les RDV en WaitingPatient
        const waitingList: WaitingPatient[] = appointments.map((apt, index) => {
          const patient = this.patientsCache.get(apt.patientId);
          return {
            id: apt.patientId,
            rdvId: apt.idRendezVous,
            nom: patient?.nom || `Patient #${apt.patientId}`,
            prenom: patient?.prenom || '',
            heureArrivee: this.formatHeure(apt.heureRdv),
            motif: apt.motif,
            position: index + 1,
            statut: apt.statut
          };
        });

        this.waitingPatients.set(waitingList);
        this.isLoadingList.set(false);

        console.log(`✅ ${waitingList.length} patient(s) en attente pour aujourd'hui`);
      },
      error: (err) => {
        console.error('Erreur chargement RDV du jour:', err);
        this.errorMessage.set('Erreur lors du chargement des rendez-vous');
        this.isLoadingList.set(false);
      }
    });
  }

  /**
   * Formate l'heure du RDV pour l'affichage (HH:mm:ss -> HH:mm)
   */
  private formatHeure(heure: string): string {
    if (heure && heure.length >= 5) {
      return heure.substring(0, 5);
    }
    return heure;
  }

  /**
   * Envoie le patient au médecin
   * 
   * Cette méthode :
   * 1. Récupère les informations personnelles du patient
   * 2. Récupère le dossier médical du patient
   * 3. Récupère l'historique des consultations du patient
   * 4. Affiche toutes ces informations dans la console
   */
  sendToDoctor(patient: WaitingPatient): void {
    console.log('========================================');
    console.log('🏥 ENVOI DU PATIENT AU MÉDECIN');
    console.log('========================================');
    console.log('Patient sélectionné:', patient);

    this.isLoading.set(true);

    // Appels API en parallèle avec forkJoin
    forkJoin({
      patientInfo: this.patientService.getById(patient.id),
      dossierMedical: this.patientService.getDossierByPatientId(patient.id).pipe(
        catchError(() => of(null)) // Le dossier peut ne pas exister
      ),
      historiqueRdv: this.appointmentService.getPatientHistory(this.cabinetId, patient.id).pipe(
        catchError(() => of([])) // L'historique peut être vide
      )
    }).subscribe({
      next: (data) => {
        this.isLoading.set(false);

        // Affichage dans la console
        console.log('');
        console.log('📋 ====== INFORMATIONS PERSONNELLES ======');
        console.log('ID:', data.patientInfo.id);
        console.log('CIN:', data.patientInfo.cin);
        console.log('Nom complet:', data.patientInfo.prenom, data.patientInfo.nom);
        console.log('Date de naissance:', data.patientInfo.dateNaissance || 'Non renseignée');
        console.log('Sexe:', data.patientInfo.sexe || 'Non renseigné');
        console.log('Téléphone:', data.patientInfo.numTel || 'Non renseigné');
        console.log('Mutuelle:', data.patientInfo.typeMutuelle || 'Aucune');
        console.log('Cabinet ID:', data.patientInfo.cabinetId);

        console.log('');
        console.log('🩺 ====== DOSSIER MÉDICAL ======');
        if (data.dossierMedical) {
          console.log('ID Dossier:', data.dossierMedical.idDossier);
          console.log('Date de création:', data.dossierMedical.dateCreation || 'Non renseignée');
          console.log('Antécédents médicaux:', data.dossierMedical.antecedentsMedicaux || 'Aucun');
          console.log('Antécédents chirurgicaux:', data.dossierMedical.antecedentsChirurgicaux || 'Aucun');
          console.log('Allergies:', data.dossierMedical.allergies || 'Aucune');
          console.log('Traitements en cours:', data.dossierMedical.traitements || 'Aucun');
          console.log('Habitudes:', data.dossierMedical.habitudes || 'Non renseignées');
          console.log('Documents médicaux:', data.dossierMedical.documentsMedicaux || 'Aucun');
        } else {
          console.log('⚠️ Aucun dossier médical trouvé pour ce patient');
        }

        console.log('');
        console.log('📅 ====== HISTORIQUE DES CONSULTATIONS ======');
        if (data.historiqueRdv && data.historiqueRdv.length > 0) {
          console.log(`Nombre de consultations: ${data.historiqueRdv.length}`);
          console.log('---');
          data.historiqueRdv.forEach((rdv, index) => {
            console.log(`Consultation #${index + 1}:`);
            console.log(`  - Date: ${rdv.dateRdv}`);
            console.log(`  - Heure: ${rdv.heureRdv}`);
            console.log(`  - Motif: ${rdv.motif}`);
            console.log(`  - Statut: ${rdv.statut}`);
            console.log(`  - Notes: ${rdv.notes || 'Aucune'}`);
            console.log('---');
          });
        } else {
          console.log('⚠️ Aucune consultation antérieure pour ce patient');
        }

        console.log('');
        console.log('========================================');
        console.log('✅ DONNÉES PRÊTES À ÊTRE ENVOYÉES AU MÉDECIN');
        console.log('========================================');

        // Stockage des données complètes (pour utilisation future)
        const fullPatientData: PatientFullData = {
          patient: data.patientInfo,
          dossierMedical: data.dossierMedical,
          historiqueConsultations: data.historiqueRdv
        };
        console.log('Objet complet:', fullPatientData);

        // TODO: Retirer le patient de la liste d'attente après envoi
        // this.removeFromWaitingList(patient);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('❌ Erreur lors de la récupération des données:', err);
        
        // Afficher des détails sur l'erreur
        if (err.status === 404) {
          console.error('Patient ou dossier non trouvé dans la base de données');
        } else if (err.status === 403) {
          console.error('Accès non autorisé - Vérifiez le token JWT');
        } else if (err.status === 0) {
          console.error('Erreur réseau - Le serveur est peut-être indisponible');
        }
      }
    });
  }

  removeFromList(patient: WaitingPatient): void {
    console.log('Retirer de la liste:', patient);
    // Retire le patient de la liste localement
    this.waitingPatients.update(patients => 
      patients.filter(p => p.rdvId !== patient.rdvId).map((p, index) => ({
        ...p,
        position: index + 1
      }))
    );
  }

  /**
   * Rafraîchit la liste d'attente
   */
  refreshList(): void {
    this.loadTodayAppointments();
  }

  getEstimatedTime(position: number): string {
    const minutes = position * this.estimatedWaitTime();
    if (minutes < 60) {
      return `~${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `~${hours}h${remainingMinutes > 0 ? remainingMinutes : ''}`;
  }
}
