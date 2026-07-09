import { safeNum } from "./coin-display.js";

export function buildReferralSnapshot({
  profile,
  referralLink = "",
  solPriceUsd = 0,
}) {
  const referralCount = Math.max(0, Math.floor(safeNum(profile?.referralCount, 0)));
  const claimableSol = Math.max(0, safeNum(profile?.referralRewardsSol, 0));
  const claimableUsd = claimableSol * solPriceUsd;
  const avgRewardSol = referralCount > 0 ? claimableSol / referralCount : null;

  return {
    referralCount,
    claimableSol,
    claimableUsd,
    avgRewardSol,
    referralLink: String(referralLink || "").trim(),
    hasAffiliates: referralCount > 0,
    hasEarnings: claimableSol > 0,
  };
}
