import { useState, useEffect } from "react";

const UPDATE_INTERVAL = 60000;
export const UPDATE_TIME = 60000;
const RETRY_DELAY = 5000;
const UPDATE_TIME_OFFSET = Math.floor(Math.random() * 10);

interface StatsState {
  hasConfettid: boolean;
  userCount: number;
  lastUpdateResponse: number;
  interpolatedCount: number;
  barMax: number;
  nextMilestone: number;
  progressUntilNextUpdate: number;
  nextUpdateTime: number;
  growthRate: number;
  isError: boolean;
  isLoading: boolean;
}

function roundToNextMilestone(num: number, offset: number = 1.0) {
  const magnitude = Math.pow(10, Math.floor(Math.log10(num)));
  return Math.ceil(num / (offset * magnitude)) * (offset * magnitude);
}

export function useUserStats() {
  const [isConfettiActive, setIsConfettiActive] = useState(false);
  const [stats, setStats] = useState<StatsState>({
    hasConfettid: false,
    userCount: 0,
    lastUpdateResponse: 0,
    interpolatedCount: 0,
    barMax: 100,
    nextMilestone: 1000,
    progressUntilNextUpdate: 0,
    nextUpdateTime: Date.now(),
    growthRate: 0,
    isError: false,
    isLoading: true,
  });

  // Fetching data on interval
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const fetchData = async () => {
      try {
        const response = await fetch("https://bsky-stats.lut.li/");
        if (!response.ok) throw new Error("API request failed");

        const data = await response.json();
        const newUserCount = data.total_users;
        const lastUpdateTime = Date.parse(data.last_update_time);
        const nextUpdateTime = Date.parse(data.next_update_time);

        const now = Date.now();
        const timeUntilNextUpdate = nextUpdateTime - now;

        let secsUntilNextUpdate = Math.max(
          1,
          Math.floor(timeUntilNextUpdate / 1000) + UPDATE_TIME_OFFSET,
        );

        if (
          newUserCount > stats.nextMilestone &&
          !stats.isLoading &&
          !stats.isError
        ) {
          setStats((prev) => ({
            ...prev,
            barMax: roundToNextMilestone(newUserCount),
            nextMilestone: roundToNextMilestone(newUserCount, 0.1),
            // TODO: calculate this from the API
            lastUpdateResponse:
              nextUpdateTime - (60 - UPDATE_TIME_OFFSET) * 1000,
            nextUpdateTime: nextUpdateTime + UPDATE_TIME_OFFSET * 1000,
            growthRate: data.users_growth_rate_per_second,
            isError: false,
            isLoading: false,
          }));
        } else {
          // if we're not crossing the last milestone, update everything
          setStats((prev) => ({
            ...prev,
            hasConfettid: false,
            userCount: newUserCount,
            barMax: roundToNextMilestone(newUserCount),
            nextMilestone: roundToNextMilestone(newUserCount, 0.1),
            // TODO: calculate this from the API
            lastUpdateResponse:
              nextUpdateTime - (60 - UPDATE_TIME_OFFSET) * 1000,
            nextUpdateTime: nextUpdateTime + UPDATE_TIME_OFFSET * 1000,
            growthRate: data.users_growth_rate_per_second,
            isError: false,
            isLoading: false,
          }));
        }

        return secsUntilNextUpdate;
      } catch (error) {
        console.error("Error fetching user count:", error);
        setStats((prev) => ({ ...prev, isError: true, isLoading: false }));
        return null;
      }
    };

    const initiateFetching = async () => {
      const secondsUntilNextUpdate = await fetchData();
      if (secondsUntilNextUpdate === null) {
        timeoutId = setTimeout(initiateFetching, RETRY_DELAY);
      } else {
        timeoutId = setTimeout(initiateFetching, secondsUntilNextUpdate * 1000);
      }
    };

    initiateFetching();
    return () => clearTimeout(timeoutId);
    // bad practise, but we schedule our own timer in the hook and
    // thus we only want this to run once to avoid multiple calls on startup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // interpolation btwn fetches
  useEffect(() => {
    const timer = setInterval(() => {
      if (stats.userCount === 0) return;

      const now = Date.now();
      const timeSinceLastUpdate = now - stats.lastUpdateResponse;
      const totalUpdateInterval =
        stats.nextUpdateTime - stats.lastUpdateResponse;

      const progress = Math.min(
        (timeSinceLastUpdate / totalUpdateInterval) * 100,
        150,
      );

      const estimatedGrowth = (stats.growthRate * progress) / 100;

      if (
        Math.floor(stats.userCount + stats.growthRate * 55 * (progress / 100)) +
          30 >
          stats.nextMilestone &&
        !stats.hasConfettid
      ) {
        setIsConfettiActive(true);
        setStats((prev) => ({ ...prev, hasConfettid: true }));
      }

      if (stats.growthRate != 133.37999999999997) {
        setStats((prev) => ({
          ...prev,
          progressUntilNextUpdate: progress,
          interpolatedCount: Math.round(prev.userCount + estimatedGrowth),
        }));
      }
    }, 100);

    return () => clearInterval(timer);
  }, [
    stats.hasConfettid,
    stats.userCount,
    stats.growthRate,
    stats.lastUpdateResponse,
    stats.nextUpdateTime,
    stats.nextMilestone,
  ]);

  return {
    stats,
    isConfettiActive,
    setIsConfettiActive,
  };
}
