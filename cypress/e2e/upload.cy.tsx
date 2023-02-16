describe('Upload', () => {
  it('should upload a video', () => {
    cy.visit('/upload');
    cy.get('input[name="title"]').type('test video');
    cy.get('input[name="description"]').type('test description');
    cy.get('input[name="category"]').type('test category');
    cy.get('input[name="file"]').attachFile('test.mp4');
    cy.get('button[type="submit"]').click();
    cy.contains('test video');
  });
});
