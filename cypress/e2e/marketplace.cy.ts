/**
 * End-to-end suite.
 *
 * Framework and the original 30 specs by Meinhard Holzknecht; reworked per
 * issue #27.
 *
 * What is deliberately NOT here: nine tests that could not fail. Asserting
 * that `cy.visit('/login?q=x')` leaves `q=x` in the URL tests the browser, not
 * this app, and the filtering it claimed to cover is already held down by
 * src/db/filters.test.ts. A test that cannot fail is worse than no test,
 * because the repository then reads as if that ground is covered.
 *
 * What is here instead: the flows that only a browser can reach — the auth
 * redirects, the security headers, the magic-link hand-off, and one full
 * create-a-listing journey through the dialog and back out to /meine.
 */
import {
  E2E_EMAIL,
  E2E_USER_ID,
  SEEDED_LISTINGS,
  SESSION_COOKIE,
} from '../fixtures/e2e-user';

/**
 * Signs in without going near the app's own surface.
 *
 * The session is minted in the Cypress Node process, which already holds
 * AUTH_SECRET, and planted as a cookie. No endpoint exists that could do this
 * over HTTP, which is the point: an endpoint that mints a valid session for an
 * unauthenticated GET is an authentication bypass in every environment where
 * the guard on it happens not to hold.
 */
function signIn() {
  cy.task('mintSession', { userId: E2E_USER_ID, email: E2E_EMAIL }).then((jwt) =>
    cy.setCookie(SESSION_COOKIE, jwt as string, {
      // The `__Host-` prefix is only accepted with all three of these.
      secure: true,
      path: '/',
      httpOnly: true,
    }),
  );
  // Pin the language so assertions can name English strings; the app resolves
  // it server-side from this cookie before it renders anything.
  cy.setCookie('lang', 'en');
}

describe('public pages and access control', () => {
  it('sends an unauthenticated visitor from / to the login page', () => {
    cy.visit('/');
    cy.url().should('include', '/login');
  });

  it('sends an unauthenticated visitor from /meine to the login page', () => {
    cy.visit('/meine');
    cy.url().should('include', '/login');
  });

  it('renders the login form', () => {
    cy.visit('/login');
    /*
     * The heading is screen-reader-only: the logo above it is the wordmark, so
     * printing the name again would say it twice. `be.visible` is no use for
     * asserting that -- an sr-only element is 1x1 and clipped, which Cypress
     * still counts as visible -- so this measures it instead.
     */
    cy.get('h1').should('exist').and('have.text', 'FeedmyFrog');
    cy.get('h1').invoke('outerWidth').should('be.lte', 1);
    cy.get('img[src*="feedmyfrog"]').should('be.visible');
    cy.get('input#email').should('be.visible').and('have.attr', 'required');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('accepts a university address in the email field', () => {
    cy.visit('/login');
    cy.get('input#email')
      .clear()
      .type(E2E_EMAIL)
      .should('have.value', E2E_EMAIL);
  });

  it('shows an alert when the login link was rejected', () => {
    cy.visit('/login?error=invalid_or_expired');
    cy.get('[role="alert"]').should('be.visible');
  });

  it('reaches the privacy policy and shows its real content', () => {
    cy.visit('/login');
    cy.get('a[href="/datenschutz"]').first().click();
    cy.url().should('include', '/datenschutz');

    // Art. 13 GDPR content, not just "an h1 exists": the retention table and
    // the named processors are the disclosure the page is there to make.
    cy.get('h1').should('be.visible');
    cy.contains('Vercel').should('exist');
    cy.contains('Neon').should('exist');
    cy.get('table').should('exist');
  });

  it('reaches the imprint and shows the responsible body', () => {
    cy.visit('/login');
    cy.get('a[href="/impressum"]').first().click();
    cy.url().should('include', '/impressum');

    cy.get('h1').should('be.visible');
    cy.contains('Reutlingen').should('exist');
  });

  it('switches language when the switcher is used', () => {
    cy.visit('/login');
    cy.setCookie('lang', 'en');
    cy.reload();

    // Capture the subtitle, click through, and assert the words changed --
    // the previous version clicked and then only checked a heading was still
    // on screen, which it would be either way.
    cy.get('[data-testid="login-subtitle"]')
      .invoke('text')
      .then((before) => {
        cy.get('img[src*="/flags/"]').first().click({ force: true });
        cy.get('[data-testid="login-subtitle"]')
          .invoke('text')
          .should((after) => {
            expect(after.trim()).not.to.eq(before.trim());
          });
      });
  });
});

describe('routes, assets and headers', () => {
  it('reports healthy from /api/healthz', () => {
    cy.request('/api/healthz').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('status', 'ok');
    });
  });

  it('serves robots.txt with disallow rules', () => {
    cy.request('/robots.txt').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.toLowerCase()).to.include('disallow');
    });
  });

  it('sets the security headers on every response', () => {
    cy.request('/login').then((response) => {
      expect(response.headers).to.have.property('x-content-type-options', 'nosniff');
      expect(response.headers).to.have.property('x-frame-options', 'DENY');
    });
  });

  it('serves the app icons', () => {
    cy.request('/icon.svg').its('status').should('eq', 200);
    cy.request('/apple-icon.png').its('status').should('eq', 200);
  });

  it('serves the logo as a PNG with an alpha channel', () => {
    /*
     * The mail puts this on a coloured band. A JPEG has no alpha channel, so
     * re-exporting it that way brings back the white rectangle this file was
     * made to remove -- and nothing about the page would look wrong.
     */
    cy.request({ url: '/feedmyfrog.png', encoding: 'binary' }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.headers['content-type']).to.include('image/png');
      expect(response.body.slice(1, 4)).to.eq('PNG');
      expect(response.body).to.include('tRNS');
    });
  });

  it('hands a magic-link token to the verify prompt', () => {
    cy.visit('/verify?token=test_token_sample_123');
    cy.url().should('include', '/verify-prompt');
    cy.url().should('include', 'token=test_token_sample_123');
  });

  it('renders the verify prompt without a token as an invalid link', () => {
    cy.visit('/verify-prompt');
    cy.get('main').should('exist');
    cy.get('h1').should('be.visible');
  });
});

