export interface ExpenseType {
  label: string;
  required: string[];
}

export interface ExpenseTypes {
  [key: string]: ExpenseType;
}

export const expenseTypes: ExpenseTypes = {
  consultants: {
    label: 'Consultants / Prestataires',
    required: ['bon_commande', 'devis_1', 'devis_2', 'devis_3', 'pv_reception', 'tdr', 'contrat', 'facture', 'retenue_source', 'preuve_paiement'],
  },
  salaires: {
    label: 'Salaires',
    required: ['contrat_travail', 'fiche_paie', 'attestation_paiement'],
  },
  fournitures: {
    label: 'Fournitures de bureau',
    required: ['bon_commande', 'facture', 'preuve_paiement'],
  },
  transport: {
    label: 'Transport et déplacement',
    required: ['billet_transport', 'facture_hotel', 'note_frais'],
  },
  equipement: {
    label: 'Équipement informatique',
    required: ['bon_commande', 'facture', 'preuve_paiement', 'fiche_inventaire'],
  },
  formation: {
    label: 'Formation et développement',
    required: ['inscription', 'facture', 'preuve_paiement', 'attestation_participation'],
  },
};