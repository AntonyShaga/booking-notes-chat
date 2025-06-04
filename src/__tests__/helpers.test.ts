import Redis from "ioredis-mock";
import { checkRateLimit } from "@/lib/2fa/helpers";

describe("checkRateLimit", () => {
  it("throws after too many attempts", async () => {
    const redis = new Redis();
    const key = "test:rate";

    for (let i = 0; i < 5; i++) {
      await checkRateLimit(redis, key, 5, 60);
    }

    await expect(checkRateLimit(redis, key, 5, 60)).rejects.toThrow("Превышено количество попыток");
  });
});
