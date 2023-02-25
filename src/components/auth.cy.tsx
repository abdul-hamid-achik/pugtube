import { SessionProvider } from 'next-auth/react';
import Auth from './auth';

describe(
    'Auth',
    () => {
        it(
            'should render correctly',
            () => {
                cy.mount(
                    <SessionProvider>
                        <Auth />
                    </SessionProvider>
                );
            },
        );
    },
)