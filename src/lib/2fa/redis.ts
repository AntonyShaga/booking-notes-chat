const ATTEMPT_PREFIX = "2fa:attempts";
const PENDING_PREFIX = "2fa:pending";
const COOLDOWN_PREFIX = "2fa:cooldown";
const DATA_PREFIX = "2fa";

export const redisKeys = {
  attempts: (userId: string) => `${ATTEMPT_PREFIX}:${userId}`,
  pending: (userId: string) => `${PENDING_PREFIX}:${userId}`,
  cooldown: (userId: string) => `${COOLDOWN_PREFIX}:${userId}`,
  setup: (userId: string) => `${DATA_PREFIX}:${userId}`,
};