describe('the marketplace, signed in', () => {
  beforeEach(signIn);

  it('shows the seeded listings instead of redirecting', () => {
    cy.visit('/');
    cy.url().should('not.include', '/login');
    cy.contains(SEEDED_LISTINGS[0].title).should('be.visible');
  });

  it('finds a listing by a word in its title', () => {
    cy.visit('/?q=Statistik');
    cy.contains(SEEDED_LISTINGS[0].title).should('be.visible');
  });

  it('finds a listing by one of its tags, which no other column contains', () => {
    // The tag arm of the search: 'Wochenende' appears in the offer's tags and
    // nowhere in its title or description.
    cy.visit('/?mode=offer&q=Wochenende');
    cy.contains(SEEDED_LISTINGS[1].title).should('be.visible');
  });

  it('separates the two modes', () => {
    cy.visit('/?mode=need');
    cy.contains(SEEDED_LISTINGS[0].title).should('be.visible');
    cy.contains(SEEDED_LISTINGS[1].title).should('not.exist');
  });

  it('shows nothing for a term nobody used', () => {
    cy.visit('/?q=zzzznotathing');
    cy.contains(SEEDED_LISTINGS[0].title).should('not.exist');
  });
});

describe('the create-listing dialog', () => {
  beforeEach(signIn);

  it('opens as a dialog, traps Escape, and returns focus', () => {
    cy.visit('/');
    cy.get('[data-testid="create-listing-trigger"]').first().click();

    cy.get('[data-testid="create-listing-dialog"]')
      .should('be.visible')
      .and('have.attr', 'aria-modal', 'true');

    cy.get('body').type('{esc}');
    cy.get('[data-testid="create-listing-dialog"]').should('not.exist');
    cy.focused().should('have.attr', 'data-testid', 'create-listing-trigger');
  });

  it('publishes a listing and shows it on /meine', () => {
    // The one journey nothing else covers: the wizard, the server action, the
    // redirect, and the row coming back out of the database on another page.
    const title = `E2E listing ${Date.now()}`;

    cy.visit('/');
    cy.get('[data-testid="create-listing-trigger"]').first().click();
    cy.get('[data-testid="create-listing-dialog"]').should('be.visible');

    // Step 1: what it is, and at least one category.
    cy.get('[data-testid="listing-type-need"]').click();
    cy.get('[data-testid="listing-category-Bildung"]').click();
    cy.get('[data-testid="wizard-next"]').click();

    // Step 2: the details.
    cy.get('[data-testid="listing-title"]').type(title);
    cy.get('[data-testid="listing-description"]').type(
      'Created by the end-to-end suite to prove the whole write path works.',
    );
    cy.get('[data-testid="listing-location"]').select('Reutlingen');
    cy.get('[data-testid="wizard-next"]').click();

    // Step 3: publish, and wait out the confirmation the form shows.
    cy.get('[data-testid="listing-publish"]').click();
    cy.get('[data-testid="create-listing-dialog"]', { timeout: 15000 }).should(
      'not.exist',
    );

    // It is on the marketplace...
    cy.contains(title, { timeout: 15000 }).should('be.visible');

    // ...and it belongs to the signed-in user, so it is on their own page too.
    cy.visit('/meine');
    cy.contains(title).should('be.visible');
  });

  it('refuses a listing whose title is too short, without celebrating', () => {
    /*
     * The regression behind this one: the confirmation used to be keyed on the
     * form being in flight rather than on the result, so a rejected listing got
     * the full-screen "published" overlay a moment before the errors appeared.
     */
    cy.visit('/');
    cy.get('[data-testid="create-listing-trigger"]').first().click();

    cy.get('[data-testid="listing-category-Bildung"]').click();
    cy.get('[data-testid="wizard-next"]').click();

    cy.get('[data-testid="listing-title"]').type('ab');
    cy.get('[data-testid="listing-description"]').type(
      'Long enough to pass its own rule, so the title is the only problem.',
    );
    cy.get('[data-testid="listing-location"]').select('Reutlingen');
    cy.get('[data-testid="wizard-next"]').click();
    cy.get('[data-testid="listing-publish"]').click();

    cy.get('[data-testid="listing-errors"]').should('be.visible');
    cy.contains('at least 3 characters').should('be.visible');
    cy.get('[data-testid="create-listing-dialog"]').should('be.visible');
  });
});
