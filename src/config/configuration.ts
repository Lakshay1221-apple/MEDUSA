export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/medusa_db?schema=public',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'medusa_super_secret_jwt_access_key_12345',
    expiration: process.env.JWT_EXPIRATION || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'medusa_super_secret_jwt_refresh_key_67890',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  security: {
    encryptionKey: process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  },
  storage: {
    driver: process.env.STORAGE_DRIVER || 'local',
    localDir: process.env.STORAGE_LOCAL_DIR || './uploads',
    s3: {
      endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
      bucket: process.env.S3_BUCKET || 'medusa-documents',
      accessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.S3_SECRET_KEY || 'minioadmin',
      region: process.env.S3_REGION || 'us-east-1',
    },
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || 'mock_github_client_id',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'mock_github_client_secret',
  },
  ai: {
    provider: process.env.LLM_PROVIDER || 'mock',
    apiKey: process.env.LLM_API_KEY || 'mock_llm_key',
  },
  webPush: {
    publicKey: process.env.WEB_PUSH_PUBLIC_KEY || '',
    privateKey: process.env.WEB_PUSH_PRIVATE_KEY || '',
    subject: process.env.WEB_PUSH_SUBJECT || 'mailto:admin@medusa.app',
  },
  scoring: {
    scheduledPoints: parseInt(process.env.SCORE_SCHEDULED_POINTS, 10) || 10,
    habitPoints: parseInt(process.env.SCORE_HABIT_POINTS, 10) || 5,
    skipPenalty: parseInt(process.env.SCORE_SKIP_PENALTY, 10) || -15,
    abandonPenalty: parseInt(process.env.SCORE_ABANDON_PENALTY, 10) || -25,
    perfectDayBonus: parseInt(process.env.SCORE_PERFECT_DAY_BONUS, 10) || 20,
    deepWorkPer15Min: parseInt(process.env.SCORE_DEEP_WORK_PER_15MIN, 10) || 1,
    githubVerificationPoints: parseInt(process.env.SCORE_GITHUB_VERIFICATION_POINTS, 10) || 15,
  },
});
