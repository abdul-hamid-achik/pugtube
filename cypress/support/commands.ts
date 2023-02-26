/// <reference types="cypress" />
import '@testing-library/cypress/add-commands';
import 'cypress-file-upload';
import { signIn } from 'next-auth/react';

Cypress.Commands.add('signIn', (email: string, password: string) => {
    cy.log(`🔐 Sign in as ${email}`)
    return cy.wrap(signIn('credentials', { redirect: false, email, password }))
})

export { };
