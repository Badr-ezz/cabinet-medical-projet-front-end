import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillingService } from '../../../services/billing.service';
import { AuthService } from '../../../services/auth.service';
import { FactureWithPatient, ModePaiement, PaiementRequest } from '../../../models/facture.model';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './billing.component.html'
})
export class BillingComponent implements OnInit {
  
  private billingService = inject(BillingService);
  private authService = inject(AuthService);

  // État du composant
  isLoading = signal(true);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  
  // Données
  factures = signal<FactureWithPatient[]>([]);
  
  // Statistiques calculées
  totalPaid = computed(() => {
    return this.factures()
      .filter(f => f.statut === 'PAYEE')
      .reduce((sum, f) => sum + (f.montant || 0), 0);
  });
  
  totalPending = computed(() => {
    return this.factures()
      .filter(f => f.statut === 'EN_ATTENTE')
      .reduce((sum, f) => sum + (f.montant || 0), 0);
  });
  
  invoiceCount = computed(() => this.factures().length);

  // Modal de paiement
  showPaymentModal = signal(false);
  selectedFacture = signal<FactureWithPatient | null>(null);
  paymentAmount = signal(0);
  paymentMode = signal<ModePaiement>('ESPECES');
  isProcessingPayment = signal(false);

  // Filtres
  statusFilter = signal<string>('all');
  searchQuery = signal('');

  // Factures filtrées
  filteredFactures = computed(() => {
    let result = this.factures();
    
    // Filtre par statut
    if (this.statusFilter() !== 'all') {
      result = result.filter(f => f.statut === this.statusFilter());
    }
    
    // Filtre par recherche (nom patient ou numéro facture)
    const query = this.searchQuery().toLowerCase();
    if (query) {
      result = result.filter(f => 
        f.patientNom?.toLowerCase().includes(query) ||
        f.patientPrenom?.toLowerCase().includes(query) ||
        f.numeroFacture?.toLowerCase().includes(query)
      );
    }
    
    return result;
  });

  ngOnInit(): void {
    this.loadFactures();
  }

