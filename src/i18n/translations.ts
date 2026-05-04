export const resources = {
  en: {
    translation: {
      // Header
      search_placeholder: 'What are you looking for?',
      location_label: 'Location',
      disclaimer_btn: 'Disclaimer',

      // Mode toggle
      mode_need: 'Need',
      mode_offer: 'Offer',

      // Pagination
      items_per_page: 'Items per page:',
      page_of: 'Page {{current}} of {{total}}',

      // Disclaimer overlay
      disclaimer_title: 'Disclaimer',
      close: 'Close',
      disclaimer_bullet1_pre: 'Only people with a valid',
      disclaimer_bullet1_post: 'email address have access to this page.',
      disclaimer_bullet2_pre: 'All people with a valid',
      disclaimer_bullet2_post:
        'email address can see all information displayed here and submit their own Need/Offer listings.',
      disclaimer_bullet3: 'No logs are stored.',
      click_to_close: 'Click outside to close',

      // Empty state
      no_results: 'No results found',
      try_different: 'Try different search criteria',

      // Listing card aria
      aria_tag: 'Tag: {{tag}}',
      aria_location: 'Location: {{location}}',
    },
  },
  de: {
    translation: {
      search_placeholder: 'Wonach suchen Sie?',
      location_label: 'Standort',
      disclaimer_btn: 'Haftungsausschluss',

      mode_need: 'Suche',
      mode_offer: 'Biete',

      items_per_page: 'Einträge pro Seite:',
      page_of: 'Seite {{current}} von {{total}}',

      disclaimer_title: 'Haftungsausschluss',
      close: 'Schließen',
      disclaimer_bullet1_pre: 'Nur Personen mit einer gültigen',
      disclaimer_bullet1_post:
        'E-Mail-Adresse haben Zugang zu dieser Seite.',
      disclaimer_bullet2_pre: 'Alle Personen mit einer gültigen',
      disclaimer_bullet2_post:
        'E-Mail-Adresse sehen alle hier angezeigten Informationen und können eigene Suche/Biete-Einträge einreichen.',
      disclaimer_bullet3: 'Es werden keine Logs gespeichert.',
      click_to_close: 'Klicken zum Schließen',

      no_results: 'Keine Ergebnisse gefunden',
      try_different: 'Versuchen Sie andere Suchkriterien',

      aria_tag: 'Schlagwort: {{tag}}',
      aria_location: 'Standort: {{location}}',
    },
  },
  fr: {
    translation: {
      search_placeholder: 'Que cherchez-vous?',
      location_label: 'Lieu',
      disclaimer_btn: 'Avertissement',

      mode_need: 'Cherche',
      mode_offer: 'Offre',

      items_per_page: 'Éléments par page:',
      page_of: 'Page {{current}} sur {{total}}',

      disclaimer_title: 'Avertissement',
      close: 'Fermer',
      disclaimer_bullet1_pre: 'Seules les personnes avec une adresse e-mail',
      disclaimer_bullet1_post: 'valide ont accès à cette page.',
      disclaimer_bullet2_pre: 'Toutes les personnes avec une adresse e-mail',
      disclaimer_bullet2_post:
        'valide peuvent voir toutes les informations affichées ici et soumettre leurs propres annonces Cherche/Offre.',
      disclaimer_bullet3: "Aucun journal n'est enregistré.",
      click_to_close: 'Cliquer pour fermer',

      no_results: 'Aucun résultat',
      try_different: "Essayez d'autres critères de recherche",

      aria_tag: 'Étiquette: {{tag}}',
      aria_location: 'Lieu: {{location}}',
    },
  },
  tr: {
    translation: {
      search_placeholder: 'Ne arıyorsunuz?',
      location_label: 'Konum',
      disclaimer_btn: 'Sorumluluk Reddi',

      mode_need: 'İstek',
      mode_offer: 'Teklif',

      items_per_page: 'Sayfa başına öğe:',
      page_of: 'Sayfa {{current}} / {{total}}',

      disclaimer_title: 'Sorumluluk Reddi',
      close: 'Kapat',
      disclaimer_bullet1_pre: 'Yalnızca geçerli bir',
      disclaimer_bullet1_post:
        'e-posta adresine sahip kişiler bu sayfaya erişebilir.',
      disclaimer_bullet2_pre: 'Geçerli bir',
      disclaimer_bullet2_post:
        'e-posta adresine sahip tüm kişiler buradaki tüm bilgileri görebilir ve kendi İstek/Teklif ilanlarını gönderebilir.',
      disclaimer_bullet3: 'Hiçbir kayıt tutulmaz.',
      click_to_close: 'Kapatmak için tıklayın',

      no_results: 'Sonuç bulunamadı',
      try_different: 'Farklı arama kriterleri deneyin',

      aria_tag: 'Etiket: {{tag}}',
      aria_location: 'Konum: {{location}}',
    },
  },
  es: {
    translation: {
      search_placeholder: '¿Qué estás buscando?',
      location_label: 'Ubicación',
      disclaimer_btn: 'Aviso Legal',

      mode_need: 'Busco',
      mode_offer: 'Ofrezco',

      items_per_page: 'Elementos por página:',
      page_of: 'Página {{current}} de {{total}}',

      disclaimer_title: 'Aviso Legal',
      close: 'Cerrar',
      disclaimer_bullet1_pre: 'Solo las personas con una dirección de correo',
      disclaimer_bullet1_post: 'válida tienen acceso a esta página.',
      disclaimer_bullet2_pre: 'Todas las personas con una dirección de correo',
      disclaimer_bullet2_post:
        'válida pueden ver toda la información aquí mostrada y enviar sus propios anuncios de Busco/Ofrezco.',
      disclaimer_bullet3: 'No se almacenan registros.',
      click_to_close: 'Haga clic para cerrar',

      no_results: 'Sin resultados',
      try_different: 'Pruebe con otros criterios de búsqueda',

      aria_tag: 'Etiqueta: {{tag}}',
      aria_location: 'Ubicación: {{location}}',
    },
  },
} as const;

export const LANGUAGES = [
  { code: 'en', flag: '🇬🇧', label: 'EN' },
  { code: 'de', flag: '🇩🇪', label: 'DE' },
  { code: 'fr', flag: '🇫🇷', label: 'FR' },
  { code: 'tr', flag: '🇹🇷', label: 'TR' },
  { code: 'es', flag: '🇪🇸', label: 'ES' },
] as const;

export type LangCode = (typeof LANGUAGES)[number]['code'];
