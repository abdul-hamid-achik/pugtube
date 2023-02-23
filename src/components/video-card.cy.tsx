import VideoCard from "./video-card";

describe(
    "VideoCard",
    () => {
        it(
            "should render correctly",
            () => {
                cy.mount(<VideoCard video={{
                    id: "",
                    title: "",
                    description: null,
                    duration: null,
                    thumbnailUrl: null,
                    category: null,
                    createdAt: new Date(),
                    userId: "",
                    originalUploadId: ""
                }} />);
            },
        );
    },
)