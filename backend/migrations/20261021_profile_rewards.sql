-- CHẠY 1 LẦN TRÊN DB BREWLITE ĐÃ KHỞI TẠO (không chạy đè dump ERD).
BEGIN;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar VARCHAR(500);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "favoriteBranch" VARCHAR(255);
CREATE TABLE IF NOT EXISTS public.reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES public.users(id),
  "couponId" UUID NOT NULL UNIQUE REFERENCES public.coupons(id),
  "requestId" UUID NOT NULL UNIQUE,
  "rewardId" VARCHAR(30) NOT NULL,
  "pointsSpent" INT NOT NULL CHECK ("pointsSpent" > 0),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reward_user_created ON public.reward_redemptions("userId", "createdAt");
COMMIT;
