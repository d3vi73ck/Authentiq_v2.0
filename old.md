Système d’Automatisation des Justificatifs de Dépenses – Projet Kif Ndirou
🎯 Objectif
Permettre aux associations partenaires de soumettre en ligne leurs justificatifs de dépenses, avec un système d’alerte et de validation automatique par les chefs d’appui.
👥 Rôles Utilisateurs
    • Association partenaire
    • - Téléverse les documents justificatifs selon le type de dépense.
    • - Suit le statut de validation (soumis, en cours, validé, à corriger).
    • Chef d’appui
    • - Reçoit notification à chaque soumission.
    • - Valide ou rejette les justificatifs.
    • - Ajoute des commentaires.
    • Admin / Gestionnaire projet
    • - Supervise toutes les soumissions.
    • - Exporte les rapports par activité, type de dépense, association, etc.
📂 Types de Dépenses et Pièces Justificatives
#
Intitulé
Pièces Justificatives à Soumettre
1
Salaires (avec CNSS)
3 CVs, PV de sélection, Contrat de travail signé et légalisé, Attestation de RIB, Fiches de paie mensuelles, Feuille de temps, Preuve de paiement, Pièces CNSS et impôts
2
Consultants & Formateurs (Montant Brut)
Bon de commande / 3 devis, PV de sélection, Termes de référence, Contrat de prestation, Carte entrepreneur, Facture, Attestation de retenue à la source, Preuve de paiement
3
Loyer du bureau
Contrat de location, Facture / quittance, Preuve de paiement
4
Location de salles
Bon de commande / 3 devis, PV de sélection, Contrat / facture, Preuve de paiement, Liste de présence, Photos après activité
5
Déplacements / Per Diem
Ordre de mission, Note de per diem, Compte rendu de mission
6
Frais de fonctionnement (électricité, eau, internet)
Facture, Preuve de paiement, Contrat
7
Fournitures de bureau
Bon de commande / 3 devis, PV de sélection, Bon de livraison, Facture, Preuve de paiement
8
Achat équipements & matériels
Bon de commande / 3 devis, PV de sélection, Bon de livraison, Facture, Preuve de paiement
9
Frais de visibilité
Bon de commande / 3 devis, PV de sélection, Bon de livraison, Facture, Preuve de paiement, Maquettes / photos des supports
10
Frais de communication
Facture, Preuve de paiement, Note de dépense carte SIM (avec copie CIN du bénéficiaire)
11
Frais de transport
Note de dépense + copie CIN, Tickets, Contrat de location ou facture, Photos départ/arrivée ou Google Maps KM, Preuve de paiement
12
Frais d’hébergement
Bon de commande / 3 devis, PV de sélection, Facture, Preuve de paiement, Liste des personnes hébergées
13
Frais de restauration
Bon de commande / 3 devis, PV de sélection, Facture, Preuve de paiement, Liste de présence
14
Autres coûts (frais bancaires, photocopies…)
Facture, Preuve de paiement
🧠 Règles Automatiques à Intégrer
    • - Vérification de complétude : chaque type de dépense a une liste obligatoire de documents.
    • - Validation des dates : les dates des justificatifs doivent être antérieures à la dépense.
    • - Cohérence des montants : facture = bon de commande / devis, total payé = montant facturé.
    • - Authentification des fichiers : formats acceptés PDF/JPG/PNG, taille max 10 MB, signature obligatoire selon le type.
    • - Workflow automatique : notification du chef d’appui, validation ou correction avec commentaire.
🧰 Recommandation Technique
    • - Frontend : React.js ou Flutter Web
    • - Backend / Database : Firebase (Firestore + Storage)
    • - Authentification : Firebase Auth
    • - Notifications : Email via Firebase Functions ou SendGrid
    • - Export : Génération PDF/Excel des rapports par période