"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transforms_1 = require("../transforms");
const userTwitterResolver = {
    stats(user, _, { db }) {
        return {
            followingCount: 123,
            followerCount: 456789,
            tweetCount: db.getUserTweets(user.id).length,
        };
    },
    favorites(user, _, { db }) {
        const faves = db.getUserFavorites(user.id);
        return faves.map((f) => {
            return {
                ...(0, transforms_1.favoriteTransform)(f),
                user,
                tweet: (0, transforms_1.tweetTransform)(db.getTweetById(f.tweetId)),
            };
        });
    },
};
exports.default = userTwitterResolver;
