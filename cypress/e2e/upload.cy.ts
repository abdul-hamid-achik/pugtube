import { faker } from "@faker-js/faker";

describe('Upload', () => {
  beforeEach(() => {
    cy.session('signed-in', () => {
      cy.signIn("demo@pugtube.dev", "clerkpassword1234");
    });
  });

  it('should redirect to watch after uploading a video', () => {
    cy.visit('/upload');
    cy.get('input[name="title"]').type(faker.lorem.sentence(4));
    cy.get('textarea[name="description"]').type(faker.lorem.paragraph(1));
    cy.get('input[name="category"]').type(faker.lorem.word({
      length: {
        min: 3,
        max: 10,
      }
    }));

    cy.fixture('videos/original.mp4', 'binary').then(Cypress.Blob.binaryStringToBlob).then(fileContent => {
      cy.get('input[name="files[]"]').attachFile({ fileContent, fileName: 'original.mp4', mimeType: 'video/mp4' });
      cy.get('button[type="submit"]').click();
    });

    cy.location('pathname').should('match', /\/upload\/status/g);
  });
});

export { };
