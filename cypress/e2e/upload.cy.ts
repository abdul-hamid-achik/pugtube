import { faker } from "@faker-js/faker";

describe('Upload', () => {
  beforeEach(() => {
    cy.session('signed-in', () => {
      cy.signIn("demo@pugtube.dev", "clerkpassword1234");
    });
  });

  it(`should redirect to watch after uploading a small.mp4`, () => {
    cy.visit('/upload');
    cy.get('input[name="title"]').type(faker.lorem.sentence(3));
    cy.get('textarea[name="description"]').type(faker.lorem.paragraph(1).slice(0, 128));
    cy.get('input[name="category"]').type(faker.lorem.word({
      length: {
        min: 3,
        max: 10,
      }
    }));

    cy.fixture(`videos/small.mp4`, 'binary').then(Cypress.Blob.binaryStringToBlob).then((fileContent) => {
      cy.get('input[name="files[]"]').attachFile({ fileContent, fileName: "small.mp4", mimeType: 'video/mp4' });
      cy.get('button[type="submit"]').click();
    });

    cy.url().should('match', /\/upload\/[a-zA-Z0-9_-]+/g);
  });
});

export { };
