import { faker } from "@faker-js/faker";

describe('Upload', () => {
  beforeEach(() => {
    cy.session('signed-in', () => {
      cy.signIn("demo@pugtube.dev", "clerkpassword1234");
    });
  });

  const videos = [
    { fileName: 'small.mp4', name: 'Small video' },
    { fileName: 'medium.mp4', name: 'Medium video' },
    { fileName: 'large.mp4', name: 'Large video' },
  ];

  videos.forEach((video) => {
    it(`should redirect to watch after uploading a ${video.name}`, () => {
      cy.visit('/upload');
      cy.get('input[name="title"]').type(faker.lorem.sentence(3));
      cy.get('textarea[name="description"]').type(faker.lorem.paragraph(1).slice(0, 128));
      cy.get('input[name="category"]').type(faker.lorem.word({
        length: {
          min: 3,
          max: 10,
        }
      }));

      cy.fixture(`videos/${video.fileName}`, 'binary').then(Cypress.Blob.binaryStringToBlob).then((fileContent) => {
        cy.get('input[name="files[]"]').attachFile({ fileContent, fileName: video.fileName, mimeType: 'video/mp4' });
        cy.get('button[type="submit"]').click();
      });

      cy.url().should('match', /\/upload\/[a-zA-Z0-9_-]+\/status/g);
    });
  });
});

export { };
