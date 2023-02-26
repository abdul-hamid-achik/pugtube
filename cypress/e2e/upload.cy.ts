import { faker } from "@faker-js/faker";

describe('Upload', () => {
  beforeEach(() => {
    cy.signIn("demo@pugtube.dev", "password");
  });

  it('should redirect to watch after uploading a video', () => {
    cy.visit('/upload');
    cy.get('input[name="title"]').type(faker.lorem.sentence());
    cy.get('textarea[name="description"]').type(faker.lorem.paragraph());
    cy.get('input[name="category"]').type(faker.lorem.word());

    cy.fixture('videos/original.mp4', 'binary').then(Cypress.Blob.binaryStringToBlob).then(fileContent => {
      cy.get('input[name="files[]"]').attachFile({ fileContent, fileName: 'original.mp4', mimeType: 'video/mp4' });
      cy.get('button[type="submit"]').click();
    });

    cy.location('pathname').should('match', /\/watch\/[a-zA-Z0-9]+/);
  });
});

export { };
