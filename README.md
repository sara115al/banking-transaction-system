
## Setup
Install the project's dependancies via `npm i`.

Compile Typescript using `npm run compile`.

Run `node initDb.js` to initialize a test database.

## How to Use
Start the NestJS server with either `npm run start` or `nest start`.
Then use Postman, Thunderclient for VSCode, or any other API client to hit the API.
The API runs on `localhost:3000`.

## Testing
Each module has its own set of unit tests, aside from the controllers. The controllers are tested within the integration tests.

There are unit tests and integration tests. Unit tests leverage mocks to ensure an individual module is working as expected. Each integration test suite
uses a test sqlite database, which are initialized cleaned up before and after the tests.

To run the tests, use: `npm t`
