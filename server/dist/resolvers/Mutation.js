"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable node/no-unsupported-features/es-syntax */
const transforms_1 = require("../transforms");
const mutationTwitterResolver = {
    async createTweet(_parent, args, { dbTweetCache, db }) {
        const { body, userId } = args;
        const dbTweet = await db.createTweet({
            message: body,
            userId,
        });
        const dbTweetMap = (dbTweetCache || (dbTweetCache = {}));
        dbTweetMap[dbTweet.id] = dbTweet;
        const dbAuthor = db.getUserById(userId);
        if (!dbAuthor)
            throw new Error(`No author found for ${userId}`);
        return Object.assign((0, transforms_1.tweetTransform)(dbTweet), { author: dbAuthor });
    },
    async createFavorite(_parent, args, { db }) {
        const { favorite } = args;
        const fav = await db.createFavorite(favorite);
        return {
            ...(0, transforms_1.favoriteTransform)(fav),
            user: db.getUserById(fav.userId),
            tweet: (0, transforms_1.tweetTransform)(db.getTweetById(fav.tweetId)),
        };
    },
    async deleteFavorite(_parent, args, { db }) {
        const { favorite } = args;
        const fav = await db.deleteFavorite(favorite);
        return {
            ...(0, transforms_1.favoriteTransform)(fav),
            user: db.getUserById(fav.userId),
            tweet: (0, transforms_1.tweetTransform)(db.getTweetById(fav.tweetId)),
        };
    },
};
exports.default = mutationTwitterResolver;
