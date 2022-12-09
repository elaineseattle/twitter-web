"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApolloServer = void 0;
const apollo_server_core_1 = require("apollo-server-core");
const apollo_server_express_1 = require("apollo-server-express");
const graphql_file_loader_1 = require("@graphql-tools/graphql-file-loader");
const load_1 = require("@graphql-tools/load");
const schema_1 = require("@graphql-tools/schema");
const constants_1 = require("./constants");
const resolvers_1 = require("./resolvers");
const SCHEMA = (0, load_1.loadSchemaSync)(constants_1.GRAPHQL_SCHEMA_PATH, {
    loaders: [new graphql_file_loader_1.GraphQLFileLoader()],
});
async function createApolloServer(db, httpServer, app) {
    const server = new apollo_server_express_1.ApolloServer({
        schema: (0, schema_1.addResolversToSchema)({
            schema: SCHEMA,
            resolvers: resolvers_1.default,
        }),
        resolvers: resolvers_1.default,
        context: () => ({
            db,
            dbTweetCache: {},
            dbTweetToFavoriteCountMap: {},
            dbUserCache: {},
        }),
        plugins: [
            (0, apollo_server_core_1.ApolloServerPluginDrainHttpServer)({ httpServer }),
        ],
    });
    await server.start();
    server.applyMiddleware({ app });
    return server;
}
exports.createApolloServer = createApolloServer;
