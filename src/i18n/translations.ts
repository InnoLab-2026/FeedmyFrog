export const resources = {
  en: {
    translation: {
      // Header
      search_placeholder: 'What are you looking for?',
      location_label: 'Location',
      disclaimer_btn: 'Disclaimer',
      account_menu: 'Account menu',
      manage_listings: 'Post a new listing',
      my_entries: 'My listings',
      logout: 'Log out',

      // Location search
      location_enter: 'Enter location...',
      gps_use: 'Use GPS location',
      gps_loading: 'Determining location...',
      gps_unavailable: 'GPS is not available on this device.',
      gps_error: 'Location could not be determined.',
      radius: 'Radius',

      // Mode toggle
      mode_need: 'Need',
      mode_offer: 'Offer',

      // Categories
      category_all: 'All',
      category_services: 'Services',
      category_education: 'Education',
      category_mobility: 'Mobility',
      category_commuting: 'Commuting',
      category_children: 'Children',
      category_family: 'Family',
      category_weekend: 'Weekend',
      category_sale: 'Sale',
      category_transport: 'Transport',
      more_categories: 'More categories',

      // Pagination
      items_per_page: 'Items per page:',
      page_of: 'Page {{current}} of {{total}}',

      // Listing card
      contact: 'Contact',
      edit: 'Edit',
      delete: 'Delete',

      // My listings
      back_to_overview: 'Back to overview',
      my_listings_title: 'My listings',
      my_listings_description:
        'Create, edit and manage your own listings.',
      create_listing: 'Create listing',
      no_own_listings: 'You have not created any listings yet.',
      create_first_listing: 'Create your first listing',

      // Create listing modal
      create_listing_title: 'Create listing',
      type_and_tags: 'Type & categories',
      type: 'Type',
      choose_tags: 'Choose categories',
      choose_tags_hint:
        'Pick up to {{max}} categories. Anything else goes in as a hashtag in the next step.',
      custom_tags_optional:
        'Add hashtags so people can find your listing faster',
      custom_tags_placeholder:
        'e.g. plants, urgent (comma-separated)',
      custom_tags_hint:
        'Extra hashtags show on your card and become a category tab while a listing uses them.',
      next: 'Next',
      back: 'Back',
      details: 'Details',
      title: 'Title',
      description: 'Description',
      location: 'Location',
      contact_and_preview: 'Contact & preview',
      email: 'Email',
      email_from_account:
        'Taken automatically from your university account.',
      preview: 'Preview',
      publish: 'Publish',
      saving: 'Saving...',

      // Disclaimer overlay
      disclaimer_title: 'Disclaimer',
      close: 'Close',
      disclaimer_bullet1_pre: 'Only people with a valid',
      disclaimer_bullet1_post:
        'email address have access to this page.',
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

      // Login page
      login_subtitle:
        'Sign in with your university email address. We will send you a one-time login link.',
      login_privacy_notice:
        'Information about how we process your data can be found in our',
      privacy_policy_link: 'Privacy Policy',
      imprint_link: 'Imprint',
      login_error_missing_token:
        'The login link was incomplete. Please request a new one.',
      login_error_invalid_or_expired:
        'This login link has expired or was already used. Please request a new one.',
      email_address_label: 'Email address',
      sending_link: 'Sending …',
      send_login_link: 'Send login link',
      email_sent_title: 'Email on its way ✉️',
      email_sent_body_pre:
        'If this address is eligible, you will find the link in your inbox shortly:',
      email_sent_body_post:
        'Please note: the link is valid only once. If it has expired, you can request a new one at any time.',
      error_forbidden_domain:
        'Please use your university email address.',
      error_invalid_email: 'Please enter a valid email address.',
      error_too_many_requests:
        'Too many requests. Please try again later.',
      error_unknown: 'Something went wrong. Please try again.',

      // Verify prompt page
      invalid_link_title: 'Invalid link',
      invalid_link_body: 'The login link was incomplete.',
      request_new_link: 'Request a new link',
      verify_prompt_subtitle: 'Click the button to sign in.',
      verify_now: 'Sign in now',

      // 404 page
      not_found_title: 'Page not found',
      not_found_body: 'The requested page does not exist.',
      go_home: 'Go to homepage',

      // Scroll to top
      scroll_to_top: 'Back to top',

      // Edit listing page
      edit_listing_title: 'Edit listing',
      tags_label: 'Tags (comma-separated)',
      save_changes: 'Save changes',

      // Listing validation error codes returned by server actions
      error_type_invalid: 'Please choose a valid type.',
      error_title_too_short: 'Title must be at least 3 characters.',
      error_title_too_long: 'Title must be at most 120 characters.',
      error_description_too_short: 'Description must be at least 10 characters.',
      error_description_too_long: 'Description must be at most 2000 characters.',
      error_tag_empty: 'Tags cannot be empty.',
      error_tag_too_long: 'Each tag can be at most 40 characters.',
      error_tags_too_many: 'You can add at most 8 tags.',
      error_location_required: 'Location is required.',
      error_location_too_long: 'Location must be at most 80 characters.',
      error_invalid_id: 'Invalid listing ID.',
      error_not_found: 'Listing not found.',
    },
  },

  de: {
    translation: {
      // Header
      search_placeholder: 'Wonach suchen Sie?',
      location_label: 'Standort',
      disclaimer_btn: 'Haftungsausschluss',
      account_menu: 'Kontomenü',
      manage_listings: 'Neue Anzeige aufgeben',
      my_entries: 'Meine Einträge',
      logout: 'Abmelden',

      // Location search
      location_enter: 'Ort eingeben...',
      gps_use: 'GPS-Standort verwenden',
      gps_loading: 'Standort wird ermittelt...',
      gps_unavailable: 'GPS ist auf diesem Gerät nicht verfügbar.',
      gps_error: 'Standort konnte nicht ermittelt werden.',
      radius: 'Umkreis',

      // Mode toggle
      mode_need: 'Suche',
      mode_offer: 'Biete',

      // Categories
      category_all: 'Alle',
      category_services: 'Dienstleistungen',
      category_education: 'Bildung',
      category_mobility: 'Mobilität',
      category_commuting: 'Pendeln',
      category_children: 'Kinder',
      category_family: 'Familie',
      category_weekend: 'Wochenende',
      category_sale: 'Verkauf',
      category_transport: 'Transport',
      more_categories: 'Weitere Kategorien',

      // Pagination
      items_per_page: 'Einträge pro Seite:',
      page_of: 'Seite {{current}} von {{total}}',

      // Listing card
      contact: 'Kontakt aufnehmen',
      edit: 'Bearbeiten',
      delete: 'Löschen',

      // My listings
      back_to_overview: 'Zurück zur Übersicht',
      my_listings_title: 'Meine Anzeigen',
      my_listings_description:
        'Erstellen, bearbeiten und verwalten Sie Ihre eigenen Anzeigen.',
      create_listing: 'Anzeige erstellen',
      no_own_listings: 'Sie haben noch keine Anzeigen erstellt.',
      create_first_listing: 'Jetzt erste Anzeige erstellen',

      // Create listing modal
      create_listing_title: 'Anzeige erstellen',
      type_and_tags: 'Art & Kategorien',
      type: 'Art',
      choose_tags: 'Kategorien auswählen',
      choose_tags_hint:
        'Wählen Sie bis zu {{max}} Kategorien. Alles Weitere im nächsten Schritt als Hashtag.',
      custom_tags_optional:
        'Setze Hashtags, um deine Anzeige schneller zu finden',
      custom_tags_placeholder:
        'z. B. Pflanzen, dringend (kommagetrennt)',
      custom_tags_hint:
        'Zusätzliche Hashtags erscheinen auf Ihrer Karte und werden zum Kategorie-Tab, solange eine Anzeige sie verwendet.',
      next: 'Weiter',
      back: 'Zurück',
      details: 'Details',
      title: 'Titel',
      description: 'Beschreibung',
      location: 'Standort',
      contact_and_preview: 'Kontakt & Vorschau',
      email: 'E-Mail',
      email_from_account:
        'Wird automatisch aus Ihrem Hochschul-Konto übernommen.',
      preview: 'Vorschau',
      publish: 'Veröffentlichen',
      saving: 'Speichern...',

      // Disclaimer overlay
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

      // Empty state
      no_results: 'Keine Ergebnisse gefunden',
      try_different: 'Versuchen Sie andere Suchkriterien',

      // Listing card aria
      aria_tag: 'Schlagwort: {{tag}}',
      aria_location: 'Standort: {{location}}',

      // Login page
      login_subtitle:
        'Melden Sie sich mit Ihrer Hochschul-E-Mail-Adresse an. Wir senden Ihnen einen einmaligen Anmeldelink.',
      login_privacy_notice:
        'Informationen zur Verarbeitung Ihrer Daten finden Sie in der',
      privacy_policy_link: 'Datenschutzerklärung',
      imprint_link: 'Impressum',
      login_error_missing_token:
        'Der Anmeldelink war unvollständig. Bitte fordern Sie einen neuen an.',
      login_error_invalid_or_expired:
        'Dieser Anmeldelink ist abgelaufen oder wurde bereits verwendet. Bitte fordern Sie einen neuen an.',
      email_address_label: 'E-Mail-Adresse',
      sending_link: 'Wird gesendet …',
      send_login_link: 'Anmeldelink senden',
      email_sent_title: 'E-Mail unterwegs ✉️',
      email_sent_body_pre:
        'Falls diese Adresse berechtigt ist, finden Sie den Link gleich im Postfach:',
      email_sent_body_post:
        'Bitte beachten: Der Link ist nur einmal gültig. Wenn der Link abgelaufen ist, können Sie jederzeit einen neuen erzeugen.',
      error_forbidden_domain:
        'Bitte verwenden Sie Ihre Hochschul-E-Mail-Adresse.',
      error_invalid_email:
        'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
      error_too_many_requests:
        'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
      error_unknown:
        'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.',

      // Verify prompt page
      invalid_link_title: 'Ungültiger Link',
      invalid_link_body: 'Der Anmeldelink war unvollständig.',
      request_new_link: 'Neuen Link anfordern',
      verify_prompt_subtitle:
        'Klicken Sie auf die Schaltfläche, um sich anzumelden.',
      verify_now: 'Jetzt anmelden',

      // 404 page
      not_found_title: 'Seite nicht gefunden',
      not_found_body: 'Die angeforderte Seite existiert nicht.',
      go_home: 'Zur Startseite',

      // Scroll to top
      scroll_to_top: 'Nach oben',

      // Edit listing page
      edit_listing_title: 'Eintrag bearbeiten',
      tags_label: 'Tags (kommagetrennt)',
      save_changes: 'Änderungen speichern',

      // Listing validation error codes returned by server actions
      error_type_invalid: 'Bitte wählen Sie einen gültigen Typ.',
      error_title_too_short: 'Der Titel muss mindestens 3 Zeichen lang sein.',
      error_title_too_long: 'Der Titel darf höchstens 120 Zeichen lang sein.',
      error_description_too_short: 'Die Beschreibung muss mindestens 10 Zeichen lang sein.',
      error_description_too_long: 'Die Beschreibung darf höchstens 2000 Zeichen lang sein.',
      error_tag_empty: 'Schlagwörter dürfen nicht leer sein.',
      error_tag_too_long: 'Jedes Schlagwort darf höchstens 40 Zeichen lang sein.',
      error_tags_too_many: 'Sie können höchstens 8 Schlagwörter hinzufügen.',
      error_location_required: 'Standort ist erforderlich.',
      error_location_too_long: 'Der Standort darf höchstens 80 Zeichen lang sein.',
      error_invalid_id: 'Ungültige Anzeigen-ID.',
      error_not_found: 'Anzeige nicht gefunden.',
    },
  },

  fr: {
    translation: {
      search_placeholder: 'Que cherchez-vous?',
      location_label: 'Lieu',
      disclaimer_btn: 'Avertissement',
      account_menu: 'Menu du compte',
      manage_listings: 'Publier une annonce',
      my_entries: 'Mes annonces',
      logout: 'Déconnexion',

      location_enter: 'Saisir un lieu...',
      gps_use: 'Utiliser la position GPS',
      gps_loading: 'Localisation en cours...',
      gps_unavailable: "Le GPS n'est pas disponible sur cet appareil.",
      gps_error: "La position n'a pas pu être déterminée.",
      radius: 'Rayon',

      mode_need: 'Cherche',
      mode_offer: 'Offre',

      category_all: 'Tous',
      category_services: 'Services',
      category_education: 'Éducation',
      category_mobility: 'Mobilité',
      category_commuting: 'Trajet',
      category_children: 'Enfants',
      category_family: 'Famille',
      category_weekend: 'Week-end',
      category_sale: 'Vente',
      category_transport: 'Transport',
      more_categories: 'Plus de catégories',

      items_per_page: 'Éléments par page:',
      page_of: 'Page {{current}} sur {{total}}',

      contact: 'Contacter',
      edit: 'Modifier',
      delete: 'Supprimer',

      back_to_overview: "Retour à l'aperçu",
      my_listings_title: 'Mes annonces',
      my_listings_description:
        'Créez, modifiez et gérez vos propres annonces.',
      create_listing: 'Créer une annonce',
      no_own_listings: "Vous n'avez encore créé aucune annonce.",
      create_first_listing: 'Créer la première annonce',

      create_listing_title: 'Créer une annonce',
      type_and_tags: 'Type et catégories',
      type: 'Type',
      choose_tags: 'Choisir des catégories',
      choose_tags_hint:
        'Choisissez jusqu’à {{max}} catégories. Le reste s’ajoute comme hashtag à l’étape suivante.',
      custom_tags_optional:
        'Ajoutez des hashtags pour que votre annonce soit plus facile à trouver',
      custom_tags_placeholder:
        'p. ex. plantes, urgent (séparés par des virgules)',
      custom_tags_hint:
        'Les hashtags supplémentaires apparaissent sur votre annonce et deviennent un onglet de catégorie tant qu’une annonce les utilise.',
      next: 'Suivant',
      back: 'Retour',
      details: 'Détails',
      title: 'Titre',
      description: 'Description',
      location: 'Lieu',
      contact_and_preview: 'Contact et aperçu',
      email: 'E-mail',
      email_from_account:
        'Repris automatiquement depuis votre compte universitaire.',
      preview: 'Aperçu',
      publish: 'Publier',
      saving: 'Enregistrement...',

      disclaimer_title: 'Avertissement',
      close: 'Fermer',
      disclaimer_bullet1_pre:
        'Seules les personnes avec une adresse e-mail',
      disclaimer_bullet1_post: 'valide ont accès à cette page.',
      disclaimer_bullet2_pre:
        'Toutes les personnes avec une adresse e-mail',
      disclaimer_bullet2_post:
        'valide peuvent voir toutes les informations affichées ici et soumettre leurs propres annonces Cherche/Offre.',
      disclaimer_bullet3: "Aucun journal n'est enregistré.",
      click_to_close: 'Cliquer pour fermer',

      no_results: 'Aucun résultat',
      try_different: "Essayez d'autres critères de recherche",

      aria_tag: 'Étiquette: {{tag}}',
      aria_location: 'Lieu: {{location}}',

      // Login page
      login_subtitle:
        'Connectez-vous avec votre adresse e-mail universitaire. Nous vous enverrons un lien de connexion à usage unique.',
      login_privacy_notice:
        'Des informations sur le traitement de vos données sont disponibles dans notre',
      privacy_policy_link: 'Politique de confidentialité',
      imprint_link: 'Mentions légales',
      login_error_missing_token:
        'Le lien de connexion était incomplet. Veuillez en demander un nouveau.',
      login_error_invalid_or_expired:
        'Ce lien de connexion a expiré ou a déjà été utilisé. Veuillez en demander un nouveau.',
      email_address_label: 'Adresse e-mail',
      sending_link: 'Envoi en cours …',
      send_login_link: 'Envoyer le lien de connexion',
      email_sent_title: 'E-mail en route ✉️',
      email_sent_body_pre:
        'Si cette adresse est autorisée, vous trouverez le lien dans votre boîte de réception :',
      email_sent_body_post:
        'Attention : le lien n’est valable qu’une seule fois. S’il a expiré, vous pouvez en demander un nouveau à tout moment.',
      error_forbidden_domain:
        'Veuillez utiliser votre adresse e-mail universitaire.',
      error_invalid_email: 'Veuillez saisir une adresse e-mail valide.',
      error_too_many_requests:
        'Trop de tentatives. Veuillez réessayer plus tard.',
      error_unknown: "Une erreur s'est produite. Veuillez réessayer.",

      // Verify prompt page
      invalid_link_title: 'Lien invalide',
      invalid_link_body: 'Le lien de connexion était incomplet.',
      request_new_link: 'Demander un nouveau lien',
      verify_prompt_subtitle: 'Cliquez sur le bouton pour vous connecter.',
      verify_now: 'Se connecter maintenant',

      // 404 page
      not_found_title: 'Page introuvable',
      not_found_body: "La page demandée n'existe pas.",
      go_home: "Retour à l'accueil",

      // Scroll to top
      scroll_to_top: 'Retour en haut',

      // Edit listing page
      edit_listing_title: "Modifier l'annonce",
      tags_label: 'Mots-clés (séparés par des virgules)',
      save_changes: 'Enregistrer les modifications',

      // Listing validation error codes returned by server actions
      error_type_invalid: 'Veuillez choisir un type valide.',
      error_title_too_short: 'Le titre doit comporter au moins 3 caractères.',
      error_title_too_long: 'Le titre ne doit pas dépasser 120 caractères.',
      error_description_too_short: 'La description doit comporter au moins 10 caractères.',
      error_description_too_long: 'La description ne doit pas dépasser 2000 caractères.',
      error_tag_empty: 'Les mots-clés ne peuvent pas être vides.',
      error_tag_too_long: 'Chaque mot-clé ne doit pas dépasser 40 caractères.',
      error_tags_too_many: 'Vous pouvez ajouter 8 mots-clés au maximum.',
      error_location_required: 'Le lieu est requis.',
      error_location_too_long: 'Le lieu ne doit pas dépasser 80 caractères.',
      error_invalid_id: "Identifiant d'annonce invalide.",
      error_not_found: 'Annonce introuvable.',
    },
  },

  tr: {
    translation: {
      search_placeholder: 'Ne arıyorsunuz?',
      location_label: 'Konum',
      disclaimer_btn: 'Sorumluluk Reddi',
      account_menu: 'Hesap menüsü',
      manage_listings: 'Yeni ilan ver',
      my_entries: 'İlanlarım',
      logout: 'Çıkış yap',

      location_enter: 'Konum girin...',
      gps_use: 'GPS konumunu kullan',
      gps_loading: 'Konum belirleniyor...',
      gps_unavailable: 'GPS bu cihazda kullanılamıyor.',
      gps_error: 'Konum belirlenemedi.',
      radius: 'Yarıçap',

      mode_need: 'İstek',
      mode_offer: 'Teklif',

      category_all: 'Tümü',
      category_services: 'Hizmetler',
      category_education: 'Eğitim',
      category_mobility: 'Mobilite',
      category_commuting: 'İşe gidiş geliş',
      category_children: 'Çocuklar',
      category_family: 'Aile',
      category_weekend: 'Hafta sonu',
      category_sale: 'Satış',
      category_transport: 'Ulaşım',
      more_categories: 'Diğer kategoriler',

      items_per_page: 'Sayfa başına öğe:',
      page_of: 'Sayfa {{current}} / {{total}}',

      contact: 'İletişime geç',
      edit: 'Düzenle',
      delete: 'Sil',

      back_to_overview: 'Genel bakışa dön',
      my_listings_title: 'İlanlarım',
      my_listings_description:
        'Kendi ilanlarınızı oluşturun, düzenleyin ve yönetin.',
      create_listing: 'İlan oluştur',
      no_own_listings: 'Henüz bir ilan oluşturmadınız.',
      create_first_listing: 'İlk ilanı oluştur',

      create_listing_title: 'İlan oluştur',
      type_and_tags: 'Tür ve kategoriler',
      type: 'Tür',
      choose_tags: 'Kategori seçin',
      choose_tags_hint:
        'En fazla {{max}} kategori seçin. Diğerlerini sonraki adımda hashtag olarak ekleyin.',
      custom_tags_optional:
        'İlanınızın daha hızlı bulunması için hashtag ekleyin',
      custom_tags_placeholder:
        'örn. bitkiler, acil (virgülle ayrılmış)',
      custom_tags_hint:
        'Ek hashtag’ler kartınızda görünür ve bir ilan onları kullandığı sürece kategori sekmesi olur.',
      next: 'İleri',
      back: 'Geri',
      details: 'Detaylar',
      title: 'Başlık',
      description: 'Açıklama',
      location: 'Konum',
      contact_and_preview: 'İletişim ve önizleme',
      email: 'E-posta',
      email_from_account:
        'Üniversite hesabınızdan otomatik olarak alınır.',
      preview: 'Önizleme',
      publish: 'Yayınla',
      saving: 'Kaydediliyor...',

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

      // Login page
      login_subtitle:
        'Üniversite e-posta adresinizle giriş yapın. Size tek kullanımlık bir giriş bağlantısı göndereceğiz.',
      login_privacy_notice:
        'Verilerinizin nasıl işlendiğine dair bilgileri',
      privacy_policy_link: 'Gizlilik Politikası',
      imprint_link: 'Yasal Bildirim',
      login_error_missing_token:
        'Giriş bağlantısı eksikti. Lütfen yeni bir tane isteyin.',
      login_error_invalid_or_expired:
        'Bu giriş bağlantısının süresi doldu veya zaten kullanıldı. Lütfen yeni bir tane isteyin.',
      email_address_label: 'E-posta adresi',
      sending_link: 'Gönderiliyor …',
      send_login_link: 'Giriş bağlantısı gönder',
      email_sent_title: 'E-posta yolda ✉️',
      email_sent_body_pre:
        'Bu adres yetkiliyse bağlantıyı kısa süre içinde gelen kutunuzda bulacaksınız:',
      email_sent_body_post:
        'Lütfen dikkat: Bağlantı yalnızca bir kez geçerlidir. Süresi dolduysa istediğiniz zaman yeni bir tane isteyebilirsiniz.',
      error_forbidden_domain:
        'Lütfen üniversite e-posta adresinizi kullanın.',
      error_invalid_email: 'Lütfen geçerli bir e-posta adresi girin.',
      error_too_many_requests:
        'Çok fazla istek. Lütfen daha sonra tekrar deneyin.',
      error_unknown: 'Bir şeyler ters gitti. Lütfen tekrar deneyin.',

      // Verify prompt page
      invalid_link_title: 'Geçersiz bağlantı',
      invalid_link_body: 'Giriş bağlantısı eksikti.',
      request_new_link: 'Yeni bağlantı iste',
      verify_prompt_subtitle: 'Giriş yapmak için düğmeye tıklayın.',
      verify_now: 'Şimdi giriş yap',

      // 404 page
      not_found_title: 'Sayfa bulunamadı',
      not_found_body: 'İstenen sayfa mevcut değil.',
      go_home: 'Ana sayfaya git',

      // Scroll to top
      scroll_to_top: 'Yukarı dön',

      // Edit listing page
      edit_listing_title: 'İlanı düzenle',
      tags_label: 'Etiketler (virgülle ayrılmış)',
      save_changes: 'Değişiklikleri kaydet',

      // Listing validation error codes returned by server actions
      error_type_invalid: 'Lütfen geçerli bir tür seçin.',
      error_title_too_short: 'Başlık en az 3 karakter olmalıdır.',
      error_title_too_long: 'Başlık en fazla 120 karakter olabilir.',
      error_description_too_short: 'Açıklama en az 10 karakter olmalıdır.',
      error_description_too_long: 'Açıklama en fazla 2000 karakter olabilir.',
      error_tag_empty: 'Etiketler boş olamaz.',
      error_tag_too_long: 'Her etiket en fazla 40 karakter olabilir.',
      error_tags_too_many: 'En fazla 8 etiket ekleyebilirsiniz.',
      error_location_required: 'Konum gereklidir.',
      error_location_too_long: 'Konum en fazla 80 karakter olabilir.',
      error_invalid_id: 'Geçersiz ilan kimliği.',
      error_not_found: 'İlan bulunamadı.',
    },
  },

  es: {
    translation: {
      search_placeholder: '¿Qué estás buscando?',
      location_label: 'Ubicación',
      disclaimer_btn: 'Aviso Legal',
      account_menu: 'Menú de la cuenta',
      manage_listings: 'Publicar un anuncio',
      my_entries: 'Mis anuncios',
      logout: 'Cerrar sesión',

      location_enter: 'Introducir ubicación...',
      gps_use: 'Usar ubicación GPS',
      gps_loading: 'Determinando ubicación...',
      gps_unavailable:
        'El GPS no está disponible en este dispositivo.',
      gps_error: 'No se pudo determinar la ubicación.',
      radius: 'Radio',

      mode_need: 'Busco',
      mode_offer: 'Ofrezco',

      category_all: 'Todos',
      category_services: 'Servicios',
      category_education: 'Educación',
      category_mobility: 'Movilidad',
      category_commuting: 'Desplazamiento',
      category_children: 'Niños',
      category_family: 'Familia',
      category_weekend: 'Fin de semana',
      category_sale: 'Venta',
      category_transport: 'Transporte',
      more_categories: 'Más categorías',

      items_per_page: 'Elementos por página:',
      page_of: 'Página {{current}} de {{total}}',

      contact: 'Contactar',
      edit: 'Editar',
      delete: 'Eliminar',

      back_to_overview: 'Volver al resumen',
      my_listings_title: 'Mis anuncios',
      my_listings_description:
        'Crea, edita y gestiona tus propios anuncios.',
      create_listing: 'Crear anuncio',
      no_own_listings: 'Aún no has creado ningún anuncio.',
      create_first_listing: 'Crear el primer anuncio',

      create_listing_title: 'Crear anuncio',
      type_and_tags: 'Tipo y categorías',
      type: 'Tipo',
      choose_tags: 'Elegir categorías',
      choose_tags_hint:
        'Elige hasta {{max}} categorías. Lo demás se añade como hashtag en el siguiente paso.',
      custom_tags_optional:
        'Añade hashtags para que encuentren tu anuncio antes',
      custom_tags_placeholder:
        'p. ej. plantas, urgente (separadas por comas)',
      custom_tags_hint:
        'Los hashtags adicionales aparecen en tu anuncio y se convierten en una pestaña de categoría mientras algún anuncio los use.',
      next: 'Siguiente',
      back: 'Atrás',
      details: 'Detalles',
      title: 'Título',
      description: 'Descripción',
      location: 'Ubicación',
      contact_and_preview: 'Contacto y vista previa',
      email: 'Correo electrónico',
      email_from_account:
        'Se toma automáticamente de tu cuenta universitaria.',
      preview: 'Vista previa',
      publish: 'Publicar',
      saving: 'Guardando...',

      disclaimer_title: 'Aviso Legal',
      close: 'Cerrar',
      disclaimer_bullet1_pre:
        'Solo las personas con una dirección de correo',
      disclaimer_bullet1_post:
        'válida tienen acceso a esta página.',
      disclaimer_bullet2_pre:
        'Todas las personas con una dirección de correo',
      disclaimer_bullet2_post:
        'válida pueden ver toda la información aquí mostrada y enviar sus propios anuncios de Busco/Ofrezco.',
      disclaimer_bullet3: 'No se almacenan registros.',
      click_to_close: 'Haga clic para cerrar',

      no_results: 'Sin resultados',
      try_different: 'Pruebe con otros criterios de búsqueda',

      aria_tag: 'Etiqueta: {{tag}}',
      aria_location: 'Ubicación: {{location}}',

      // Login page
      login_subtitle:
        'Inicia sesión con tu dirección de correo universitaria. Te enviaremos un enlace de acceso de un solo uso.',
      login_privacy_notice:
        'Encontrarás información sobre el tratamiento de tus datos en nuestra',
      privacy_policy_link: 'Política de privacidad',
      imprint_link: 'Aviso legal',
      login_error_missing_token:
        'El enlace de acceso estaba incompleto. Solicita uno nuevo.',
      login_error_invalid_or_expired:
        'Este enlace de acceso ha caducado o ya se ha utilizado. Solicita uno nuevo.',
      email_address_label: 'Dirección de correo electrónico',
      sending_link: 'Enviando …',
      send_login_link: 'Enviar enlace de acceso',
      email_sent_title: 'Correo en camino ✉️',
      email_sent_body_pre:
        'Si esta dirección está autorizada, encontrarás el enlace en tu bandeja de entrada:',
      email_sent_body_post:
        'Ten en cuenta: el enlace solo es válido una vez. Si ha caducado, puedes solicitar uno nuevo en cualquier momento.',
      error_forbidden_domain:
        'Utiliza tu dirección de correo universitaria.',
      error_invalid_email: 'Introduce una dirección de correo válida.',
      error_too_many_requests:
        'Demasiadas solicitudes. Inténtalo de nuevo más tarde.',
      error_unknown: 'Algo salió mal. Inténtalo de nuevo.',

      // Verify prompt page
      invalid_link_title: 'Enlace no válido',
      invalid_link_body: 'El enlace de acceso estaba incompleto.',
      request_new_link: 'Solicitar un nuevo enlace',
      verify_prompt_subtitle: 'Haz clic en el botón para iniciar sesión.',
      verify_now: 'Iniciar sesión ahora',

      // 404 page
      not_found_title: 'Página no encontrada',
      not_found_body: 'La página solicitada no existe.',
      go_home: 'Ir al inicio',

      // Scroll to top
      scroll_to_top: 'Volver arriba',

      // Edit listing page
      edit_listing_title: 'Editar anuncio',
      tags_label: 'Etiquetas (separadas por comas)',
      save_changes: 'Guardar cambios',

      // Listing validation error codes returned by server actions
      error_type_invalid: 'Selecciona un tipo válido.',
      error_title_too_short: 'El título debe tener al menos 3 caracteres.',
      error_title_too_long: 'El título no puede superar los 120 caracteres.',
      error_description_too_short: 'La descripción debe tener al menos 10 caracteres.',
      error_description_too_long: 'La descripción no puede superar los 2000 caracteres.',
      error_tag_empty: 'Las etiquetas no pueden estar vacías.',
      error_tag_too_long: 'Cada etiqueta puede tener como máximo 40 caracteres.',
      error_tags_too_many: 'Puedes añadir como máximo 8 etiquetas.',
      error_location_required: 'La ubicación es obligatoria.',
      error_location_too_long: 'La ubicación no puede superar los 80 caracteres.',
      error_invalid_id: 'ID de anuncio no válido.',
      error_not_found: 'Anuncio no encontrado.',
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
