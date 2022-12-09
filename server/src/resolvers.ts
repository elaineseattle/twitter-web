// import Query from './resolvers/Query'
import tweetTwitterResolver from './resolvers/Tweet';
import userTwitterResolver from './resolvers/User';
import { Resolvers } from "./resolvers-types.generated"
import Db, { DbTweet, DbUser } from "./db"
import mutationTwitterResolver from './resolvers/Mutation';
import trendTwitterResolver from "./resolvers/Trend"

export interface TwitterResolverContext {
  db: Db,
  dbTweetCache: Record<string, DbTweet>
  dbUserCache: Record<string, DbUser>
  dbTweetToFavoriteCountMap: Record<string, number>
}

import queryTwitterResolvers from "./resolvers/Query"
const resolvers: Resolvers<TwitterResolverContext> = {
  Query: queryTwitterResolvers,
  Mutation: mutationTwitterResolver,
  Tweet: tweetTwitterResolver,
  User: userTwitterResolver,
  Trend: trendTwitterResolver,
}
export default resolvers