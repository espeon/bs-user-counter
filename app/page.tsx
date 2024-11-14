"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, TrendingUp, TriangleAlert } from "lucide-react";
import AnimatedCounter from "@/components/animatedCounter";
import Link from "next/link";
import { ThemeSwitcher } from "@/components/themeSwitcher";
import ParticlesComponent from "@/components/particles";

const UPDATE_INTERVAL = 60000;
const UPDATE_TIME = 60000;
const RETRY_DELAY = 5000;

// Add a random offset to the update time to avoid all users updating at the same time
const UPDATE_TIME_OFFSET = Math.floor(Math.random() * 10);

function roundToNextMilestone(num: number, offset: number = 1.0) {
  // Add a small offset
  const magnitude = Math.pow(10, Math.floor(Math.log10(num)));
  return Math.ceil(num / (offset * magnitude)) * (offset * magnitude);
}

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

export default function Home() {
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

  const fetchData = useCallback(async () => {
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

      setStats((prev) => ({
        ...prev,
        hasConfettid: false,
        userCount: newUserCount,
        barMax: roundToNextMilestone(newUserCount),
        nextMilestone: roundToNextMilestone(newUserCount, 0.1),
        // TODO: calculate this from the API
        lastUpdateResponse: nextUpdateTime - (60 - UPDATE_TIME_OFFSET) * 1000,
        nextUpdateTime: nextUpdateTime + UPDATE_TIME_OFFSET * 1000,
        growthRate: data.users_growth_rate_per_second,
        isError: false,
        isLoading: false,
      }));

      return secsUntilNextUpdate;
    } catch (error) {
      console.error("Error fetching user count:", error);
      setStats((prev) => ({ ...prev, isError: true, isLoading: false }));
      return null;
    }
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const initiateFetching = async () => {
      const secondsUntilNextUpdate = await fetchData();

      if (secondsUntilNextUpdate === null) {
        console.log("Retrying in", RETRY_DELAY, "ms");
        timeoutId = setTimeout(initiateFetching, RETRY_DELAY);
      } else {
        console.log(
          "Scheduling next update in",
          secondsUntilNextUpdate,
          "seconds at",
          new Date(Date.now() + secondsUntilNextUpdate * 1000),
        );
        console.log("User fetch offset is", UPDATE_TIME_OFFSET, "seconds");

        timeoutId = setTimeout(initiateFetching, secondsUntilNextUpdate * 1000);
      }
    };

    initiateFetching();
    return () => clearTimeout(timeoutId);
  }, [fetchData]);

  // Update interpolation effect
  useEffect(() => {
    const timer = setInterval(() => {
      if (stats.userCount === 0) return;

      const now = Date.now();
      const timeSinceLastUpdate = now - stats.lastUpdateResponse;
      const totalUpdateInterval =
        stats.nextUpdateTime - stats.lastUpdateResponse;

      // Calculate progress (0-100)
      // Overflows past 100 in case of API instability
      const progress = Math.min(
        (timeSinceLastUpdate / totalUpdateInterval) * 100,
        150,
      );

      // Calculate estimated growth since last update
      const estimatedGrowth = (stats.growthRate * progress) / 100;

      // should we confetti?
      if (
        Math.floor(stats.userCount + stats.growthRate * 55 * (progress / 100)) >
          stats.nextMilestone &&
        !stats.hasConfettid
      ) {
        setIsConfettiActive(true);
        setStats((prev) => ({ ...prev, hasConfettid: true }));
      }

      setStats((prev) => ({
        ...prev,
        progressUntilNextUpdate: progress,
        interpolatedCount: Math.round(prev.userCount + estimatedGrowth),
      }));
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

  const {
    userCount,
    barMax,
    progressUntilNextUpdate,
    growthRate,
    interpolatedCount,
    isError,
    isLoading,
  } = stats;

  return (
    <div className="container mx-auto w-screen max-w-screen h-screen">
      <ParticlesComponent
        isAnimating={isConfettiActive}
        setIsAnimating={setIsConfettiActive}
      />
      <div className="md:grid place-items-center h-full w-full  pt-4 md:pt-0">
        <div>
          <div className="min-w-[8rem] max-w-screen-md pb-4">
            <div className="flex flex-col md:flex-row-reverse items-left justify-between">
              <div className="flex flex-row items-start justify-between pb-16 md:pb-0">
                <ThemeSwitcher setConfettiActive={setIsConfettiActive} />
              </div>
              <div>
                {/* <div className="px-2 py-1 rounded-full bg-yellow-500 text-black flex flex-row items-center justify-center">
                  <TriangleAlert className="w-4 h-4 mr-2" /> There is a backend
                  issue. The numbers displayed may be inaccurate.
                </div> */}
                <div className="text-5xl md:text-6xl lg:text-8xl font-semibold text-blue-500">
                  <AnimatedCounter
                    value={Math.floor(
                      userCount +
                        growthRate * 55 * (progressUntilNextUpdate / 100),
                    )}
                    includeCommas={true}
                    includeDecimals={false}
                    className="text-blue-500 tabular-nums"
                    showColorsWhenValueChanges={false}
                  />
                </div>
                {/* {userCount} {growthRate} {progressUntilNextUpdate} */}
                <div className="text-lg text-muted-foreground mt-2 mb-1">
                  users on Bluesky
                </div>
              </div>
            </div>
            <Progress
              value={
                userCount == 0
                  ? 0
                  : Math.floor(
                      ((userCount + growthRate * progressUntilNextUpdate) /
                        barMax) *
                        100,
                    )
              }
              className="h-2"
            />
            {/* next milestone at {Math.floor(stats.nextMilestone)} */}
            <div className="text-xs text-muted-foreground mt-2">
              <AnimatedCounter
                className="inline-flex"
                decimalPrecision={5}
                value={
                  userCount == 0
                    ? 0
                    : ((userCount +
                        growthRate * ((progressUntilNextUpdate / 100) * 60)) /
                        barMax) *
                      100
                }
                showColorsWhenValueChanges={false}
              />
              % of {Intl.NumberFormat().format(barMax)} users
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 max-w-screen-md md:w-screen">
            <Card className="max-w-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Time Until Next Update
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.ceil(
                    (UPDATE_TIME -
                      (progressUntilNextUpdate / 100) * UPDATE_TIME) /
                      1000,
                  ) <= 0 ? (
                    <div className="loader" />
                  ) : (
                    Math.ceil(
                      (UPDATE_TIME -
                        (progressUntilNextUpdate / 100) * UPDATE_TIME) /
                        1000,
                    ) + "s"
                  )}
                </div>
                <Progress
                  value={progressUntilNextUpdate}
                  className="h-2 mt-4"
                />
                <div className="text-xs text-muted-foreground mt-2">
                  Estimated growth:{" "}
                  <AnimatedCounter
                    className="inline-flex"
                    decimalPrecision={1}
                    padNumber={5}
                    value={growthRate * ((progressUntilNextUpdate / 100) * 60)}
                    showColorsWhenValueChanges={false}
                  />{" "}
                  users since last update
                </div>
              </CardContent>
            </Card>
            <Card className="min-w-sm max-w-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Growth Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedCounter className="inline-flex" value={growthRate} />
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Users per second{" "}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            👋 from{" "}
            <Link
              className="text-blue-500"
              href="https://bsky.app/profile/natalie.sh"
            >
              @natalie.sh
            </Link>
            ! data sourced from{" "}
            <Link
              className="text-blue-500"
              href="https://bsky.app/profile/jaz.bsky.social"
            >
              @jaz.bsky.social
            </Link>
            {"'s "}
            <Link className="text-blue-500" href="https://bsky.jazco.dev/stats">
              bsky stats.{" "}
            </Link>
            very inspired by{" "}
            <Link
              className="text-blue-500"
              href="https://bsky.app/profile/theo.io"
            >
              @theo.io
            </Link>
            {"'s "}
            <Link href="https://bsky-users.theo.io/" className="text-blue-500">
              user counter
            </Link>
            .
          </div>
        </div>
      </div>
    </div>
  );
}
