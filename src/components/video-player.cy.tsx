import VideoPlayer from "./video-player";

describe(
    "VideoPlayer",
    () => {
        it(
            "should render correctly",
            () => {
                cy.mount(<VideoPlayer src={""} />);
            },
        );
    },
)