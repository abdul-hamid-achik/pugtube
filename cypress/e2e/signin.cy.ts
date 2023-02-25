describe('Sign in', () => {
    it('should redirect to home after signing in', () => {
        cy.visit('/signin');
        cy.get('input[name="email"]').type('demo@pugtube.dev');
        cy.get('input[name="password"]').type('password');
        cy.get('button[type="submit"]').click();
        cy.location('pathname').should('eq', '/');
    });

});

export { };
