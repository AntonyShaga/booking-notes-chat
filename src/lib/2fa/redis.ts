export const redisKeys = {
  // 2FA
  attempts: (userId: string) => `2fa:attempts:${userId}`,
  pending: (userId: string) => `2fa:pending:${userId}`,
  cooldown: (userId: string) => `2fa:cooldown:${userId}`,
  setup: (userId: string) => `2fa:${userId}`,
  twoFactorStatus: (userId: string) => `2fa:status:${userId}`,

  // Rate Limiting
  loginRateLimit: (ip: string) => `rate_limit:login:${ip}`,
  registerRateLimit: (ip: string) => `rate_limit:register:${ip}`,
};
