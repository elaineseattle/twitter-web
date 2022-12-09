"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import Query from './resolvers/Query'
const Tweet_1 = require("./resolvers/Tweet");
const User_1 = require("./resolvers/User");
const Mutation_1 = require("./resolvers/Mutation");
const Trend_1 = require("./resolvers/Trend");
const Query_1 = require("./resolvers/Query");
const resolvers = {
    Query: Query_1.default,
    Mutation: Mutation_1.default,
    Tweet: Tweet_1.default,
    User: User_1.default,
    Trend: Trend_1.default,
};
exports.default = resolvers;
