# PugTube [![Github Actions - Tests](https://github.com/sicksid/pugtube/actions/workflows/tests.yml/badge.svg)](https://github.com/sicksid/pugtube/actions/workflows/tests.yml) [![Cypress](https://img.shields.io/endpoint?url=https://cloud.cypress.io/badge/simple/jcfv2t/main&style=flat&logo=cypress)](https://cloud.cypress.io/projects/jcfv2t/runs)

PugTube is a video sharing platform where users can upload, watch and interact with videos. This project is built with the [T3 stack](https://create.t3.app/) which includes the following technologies:

- TypeScript
- React
- Next.js
- Prisma
- Planetscale
- Clerkjs
- Inngest

## Getting Started

To get started with PugTube, clone the repository and run the following commands:

```bash
pnpm install
pnpm dev
```

This will install the dependencies and start the development server.

## How do i develop with this?

```
pnpm e2e # i do all my tests here first and then this runs cypress and my tests and it reloads when i change the code, its very nice
pnpm background # this adds the inngest dev server, you need this for the transcoding and thumbnailing and more
```

## Usage

PugTube has several features that allow users to interact with the videos on the platform. These include:

- Uploading videos
- Watching videos
- Liking and disliking videos
- Commenting on videos
- Searching for videos

## Contributing

Contributions to PugTube are welcome! To contribute, please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b my-feature-branch`)
3. Make your changes
4. Commit your changes (`git commit -am 'Add some feature'`)
5. Push to the branch (`git push origin my-feature-branch`)
6. Create a new pull request

## License

PugTube is licensed under the MIT license. See the [LICENSE](LICENSE) file for more information.
