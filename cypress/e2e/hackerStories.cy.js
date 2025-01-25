import { faker } from "@faker-js/faker";

describe("Hacker Stories", () => {
  const initialTerm = "React";
  const newTerm = "Cypress";

  context("Hittin the real API", () => {
    beforeEach(() => {
      cy.intercept({
        method: "GET",
        pathname: "**/search",
        query: { query: initialTerm, page: "0" },
      }).as("getStories");
      cy.visit("/");

      cy.wait("@getStories");
    });

    it('shows 20 stories, then the next 20 after clicking "More"', () => {
      cy.get(".item").should("have.length", 20);
      cy.intercept({
        method: "GET",
        pathname: "**/search",
        query: { query: initialTerm, page: "1" },
      }).as("getNextStories");

      cy.contains("More").should("be.visible").click();
      cy.wait("@getNextStories");

      cy.get(".item").should("have.length", 40);
    });

    it("searches via the last searched term", () => {
      cy.intercept("GET", `**/search?query=${newTerm}&page=0`).as("getStories");
      cy.get("#search").should("be.visible").clear().type(`${newTerm}{enter}`);

      cy.assertLoadingIsShownAndHidden();

      cy.get(`button:contains(${initialTerm})`).should("be.visible").click();

      cy.assertLoadingIsShownAndHidden();

      cy.get(".item").should("have.length", 20);
      cy.get(".item")
        .should("be.visible")
        .first()
        .should("contain", initialTerm);
      cy.get(`button:contains(${newTerm})`).should("be.visible");
    });
  });

  context("Mocking the API", () => {
    context("Footer and list of stores", () => {
      beforeEach(() => {
        cy.intercept("GET", `**/search?query=${initialTerm}&page=0`, {
          fixture: "stories",
        }).as("getStories");
        cy.visit("/");
        cy.wait("@getStories");
      });

      it("shows the footer", () => {
        cy.get("footer")
          .should("be.visible")
          .and("contain", "Icons made by Freepik from www.flaticon.com");
      });
      context("List of stories", () => {
        it("shows the right data for all rendered stories", () => {
          cy.fixture("stories").then((story) => {
            cy.get("div > .item")
              .should("be.visible")
              .first()
              .should("contain", story.hits[0].title)
              .should("contain", story.hits[0].author)
              .should("contain", story.hits[0].num_comments)
              .should("contain", story.hits[0].points);

            cy.get("div > .item")
              .last()
              .should("be.visible")
              .should("contain", story.hits[1].title)
              .should("contain", story.hits[1].author)
              .should("contain", story.hits[1].num_comments)
              .should("contain", story.hits[1].points);
          });
        });

        it("shows one less story after dimissing the first one", () => {
          cy.get(".button-small").first().should("be.visible").click();

          cy.get(".item").should("have.length", 1);
        });

        // Since the API is external,
        // I can't control what it will provide to the frontend,
        // and so, how can I test ordering?
        // This is why these tests are being skipped.
        // TODO: Find a way to test them out.
        context("Order by", () => {
          it("orders by title", () => {
            cy.get(`.list-header-button:contains("Title")`)
              .as("titleHeader")
              .should("be.visible")
              .click();

            cy.fixture("stories").then((story) => {
              cy.get(".item")
                .first()
                .should("be.visible")
                .should("contain", story.hits[0].title);
              cy.get(".item a")
                .first()
                .should("have.attr", "href", story.hits[0].url);

              cy.get("@titleHeader").click();
              cy.get(".item")
                .first()
                .should("be.visible")
                .should("contain", story.hits[1].title);
              cy.get(".item a")
                .first()
                .should("have.attr", "href", story.hits[1].url);
            });
          });

          it("orders by author", () => {
            cy.get(`.list-header-button:contains("Author")`)
              .as("authorHeader")
              .should("be.visible")
              .click();
            cy.fixture("stories").then((story) => {
              cy.get(".item")
                .first()
                .should("be.visible")
                .should("contain", story.hits[0].author);

              cy.get("@authorHeader").click();
              cy.get(".item")
                .first()
                .should("be.visible")
                .should("contain", story.hits[1].author);
            });
          });

          it("orders by comments", () => {
            cy.get(`.list-header-button:contains("Comments")`)
              .as("commentsHeader")
              .should("be.visible")
              .click();
            cy.fixture("stories").then((story) => {
              cy.get(".item")
                .first()
                .should("be.visible")
                .should("contain", story.hits[1].num_comments);

              cy.get("@commentsHeader").click();
              cy.get(".item")
                .first()
                .should("be.visible")
                .should("contain", story.hits[0].num_comments);
            });
          });

          it("orders by points", () => {
            cy.get(`.list-header-button:contains("Points")`)
              .as("pointsHeader")
              .should("be.visible")
              .click();
            cy.fixture("stories").then((story) => {
              cy.get(".item")
                .first()
                .should("be.visible")
                .should("contain", story.hits[1].points);

              cy.get("@pointsHeader").click();
              cy.get(".item")
                .first()
                .should("be.visible")
                .should("contain", story.hits[0].points);
            });
          });
        });
      });
    });

    context("Search", () => {
      beforeEach(() => {
        cy.intercept("GET", `**/search?query=${initialTerm}&page=0`, {
          fixture: "empty",
        }).as("getEmptyStories");
        cy.intercept("GET", `**/search?query=${newTerm}&page=0`, {
          fixture: "stories",
        }).as("getStories");
        cy.visit("/");
        cy.wait("@getEmptyStories");
        cy.get("#search").should("be.visible").clear();
      });

      it("shows no story when none is returned", () => {
        cy.get(".item").should("not.exist");
      });

      it("types and hits ENTER", () => {
        cy.get("#search").should("be.visible").type(`${newTerm}{enter}`);

        cy.wait("@getStories");

        cy.get(".item").should("have.length", 2);

        cy.get(`button:contains(${initialTerm})`).should("be.visible");
      });

      it("types and clicks the submit button", () => {
        cy.get("#search").should("be.visible").type(newTerm);
        cy.contains("Submit").should("be.visible").click();

        cy.wait("@getStories");

        cy.get(".item").should("have.length", 2);
        cy.get(`button:contains(${initialTerm})`).should("be.visible");
      });

      it("types and submit the form directly", () => {
        cy.get("#search").should("be.visible").type(newTerm);
        cy.get("form").should("be.visible").submit();

        cy.wait("@getStories");

        cy.get(".item").should("have.length", 2);
      });

      context("Last searches", () => {
        it("shows a max of 5 buttons for the last searched terms", () => {
          Cypress._.times(6, () => {
            const randomTerm = faker.word.adjective();
            cy.intercept("GET", `**/search**`, { fixture: "empty" }).as(
              "getRandomTermStories"
            );
            cy.get("#search")
              .should("be.visible")
              .clear()
              .type(`${randomTerm}{enter}`);
            cy.wait("@getRandomTermStories");
          });

          cy.get(".last-searches button").should("have.length", 5);
        });
      });
    });
  });
});

context("Errors", () => {
  it('shows "Something went wrong ..." in case of a server error', () => {
    cy.intercept("GET", "**/search**", { statusCode: 500 }).as(
      "getServerFailure"
    );

    cy.visit("/");
    cy.wait("@getServerFailure");
    cy.get("p:contains(Something went wrong ...)").should("be.visible");
  });

  it('shows "Something went wrong ..." in case of a network error', () => {
    cy.intercept("GET", "**/search**", { forceNetworkError: true }).as(
      "getNetworkFailure"
    );

    cy.visit("/");
    cy.wait("@getNetworkFailure");
    cy.get("p:contains(Something went wrong ...)").should("be.visible");
  });
});
