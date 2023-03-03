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
    },
)