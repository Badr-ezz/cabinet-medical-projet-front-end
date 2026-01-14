import { Component, signal } from '@angular/core';

interface Invoice {
  id: number;
  patient: string;
  date: string;
  montant: number;
  modePaiement: 'especes' | 'carte' | 'cheque' | 'virement';
  status: 'paid' | 'pending' | 'cancelled';
}

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [],
  templateUrl: './billing.component.html'
})
export class BillingComponent {
  // Données fictives
  invoices = signal<Invoice[]>([
    { id: 1, patient: 'Ahmed Benali', date: '2025-12-31', montant: 300, modePaiement: 'especes', status: 'paid' },
    { id: 2, patient: 'Fatima Zahrae', date: '2025-12-31', montant: 450, modePaiement: 'carte', status: 'paid' },
    { id: 3, patient: 'Mohamed Alami', date: '2025-12-31', montant: 250, modePaiement: 'especes', status: 'pending' },
    { id: 4, patient: 'Sara Idrissi', date: '2025-12-30', montant: 500, modePaiement: 'cheque', status: 'paid' },
    { id: 5, patient: 'Youssef Tazi', date: '2025-12-30', montant: 350, modePaiement: 'virement', status: 'cancelled' },
    { id: 6, patient: 'Amina El Fassi', date: '2025-12-29', montant: 200, modePaiement: 'especes', status: 'paid' },
    { id: 7, patient: 'Karim Bouazza', date: '2025-12-29', montant: 600, modePaiement: 'carte', status: 'paid' },
    { id: 8, patient: 'Leila Senhaji', date: '2025-12-28', montant: 400, modePaiement: 'especes', status: 'pending' }
  ]);

  // Statistiques calculées
  totalPaid = signal(2500);
  totalPending = signal(650);
  invoiceCount = signal(8);

  getStatusClass(status: string): string {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'paid': return 'Payé';
      case 'pending': return 'En attente';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  }

  getModeLabel(mode: string): string {
    switch (mode) {
      case 'especes': return 'Espèces';
      case 'carte': return 'Carte bancaire';
      case 'cheque': return 'Chèque';
      case 'virement': return 'Virement';
      default: return mode;
    }
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  validatePayment(invoice: Invoice) {
    console.log('Valider paiement:', invoice);
  }

  printInvoice(invoice: Invoice) {
    console.log('Imprimer facture:', invoice);
  }
}
