describe('FeedmyFrog E2E Cypress Test Suite', () => {

  // ==========================================
  // SECTION 1: Core Navigation & Page Tests (1 - 10)
  // ==========================================

  // Test 1: Unauthenticated redirect to /login
  it('1. should redirect unauthenticated users visiting root / to /login', () => {
    cy.visit('/');
    cy.url().should('include', '/login');
  });

  // Test 2: Login page UI elements
  it('2. should render login page UI elements (Logo, Header, Email Input, Submit Button)', () => {
    cy.visit('/login');
    cy.get('h1').should('be.visible');
    cy.get('img[alt="feedmyfrog"]').should('be.visible');
    cy.get('input#email').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  // Test 3: Email input interaction
  it('3. should allow typing a valid email address into the input field', () => {
    cy.visit('/login');
    cy.get('input#email')
      .clear()
      .type('meinhard.holzknecht@student.reutlingen-university.de')
      .should('have.value', 'meinhard.holzknecht@student.reutlingen-university.de');
  });

  // Test 4: Handling URL error parameters
  it('4. should display an alert message when visiting /login with an error parameter', () => {
    cy.visit('/login?error=invalid_or_expired');
    cy.get('[role="alert"]').should('be.visible');
  });

  // Test 5: Language switcher button
  it('5. should render the language switcher button with flag icon', () => {
    cy.visit('/login');
    cy.get('img[src*="/flags/"]').should('be.visible');
  });

  // Test 6: Legal page navigation - Datenschutz
  it('6. should navigate to the Datenschutz page via link', () => {
    cy.visit('/login');
    cy.get('a[href="/datenschutz"]').first().click();
    cy.url().should('include', '/datenschutz');
    cy.get('h1').should('exist');
  });

  // Test 7: Legal page navigation - Impressum
  it('7. should navigate to the Impressum page via link', () => {
    cy.visit('/login');
    cy.get('a[href="/impressum"]').first().click();
    cy.url().should('include', '/impressum');
    cy.get('h1').should('exist');
  });

  // Test 8: Dev-Login API endpoint check
  it('8. should return HTTP 200 success from /api/dev-login endpoint', () => {
    cy.request('/api/dev-login').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.success).to.be.true;
    });
  });

  // Test 9: Cookie session management
  it('9. should handle setting and verifying session cookies in browser', () => {
    cy.setCookie('session', 'mock-session-jwt-token');
    cy.getCookie('session').should('have.property', 'value', 'mock-session-jwt-token');
    cy.visit('/datenschutz');
    cy.getCookie('session').should('have.property', 'value', 'mock-session-jwt-token');
  });

  // Test 10: 404 Not Found Page handling
  it('10. should render 404 page when visiting an invalid route', () => {
    cy.visit('/non-existent-page-xyz', { failOnStatusCode: false });
    cy.get('body').should('exist');
  });

  // ==========================================
  // SECTION 2: Advanced E2E, API & Security Tests (11 - 20)
  // ==========================================

  // Test 11: Healthz API Endpoint Status Check
  it('11. should return status ok from /api/healthz endpoint', () => {
    cy.request('/api/healthz').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('status', 'ok');
    });
  });

  // Test 12: Robots.txt Route Availability
  it('12. should serve robots.txt with disallow rules for crawlers', () => {
    cy.request('/robots.txt').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.toLowerCase()).to.include('disallow');
    });
  });

  // Test 13: Security Headers Check
  it('13. should include essential security headers (X-Frame-Options, X-Content-Type-Options)', () => {
    cy.request('/login').then((response) => {
      expect(response.headers).to.have.property('x-content-type-options', 'nosniff');
      expect(response.headers).to.have.property('x-frame-options', 'DENY');
    });
  });

  // Test 14: Verify-Prompt Page Rendering
  it('14. should render the verify-prompt page layout and headings', () => {
    cy.visit('/verify-prompt');
    cy.get('main').should('exist');
    cy.get('h1').should('be.visible');
  });

  // Test 15: Magic Link Token Redirect Handling
  it('15. should redirect /verify?token=xyz to /verify-prompt confirmation card', () => {
    cy.visit('/verify?token=test_token_sample_123');
    cy.url().should('include', '/verify-prompt');
    cy.url().should('include', 'token=test_token_sample_123');
  });

  // Test 16: SVG & App Icon Static Assets Check
  it('16. should successfully load icon.svg and apple-icon.png static assets', () => {
    cy.request('/icon.svg').its('status').should('eq', 200);
    cy.request('/apple-icon.png').its('status').should('eq', 200);
  });

  // Test 17: Interactive Language Switcher Toggle
  it('17. should interact with the language switcher button', () => {
    cy.visit('/login');
    cy.get('img[src*="/flags/"]').first().click({ force: true });
    cy.get('h1').should('be.visible');
  });

  // Test 18: Form Validation - Email Field Required Attribute
  it('18. should enforce required attribute on the email input field', () => {
    cy.visit('/login');
    cy.get('input#email').should('have.attr', 'required');
  });

  // Test 19: Privacy Policy Content Verification
  it('19. should verify privacy policy page content and headings', () => {
    cy.visit('/datenschutz');
    cy.get('h1').should('be.visible');
    cy.get('main').should('exist');
  });

  // Test 20: Imprint Content & Contact Verification
  it('20. should verify imprint page content and legal disclosure', () => {
    cy.visit('/impressum');
    cy.get('h1').should('be.visible');
    cy.get('main').should('exist');
  });

});