  /**
   * Charge les factures depuis le backend
   */
  loadFactures(): void {
    this.isLoading.set(true);
    this.error.set(null);
    
    const cabinetId = this.authService.getCabinetId();
    
    if (!cabinetId) {
      this.error.set('Cabinet non trouvé. Veuillez vous reconnecter.');
      this.isLoading.set(false);
      return;
    }

    this.billingService.getByCabinetIdWithPatients(cabinetId).subscribe({
      next: (factures) => {
        // Trier par date décroissante
        const sorted = factures.sort((a, b) => 
          new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
        );
        this.factures.set(sorted);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des factures:', err);
        this.error.set('Impossible de charger les factures. Vérifiez votre connexion.');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Ouvre le modal de paiement
   */
  openPaymentModal(facture: FactureWithPatient): void {
    this.selectedFacture.set(facture);
    this.paymentAmount.set(facture.montant);
    this.paymentMode.set('ESPECES');
    this.showPaymentModal.set(true);
  }

  /**
   * Ferme le modal de paiement
   */
  closePaymentModal(): void {
    this.showPaymentModal.set(false);
    this.selectedFacture.set(null);
    this.paymentAmount.set(0);
  }

  /**
   * Valide le paiement
   */
  validatePayment(): void {
    const facture = this.selectedFacture();
    if (!facture) return;

    this.isProcessingPayment.set(true);

    const paiement: PaiementRequest = {
      montant: this.paymentAmount(),
      modePaiement: this.paymentMode()
    };

    this.billingService.validatePayment(facture.idFacture, paiement).subscribe({
      next: (updatedFacture) => {
        if (updatedFacture) {
          // Mettre à jour la liste locale
          const currentFactures = this.factures();
          const updatedList = currentFactures.map(f => 
            f.idFacture === facture.idFacture 
              ? { ...f, ...updatedFacture, statut: 'PAYEE' as const }
              : f
          );
          this.factures.set(updatedList);
          this.closePaymentModal();
        } else {
          this.error.set('Erreur lors de la validation du paiement.');
        }
        this.isProcessingPayment.set(false);
      },
      error: (err) => {
        console.error('Erreur lors de la validation:', err);
        this.error.set('Erreur lors de la validation du paiement.');
        this.isProcessingPayment.set(false);
      }
    });
  }

  /**
   * Imprime une facture
   */
  printInvoice(facture: FactureWithPatient): void {
    // Créer une fenêtre d'impression
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Veuillez autoriser les popups pour imprimer.');
      return;
    }

    const patientName = `${facture.patientPrenom || ''} ${facture.patientNom || ''}`.trim() || 'Patient';
    const dateFacture = this.formatDate(facture.dateCreation);
    const statut = this.billingService.getStatutLabel(facture.statut);
    const modePaiement = this.billingService.getModePaiementLabel(facture.modePaiement);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Facture ${facture.numeroFacture || 'N/A'}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { margin: 0; color: #2563eb; }
          .header p { margin: 5px 0; color: #666; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .info-box { padding: 15px; background: #f8f9fa; border-radius: 8px; }
          .info-box h3 { margin: 0 0 10px 0; color: #333; font-size: 14px; text-transform: uppercase; }
          .info-box p { margin: 5px 0; }
          .amount-section { background: #e8f4fd; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0; }
          .amount-section .amount { font-size: 32px; font-weight: bold; color: #2563eb; }
          .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
          .status.paid { background: #d4edda; color: #155724; }
          .status.pending { background: #fff3cd; color: #856404; }
          .status.cancelled { background: #f8d7da; color: #721c24; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏥 Cabinet Médical</h1>
          <p>Facture de consultation</p>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <h3>Informations Facture</h3>
            <p><strong>N° Facture:</strong> ${facture.numeroFacture || 'N/A'}</p>
            <p><strong>Date:</strong> ${dateFacture}</p>
            <p><strong>Statut:</strong> <span class="status ${facture.statut === 'PAYEE' ? 'paid' : facture.statut === 'EN_ATTENTE' ? 'pending' : 'cancelled'}">${statut}</span></p>
          </div>
          <div class="info-box">
            <h3>Patient</h3>
            <p><strong>Nom:</strong> ${patientName}</p>
            ${facture.patient?.cin ? `<p><strong>CIN:</strong> ${facture.patient.cin}</p>` : ''}
            ${facture.patient?.numTel ? `<p><strong>Tél:</strong> ${facture.patient.numTel}</p>` : ''}
          </div>
        </div>

        <div class="amount-section">
          <p style="margin: 0 0 10px 0; color: #666;">Montant Total</p>
          <div class="amount">${facture.montant} DH</div>
          ${facture.statut === 'PAYEE' ? `
            <p style="margin: 10px 0 0 0; color: #155724;">
              ✓ Payé (${modePaiement})
            </p>
          ` : ''}
        </div>

        <div class="footer">
          <p>Merci pour votre confiance</p>
          <p>Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  /**
   * Formate une date
   */
  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  /**
   * Retourne les classes CSS pour le statut
   */
  getStatusClass(status: string): string {
    return this.billingService.getStatutClass(status);
  }

  /**
   * Retourne le libellé du statut
   */
  getStatusLabel(status: string): string {
    return this.billingService.getStatutLabel(status);
  }

  /**
   * Retourne le libellé du mode de paiement
   */
  getModeLabel(mode: string | null): string {
    return this.billingService.getModePaiementLabel(mode);
  }

  /**
   * Retourne le nom complet du patient
   */
  getPatientName(facture: FactureWithPatient): string {
    return `${facture.patientPrenom || ''} ${facture.patientNom || ''}`.trim() || 'Patient inconnu';
  }

  /**
   * Met à jour le filtre de statut
   */
  onStatusFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.statusFilter.set(select.value);
  }

  /**
   * Met à jour la recherche
   */
  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  /**
   * Met à jour le montant de paiement
   */
  onPaymentAmountChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.paymentAmount.set(parseFloat(input.value) || 0);
  }

  /**
   * Met à jour le mode de paiement
   */
  onPaymentModeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.paymentMode.set(select.value as ModePaiement);
  }
}
