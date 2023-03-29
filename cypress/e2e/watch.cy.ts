import { faker } from "@faker-js/faker";

describe("authenticated", () => {
  beforeEach(() => {
    cy.visit("/")
      .window()
      .should("have.property", "Clerk")
      .session("signed-in", () => {
        cy.signIn("demo@pugtube.dev", "clerkpassword1234");
      })
      .visit("/watch/random");
  });

  it("should display comment form when authenticated", () => {
    cy.get("form").should("be.visible");
  });

  it("should submit a comment when authenticated", () => {
    const comment = faker.lorem.sentence(3);
    cy.get("textarea").type(comment).get("button[type='submit']").click();
    cy.contains(comment).should("be.visible");
  });

  it.skip("should display the edit button if the user is the author", () => {
    cy.get("[data-testid='video-author-channel']").then(($authorLink) => {
      const author = $authorLink.text().substr(1); // Remove the '@' character
      cy.get(`a[href*='/channel/${author}']`)
        .contains("Edit")
        .should("be.visible");
    });
  });
});
describe("unauthenticated", () => {
  beforeEach(() => {
    cy.visit("/watch/random");
  });

  it("should display video player", () => {
    cy.get("video").should("be.visible");
  });

  it("should display the author's channel link", () => {
    cy.get("[data-testid='video-author-channel']").should("be.visible");
  });

  it("should display the video title", () => {
    cy.get("[data-testid='video-title']").should("be.visible");
  });

  it("should display the video likes", () => {
    cy.get("[data-testid='video-likes']").should("be.visible");
  });

  it.skip("should display the comments section", () => {
    cy.get("[data-testid='video-comments']").should("be.visible");
  });

  it.skip("should display the video views", () => {
    cy.get("[data-testid='video-views']").should("be.visible");
  });

  it("should display the video created date", () => {
    cy.get("[data-testid='video-created-at']").should("be.visible");
  });
});

export {};
