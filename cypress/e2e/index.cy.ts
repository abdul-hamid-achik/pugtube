import { faker } from "@faker-js/faker";

// TODO: Add tests for an authenticated user

describe("Index", () => {
  it("should redirect to /watch/videoId when clicking on a video", () => {
    cy.visit("/");

    cy.get('[data-testid="video-card"]:first').click();

    cy.url().should("match", /\/watch\/[a-zA-Z0-9_-]+/);
  });

  it("should redirect to /channel/:userName when clicking on author link", () => {
    cy.visit("/");

    cy.get('[data-testid="video-card-author"]:first').click();

    cy.url().should("match", /\/channel\/[a-zA-Z0-9_-]+/);
  });

  it("should redirect to /results/:searchTerm when submitting a search query", () => {
    cy.visit("/");

    const searchTerm = faker.lorem.words(2).replace(/\s+/g, "+");

    cy.get('[data-testid="search-input"]').type(`${searchTerm}{enter}`);

    cy.url().should(
      "match",
      new RegExp(`\\/results\\/${searchTerm.replace(/\+/g, "\\+")}(\\?.*)?$`)
    );
  });
});

export {};
