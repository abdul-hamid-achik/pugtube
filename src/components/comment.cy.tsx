import { api } from '@/utils/api';
import { faker } from "@faker-js/faker";
import Comment from "./comment";

const author = {
    id: faker.random.alphaNumeric(),
    username: faker.internet.userName(),
    phoneNumbers: [],
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    profileImageUrl: faker.internet.avatar(),
    emailAddresses: [],
    passwordEnabled: false,
    totpEnabled: false,
    backupCodeEnabled: false,
    twoFactorEnabled: false,
    banned: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    gender: "test",
    primaryEmailAddressId: "test",
    primaryPhoneNumberId: "test",
    birthday: faker.date.past().toISOString(),
    primaryWeb3WalletId: "test",
    externalId: "test",
    unsafeMetadata: {},
    externalAccounts: [],
    web3Wallets: [],
    lastSignInAt: Date.now(),
    publicMetadata: {},
    privateMetadata: {},
}

const parentComment = {
    id: "1",
    text: "test",
    userId: "1",
    videoId: "1",
    parentCommentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
}
const comment = {
    id: "1",
    text: "test",
    userId: "1",
    videoId: "1",
    parentCommentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
}

const CommentCard = api.withTRPC(Comment) as any;

describe("CommentCard", () => {
    it("should render correctly", () => {
        cy.mount(
            <CommentCard
                comment={comment}
                author={author}
            />
        );
    });

    it.skip("should render correctly with parent comment", () => {
        cy.mount(
            <CommentCard
                comment={comment}
                author={author}
                parentComment={parentComment}
            />
        );

        cy.get(".comment-card__parent-comment").should("exist");
        cy.get(".comment-card__parent-comment").should("contain", parentComment.text);
    });
});

export { };


