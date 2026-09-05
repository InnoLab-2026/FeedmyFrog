describe('Marketplace E2E Tests', () => {
  beforeEach(() => {
    // Visit the home page (assuming user session/cookie or login page redirect)
    cy.visit('/');
  });

  it('should load the page and display the header or redirect to login', () => {
    // If unauthenticated, Next.js redirects to /login
    cy.url().should('match', /\/(login)?$/);
  });

  it('should allow navigating to legal pages (Datenschutz & Impressum)', () => {
    cy.visit('/datenschutz');
    cy.get('h1').should('exist');

    cy.visit('/impressum');
    cy.get('h1').should('exist');
  });
});
