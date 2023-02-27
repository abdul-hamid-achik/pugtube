/// <reference types="cypress" />
import '@testing-library/cypress/add-commands';
import 'cypress-file-upload';

Cypress.Commands.add(`signIn`, (email: string, password: string) => {
    cy.log(`Initializing auth state.`);

    cy.visit(`/`);

    cy.window()
        .should((window) => {
            expect(window).to.not.have.property(`Clerk`, undefined);
            expect(window.Clerk.isReady()).to.eq(true);
        })
        .then(async (window) => {
            await window.Clerk.signOut();
            await window.Clerk.client.signIn.create({
                identifier: email,
                password,
            });
        });
});
export { };
