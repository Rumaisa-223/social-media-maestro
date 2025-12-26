export const OAUTH = {
  facebook: {
    authorizeUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl:     'https://graph.facebook.com/v18.0/oauth/access_token',
    scopes:       ['pages_manage_posts','pages_read_engagement','pages_show_list'],
    clientId:     process.env.FB_APP_ID!,
    clientSecret: process.env.FB_APP_SECRET!,
  },
  twitter: {
    authorizeUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl:     'https://api.twitter.com/2/oauth2/token',
    scopes:       ['tweet.read','tweet.write','users.read','offline.access'],
    clientId:     process.env.TW_CLIENT_ID!,
    clientSecret: process.env.TW_CLIENT_SECRET!,
  },
  linkedin: {
    authorizeUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl:     'https://www.linkedin.com/oauth/v2/accessToken',
    scopes:       ['w_member_social','r_liteprofile','w_organization_social'],
    clientId:     process.env.LI_CLIENT_ID!,
    clientSecret: process.env.LI_CLIENT_SECRET!,
  },
};