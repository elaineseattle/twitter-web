"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transforms_1 = require("../transforms");
const transforms_2 = require("../transforms");
const queryTwitterResolvers = {
    trends: (_, __, { db }) => {
        return db.getAllTrends().map(transforms_2.trendTransform);
    },
    currentUser: (_, __, { db }) => {
        const [firstUser] = db.getAllUsers();
        if (!firstUser)
            throw new Error('currentUser was requested, but there are no users in the database');
        return firstUser;
    },
    suggestions: (_, __, { db }) => {
        return db.getAllSuggestions();
    },
    tweets: (_parent, _args, { db, dbTweetToFavoriteCountMap, dbUserCache, dbTweetCache }) => {
        db.getAllUsers().forEach((user) => {
            dbUserCache[user.id] = user;
        });
        db.getAllFavorites().forEach((favorite) => {
            const count = dbTweetToFavoriteCountMap[favorite.tweetId] || 0;
            dbTweetToFavoriteCountMap[favorite.tweetId] = count + 1;
        });
        return db.getAllTweets().map((t) => {
            dbTweetCache[t.id] = t;
            return (0, transforms_1.tweetTransform)(t);
        });
    },
};
exports.default = queryTwitterResolvers;
