import Spinner from "./spinner";

describe(
    "Spinner",
    () => {
        it(
            "should render correctly",
            () => {
                cy.mount(<Spinner />);
            },
        );
    },
)
export { };
