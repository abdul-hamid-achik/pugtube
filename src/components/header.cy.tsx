import { SessionProvider } from 'next-auth/react';
import Header from "./header";

describe(
    "Header",
    () => {
        it(
            "should render correctly",
            () => {
                cy.mount(
                    <SessionProvider>
                        <Header />
                    </SessionProvider>
                );
            },
        );
    },
)