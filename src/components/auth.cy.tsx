import Auth from './auth';

describe(
    'Auth',
    () => {
        it(
            'should render correctly',
            () => {
                cy.mount(<Auth />);
            },
        );
    },
)