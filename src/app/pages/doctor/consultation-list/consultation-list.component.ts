import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ConsultationService } from '../../../services/consultation.service';
import { AuthService } from '../../../services/auth.service';
import { Consultation } from '../../../models/consultation.model';
import { PatientService } from '../../../services/patient.service';
import { Patient } from '../../../models/patient.model';

@Component({
  selector: 'app-consultation-list',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="bg-white rounded-lg shadow-sm">
      <div class="p-6 border-b border-gray-200">
        <h2 class="text-xl font-bold text-gray-800">Historique des Consultations</h2>
        <p class="text-gray-500 text-sm mt-1">Liste de toutes les consultations effectuées</p>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
              <th class="px-6 py-4 font-semibold">Date</th>
              <th class="px-6 py-4 font-semibold">Patient</th>
              <th class="px-6 py-4 font-semibold">Type</th>
              <th class="px-6 py-4 font-semibold">Diagnostic</th>
              <th class="px-6 py-4 font-semibold">Status</th>
              <th class="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @for (consultation of consultations(); track consultation.id) {
              <tr class="hover:bg-gray-50 transition-colors duration-150">
                <td class="px-6 py-4 text-sm text-gray-700">
                  {{ (consultation.createdAt || consultation.dateConsultation) | date:'dd/MM/yyyy HH:mm' }}
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center">
                    <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs mr-3">
                      {{ getPatientInitials(consultation.patientId) }}
                    </div>
                    <div>
                      <div class="text-sm font-medium text-gray-900">{{ getPatientName(consultation.patientId) }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-700">
                  <span class="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {{ consultation.type }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                  {{ consultation.diagnostic || '-' }}
                </td>
                <td class="px-6 py-4">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Terminé
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <button (click)="viewDetails(consultation.id!)" class="text-blue-600 hover:text-blue-800 text-sm font-medium">Détails</button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="px-6 py-10 text-center text-gray-500">
                  Aucune consultation trouvée
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class ConsultationListComponent implements OnInit {
  private consultationService = inject(ConsultationService);
  private patientService = inject(PatientService);
  private authService = inject(AuthService);
  private router = inject(Router);

  consultations = signal<Consultation[]>([]);
  patients = signal<Map<number, Patient>>(new Map());

  viewDetails(consultationId: number) {
    this.router.navigate(['/doctor/consultation'], { queryParams: { id: consultationId } });
  }


  ngOnInit() {
    this.loadData();
  }

  loadData() {
    const user = this.authService.getUser();
    if (!user) return;

    // 1. Load Patients for name mapping
    this.patientService.getAll().subscribe(patients => {
      const patientMap = new Map<number, Patient>();
      patients.forEach(p => patientMap.set(p.id!, p));
      this.patients.set(patientMap);

      // 2. Load Consultations
      this.consultationService.getByMedecinId(user.id).subscribe({
        next: (data) => {
          this.consultations.set(data);
        },
        error: (err) => console.error('Error loading consultations', err)
      });
    });
  }

  getPatientName(patientId: number): string {
    const patient = this.patients().get(patientId);
    return patient ? `${patient.nom} ${patient.prenom}` : `Patient #${patientId}`;
  }

  getPatientInitials(patientId: number): string {
    const patient = this.patients().get(patientId);
    if (!patient) return '?';
    return (patient.nom.charAt(0) + patient.prenom.charAt(0)).toUpperCase();
  }
}
