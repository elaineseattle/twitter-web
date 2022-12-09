"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const uuid_1 = require("uuid");
class Db {
    constructor(filePath) {
        this.adapter = new FileSync(filePath);
        this.db = low(this.adapter);
        this.db.read();
    }
    async initDefaults() {
        return await this.db
            .defaults({
            tweets: [],
            users: [],
            favorites: [],
            hashtagTrends: [],
            topicTrends: [],
            topicTrendQuotes: [],
            suggestions: [],
        })
            .write();
    }
    getFirstUser() {
        const firstUser = this.db.get('users').first().value();
        if (!firstUser)
            throw new Error('No users in database');
        return firstUser;
    }
    getUserById(id) {
        return this.db
            .get('users')
            .find((u) => u.id === id)
            .value();
    }
    getTweetById(id) {
        return this.db
            .get('tweets')
            .find((t) => t.id === id)
            .value();
    }
    getUserTweets(userId) {
        return this.db
            .get('tweets')
            .filter((t) => t.userId === userId)
            .value();
    }
    getUserFavorites(userId) {
        return this.db
            .get('favorites')
            .filter((f) => f.userId === userId)
            .value();
    }
    getAllTweets() {
        return this.db
            .get('tweets')
            .sortBy((t) => new Date(t.createdAt).valueOf())
            .reverse()
            .value();
    }
    getAllFavorites() {
        return this.db.get('favorites').value();
    }
    getAllTrends() {
        const hashTrends = this.db.get('hashtagTrends').reverse().value();
        const topicTrends = this.db.get('topicTrends').reverse().value();
        const topicTrendQuotes = this.db
            .get('topicTrendQuotes')
            .reverse()
            .value()
            .reduce((acc, item) => {
            acc[item.topicTrendId] = item;
            return acc;
        }, {});
        const list = [
            ...hashTrends,
            ...topicTrends.map((tt) => {
                const quote = topicTrendQuotes[tt.id];
                return { ...tt, quote };
            }),
        ].sort((a, b) => b.tweetCount - a.tweetCount);
        return list;
    }
    getAllSuggestions() {
        return this.db.get('suggestions').value();
    }
    getFavoritesForTweet(tweetId) {
        return this.db
            .get('favorites')
            .filter((t) => t.tweetId === tweetId)
            .value();
    }
    getFavoriteCountForTweet(tweetId) {
        return this.getFavoritesForTweet(tweetId).length;
    }
    async createSuggestion(trendProps) {
        const suggestions = this.db.get('suggestions');
        const newSuggestion = {
            ...trendProps,
            id: `suggestion-${(0, uuid_1.v4)()}`,
        };
        await suggestions.push(newSuggestion).write();
        return newSuggestion;
    }
    async createHashtagTrend(trendProps) {
        const hashtagTrends = this.db.get('hashtagTrends');
        const newTrend = {
            ...trendProps,
            kind: 'hashtag',
            id: `hashtrend-${(0, uuid_1.v4)()}`,
        };
        await hashtagTrends.push(newTrend).write();
        return newTrend;
    }
    async createTopicTrend(trendProps, quoteProps) {
        const topicTrends = this.db.get('topicTrends');
        const newTrend = {
            ...trendProps,
            kind: 'topic',
            id: `topictrend-${(0, uuid_1.v4)()}`,
        };
        await topicTrends.push(newTrend).write();
        if (quoteProps) {
            const { title, description, imageUrl } = quoteProps;
            const topicTrendQuotes = this.db.get('topicTrendQuotes');
            const newQuote = {
                ...trendProps,
                title,
                description,
                imageUrl,
                topicTrendId: newTrend.id,
                id: `topictrendquote-${(0, uuid_1.v4)()}`,
            };
            await topicTrendQuotes.push(newQuote).write();
        }
        return newTrend;
    }
    async createTweet(tweetProps) {
        const tweets = this.db.get('tweets');
        const tweet = {
            ...tweetProps,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            id: `tweet-${(0, uuid_1.v4)()}`,
        };
        await tweets.push(tweet).write();
        return tweet;
    }
    async createUser(userProps) {
        const users = this.db.get('users');
        const user = {
            ...userProps,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            id: `user-${(0, uuid_1.v4)()}`,
        };
        await users.push(user).write();
        return user;
    }
    async createFavorite(favoriteProps) {
        const user = this.getUserById(favoriteProps.userId);
        const tweet = this.getTweetById(favoriteProps.tweetId);
        if (!user)
            throw new Error('User does not exist');
        if (!tweet)
            throw new Error('Tweet does not exist');
        const favorites = this.db.get('favorites');
        const favorite = {
            ...favoriteProps,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            id: `favorite-${(0, uuid_1.v4)()}`,
        };
        await favorites.push(favorite).write();
        return favorite;
    }
    async deleteFavorite(favoriteProps) {
        const user = this.getUserById(favoriteProps.userId);
        const tweet = this.getTweetById(favoriteProps.tweetId);
        if (!user)
            throw new Error('User does not exist');
        if (!tweet)
            throw new Error('Tweet does not exist');
        const favorites = this.db.get('favorites');
        const deleted = favorites.remove((f) => f.tweetId === tweet.id && f.userId === user.id);
        await this.db.write();
        return deleted.first().value();
    }
    hasUser(predicate) {
        return !!this.db.get('users').find(predicate);
    }
    getAllUsers() {
        return this.db.get('users').value();
    }
    async write() {
        await this.db.write();
    }
}
exports.default = Db;
