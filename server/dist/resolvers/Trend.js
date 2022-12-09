"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const trendTwitterResolver = {
    __resolveType(obj, _context, _info) {
        // Only Author has a name field
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        if (typeof obj.hashtag === "string") {
            return "HashtagTrend";
        }
        else
            return "TopicTrend";
        return null; // GraphQLError is thrown
    },
};
exports.default = trendTwitterResolver;
