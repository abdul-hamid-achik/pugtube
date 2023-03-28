import { faker } from "@faker-js/faker";
import VideoCard from "./video-card";
import { ClerkProvider } from "@clerk/nextjs";
import MockRouter from "@cypress/utils/mock-router";

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
};

const video = {
  id: faker.random.alphaNumeric(),
  title: faker.lorem.sentence(),
  description: faker.lorem.paragraph(),
  duration: parseFloat(faker.random.numeric()),
  thumbnailUrl: faker.image.imageUrl(),
  category: faker.random.word(),
  createdAt: new Date(),
  userId: faker.random.alphaNumeric(),
  uploadId: faker.random.alphaNumeric(),
  hlsPlaylistId: faker.random.alphaNumeric(),
  previewUrl: "",
};

describe("VideoCard", () => {
  it("should render correctly", () => {
    cy.mount(
      <MockRouter>
        <ClerkProvider>
          <VideoCard video={video} author={author} />
        </ClerkProvider>
      </MockRouter>
    );
  });
});
