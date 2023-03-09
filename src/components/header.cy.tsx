import { ClerkProvider } from '@clerk/nextjs';
import MockRouter from '@cypress/utils/mock-router';
import Header from "./header";

describe(
    "Header",
    () => {
        it(
            "should render correctly",
            () => {
                cy.mount(
                    <MockRouter>
                        <ClerkProvider>
                            <Header />
                        </ClerkProvider>
                    </MockRouter>
                );
            },
        );

        it('should render search input', () => {
            cy.mount(
                <MockRouter>
                    <ClerkProvider>
                        <Header />
                    </ClerkProvider>
                </MockRouter>
            );
            cy.findByTestId('search-input').should('exist');
        });

        it('should render search button', () => {
            cy.mount(
                <MockRouter>
                    <ClerkProvider>
                        <Header />
                    </ClerkProvider>
                </MockRouter>
            );
            cy.findByTestId('search-button').should('exist');
        });

        it('should render upload button', () => {
            cy.mount(
                <MockRouter>
                    <ClerkProvider>
                        <Header />
                    </ClerkProvider>
                </MockRouter>
            );
            cy.findByText('Upload').should('exist');
        });

        it.skip('should render sign in button', () => {
            cy.mount(
                <MockRouter>
                    <ClerkProvider>
                        <Header />
                    </ClerkProvider>
                </MockRouter>
            );
            cy.findByText('Sign in').should('exist');
        });

        it.skip('should render sign up button', () => {
            cy.mount(
                <MockRouter>
                    <ClerkProvider>
                        <Header />
                    </ClerkProvider>
                </MockRouter>
            );
            cy.findByText('Sign up').should('exist');
        });

        it.skip('should render user button', () => {
            cy.session('signed-in', () => {
                cy.signIn("demo@pugtube.dev", "clerkpassword1234");
            });

            cy.mount(
                <MockRouter>
                    <ClerkProvider>
                        <Header />
                    </ClerkProvider>
                </MockRouter>
            );
            cy.findByText('User').should('exist');
        });
    },
)