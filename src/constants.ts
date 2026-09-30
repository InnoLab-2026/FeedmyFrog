/**
 * Product name. A brand, so it reads the same in every language.
 *
 * Everything else already said FeedmyFrog: the domain, the logo wordmark, the
 * repository, and the copyright line in the footer. This was the last surface
 * saying something different, and it drove the page titles, the login and
 * verify headings, and — the one that matters most — the display name on the
 * magic-link mail.
 *
 * That mail is sent from `noreply@feedmyfrog.click`. A display name that does
 * not match the domain it is sent from is the shape of a phishing mail, and it
 * is the shape of the one mail this product sends that asks somebody to click
 * a link and be signed in. Making the two agree is worth more than the
 * descriptive name was.
 *
 * The institution is not lost by this: `app_description` says what the
 * platform is, and the Impressum and Datenschutz pages name Hochschule
 * Reutlingen as the responsible body, which is where that belongs legally.
 */
export const APP_NAME = 'FeedmyFrog';

/*
 * The card elevation, as a token rather than a literal, so the one shadow
 * every card shares changes with the theme. A shadow keeps its geometry
 * across themes and changes only its darkness, which is why the value lives
 * in theme.css and this is a reference to it.
 */
export const CARD_SHADOW = 'var(--elevation-card)';
