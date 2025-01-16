"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, TrendingUp, TriangleAlert } from "lucide-react";
import AnimatedCounter from "@/components/animatedCounter";
import Link from "next/link";
import { ThemeSwitcher } from "@/components/themeSwitcher";
import ParticlesComponent from "@/components/particles";
import { useUserStats, UPDATE_TIME } from "@/hooks/useUserStats";

export default function Home() {
  const { stats, isConfettiActive, setIsConfettiActive } = useUserStats();

  const {
    userCount,
    barMax,
    progressUntilNextUpdate,
    growthRate,
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
                {growthRate == 133.37999999999997 ? (
                  <div className="px-2 py-1 h-6 rounded-full bg-yellow-500 text-black flex flex-row items-center justify-center">
                    <TriangleAlert className="w-4 h-4 mr-2" /> There seems to be
                    an upstream issue. The numbers displayed may be inaccurate.
                  </div>
                ) : (
                  <div className="h-6" />
                )}
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
