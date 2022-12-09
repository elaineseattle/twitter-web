"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk = require("chalk");
const express = require("express");
const build_client_1 = require("./build-client");
const constants_1 = require("./constants");
const db_1 = require("./db");
const seed_1 = require("./seed");
const apollo_server_1 = require("./apollo-server");
const http_1 = require("http");
const app = express();
async function main() {
    console.log([
        chalk.bgBlueBright.white.bold(' Building UI and serving on '),
        chalk.bgWhite.black('\thttp://localhost:1234\t\t'),
    ].join(' '));
    (0, build_client_1.watchClientBuild)();
    const db = new db_1.default(constants_1.DB_FILE_PATH);
    await db.initDefaults();
    await (0, seed_1.seedDb)(db);
    app.use('/static', express.static(constants_1.STATIC_ROOT_FOLDER_PATH));
    const httpServer = (0, http_1.createServer)(app);
    const apolloServer = await (0, apollo_server_1.createApolloServer)(db, httpServer, app);
    await new Promise((resolve) => app.listen(constants_1.PORT, () => {
        console.log([
            chalk.bgMagentaBright.black.bold(' GraphQL API listening on   '),
            chalk.bgWhite.black(`\thttp://localhost:${constants_1.PORT}${apolloServer.graphqlPath}\t`),
        ].join(' '));
        resolve();
    }));
}
main().catch((err) => {
    console.error(err);
});
