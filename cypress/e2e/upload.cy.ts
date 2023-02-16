describe('Upload', () => {
  it('should redirect to watch after uploading a video', () => {
    cy.visit('/upload');
    cy.get('input[name="title"]').type('test video');
    cy.get('textarea[name="description"]').type('test description');
    cy.get('input[name="category"]').type('test category');
    cy.get('input[name="files[]"]').attachFile('videos/original.mp4');
    cy.get('button[type="submit"]').click();

    // Assert that the upload was successful
    cy.contains('Video uploaded successfully!');

    // Assert that the page is redirected to the correct URL after the upload
    cy.url().should('match', /\/watch\/\d+/);
  });
});

export { };
