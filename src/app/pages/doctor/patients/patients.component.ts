import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PatientService } from '../../../services/patient.service';
import { AuthService } from '../../../services/auth.service';
import { Patient } from '../../../models/patient.model';
import { MedicalContextService } from '../../../services/medical-context.service';

interface PatientView {
  id: number;
  cin: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  telephone: string;
  dernierVisite: string;
}

@Component({
  selector: 'app-doctor-patients',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule], // CommonModule for @for, @if
  templateUrl: './patients.component.html'
})
export class DoctorPatientsComponent implements OnInit {
  private patientService = inject(PatientService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private contextService = inject(MedicalContextService);

  searchCIN = signal('');
  searchNom = signal('');

  // Initialize with empty list
  patients = signal<PatientView[]>([]);

  filteredPatients = computed(() => {
    return this.patients();
  });

  ngOnInit() {
    this.loadAllPatients();
  }

  loadAllPatients() {
    const user = this.authService.getUser();
    if (!user) return;
    const cabinetId = user.cabinetId || 1;

    this.patientService.getByCabinetId(cabinetId).subscribe({
      next: (data: Patient[]) => {
        this.mapAndSetPatients(data);
      },
      error: (err) => console.error('Error loading patients', err)
    });
  }

  onSearch() {
    const nom = this.searchNom();
    const cin = this.searchCIN();

    if (cin) {
      this.patientService.getByCin(cin).subscribe({
        next: (p) => this.mapAndSetPatients([p]),
        error: () => this.patients.set([])
      });
    } else if (nom) {
      this.patientService.searchByNom(nom).subscribe({
        next: (data) => this.mapAndSetPatients(data),
        error: () => this.patients.set([])
      });
    } else {
      this.loadAllPatients();
    }
  }

  clearSearch() {
    this.searchCIN.set('');
    this.searchNom.set('');
    this.loadAllPatients();
  }

  navigateToDossier(patientId: number) {
    console.log('Navigating to dossier for:', patientId);
    this.contextService.setPatientId(patientId);
    this.router.navigate(['/doctor/medical-record', patientId]);
  }

  navigateToProfile(patientId: number) {
    console.log('Navigating to profile for:', patientId);
    this.contextService.setPatientId(patientId);
    this.router.navigate(['/doctor/patient', patientId]);
  }

  private mapAndSetPatients(data: Patient[]) {
    const mapped: PatientView[] = data.map(p => ({
      id: p.id,
      cin: p.cin,
      nom: p.nom,
      prenom: p.prenom,
      dateNaissance: p.dateNaissance || '',
      telephone: p.numTel || '',
      dernierVisite: '...'
    }));
    this.patients.set(mapped);
  }
}
