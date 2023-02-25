import { faker } from '@faker-js/faker';

describe('Sign un', () => {
    it('should redirect to / after creating an account', () => {
        cy.visit('/signup');
        cy.get('input[name="email"]').type(faker.internet.email());
        cy.get('input[name="name"]').type(faker.name.fullName());
        cy.get('input[name="password"]').type('password');
        cy.get('button[type="submit"]').click();

        cy.location('pathname').should('eq', '/');
    });

});

export { };
