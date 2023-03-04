/// <reference types="cypress" />
import '@testing-library/cypress/add-commands';
import 'cypress-file-upload';

Cypress.Commands.add(`signIn`, (identifier: string, password: string) => {
    cy.log(`Signing in.`);
    cy.visit(`/`);

    cy.window()
        .should((window) => {
            expect(window).to.not.have.property(`Clerk`, undefined);
            expect(window.Clerk.isReady()).to.eq(true);
        })
        .then(async (window) => {
            // @ts-ignore
            await cy.clearCookies({ domain: window.location.domain });
            const response = await window.Clerk.client.signIn.create({
                identifier,
                password

            });

            await window.Clerk.setActive({
                session: response.createdSessionId,
            });

            cy.log(`Finished Signing in.`);
        });
});

Cypress.Commands.add(`signOut`, () => {
    cy.log(`sign out by clearing all cookies.`);
    // @ts-ignore
    cy.clearCookies({ domain: null });
});

export { };
