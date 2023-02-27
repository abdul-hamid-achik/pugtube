import { ClerkProvider } from '@clerk/nextjs';
import Header from "./header";

describe(
    "Header",
    () => {
        it(
            "should render correctly",
            () => {
                cy.mount(
                    <ClerkProvider>
                        <Header />
                    </ClerkProvider>
                );
            },
        );
    },
)