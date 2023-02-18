import Header from "./header";

describe(
    "Header",
    () => {
        it(
            "should render correctly",
            () => {
                cy.mount(<Header />);
            },
        );
    },
)