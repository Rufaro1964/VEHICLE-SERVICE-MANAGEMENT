// frontend/src/i18n/config.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          login: 'Login',
          logout: 'Logout',
          vehicles: 'Vehicles',
          services: 'Services',
          reports: 'Reports',
          dashboard: 'Dashboard',
          addVehicle: 'Add Vehicle',
          plateNumber: 'Plate Number',
          chassisNumber: 'Chassis Number',
          make: 'Make',
          model: 'Model',
          year: 'Year',
          currentMileage: 'Current Mileage',
          serviceDue: 'Service Due',
          actions: 'Actions',
          edit: 'Edit',
          delete: 'Delete',
          save: 'Save',
          cancel: 'Cancel',
          serviceHistory: 'Service History',
          serviceDate: 'Service Date',
          serviceType: 'Service Type',
          cost: 'Cost',
          status: 'Status',
          generateReport: 'Generate Report',
          monthlyReport: 'Monthly Report',
          exportExcel: 'Export to Excel',
          importExcel: 'Import from Excel',
          scanQRCode: 'Scan QR Code',
          notifications: 'Notifications',
          settings: 'Settings',
          language: 'Language',
          english: 'English',
          spanish: 'Spanish',
          french: 'French'
        }
      },
      es: {
        translation: {
          login: 'Iniciar Sesión',
          logout: 'Cerrar Sesión',
          vehicles: 'Vehículos',
          services: 'Servicios',
          reports: 'Reportes',
          dashboard: 'Panel',
          addVehicle: 'Agregar Vehículo',
          plateNumber: 'Número de Placa',
          chassisNumber: 'Número de Chasis',
          make: 'Marca',
          model: 'Modelo',
          year: 'Año',
          currentMileage: 'Kilometraje Actual',
          serviceDue: 'Servicio Debido',
          actions: 'Acciones',
          edit: 'Editar',
          delete: 'Eliminar',
          save: 'Guardar',
          cancel: 'Cancelar',
          serviceHistory: 'Historial de Servicios',
          serviceDate: 'Fecha de Servicio',
          serviceType: 'Tipo de Servicio',
          cost: 'Costo',
          status: 'Estado',
          generateReport: 'Generar Reporte',
          monthlyReport: 'Reporte Mensual',
          exportExcel: 'Exportar a Excel',
          importExcel: 'Importar desde Excel',
          scanQRCode: 'Escanear Código QR',
          notifications: 'Notificaciones',
          settings: 'Configuración',
          language: 'Idioma',
          english: 'Inglés',
          spanish: 'Español',
          french: 'Francés'
        }
      },
      fr: {
        translation: {
          login: 'Connexion',
          logout: 'Déconnexion',
          vehicles: 'Véhicules',
          services: 'Services',
          reports: 'Rapports',
          dashboard: 'Tableau de bord',
          addVehicle: 'Ajouter un Véhicule',
          plateNumber: "Numéro d'Immatriculation",
          chassisNumber: 'Numéro de Châssis',
          make: 'Marque',
          model: 'Modèle',
          year: 'Année',
          currentMileage: 'Kilométrage Actuel',
          serviceDue: 'Service Dû',
          actions: 'Actions',
          edit: 'Modifier',
          delete: 'Supprimer',
          save: 'Enregistrer',
          cancel: 'Annuler',
          serviceHistory: 'Historique des Services',
          serviceDate: 'Date de Service',
          serviceType: 'Type de Service',
          cost: 'Coût',
          status: 'Statut',
          generateReport: 'Générer un Rapport',
          monthlyReport: 'Rapport Mensuel',
          exportExcel: 'Exporter vers Excel',
          importExcel: 'Importer depuis Excel',
          scanQRCode: 'Scanner le Code QR',
          notifications: 'Notifications',
          settings: 'Paramètres',
          language: 'Langue',
          english: 'Anglais',
          spanish: 'Espagnol',
          french: 'Français'
        }
      }
    },
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;