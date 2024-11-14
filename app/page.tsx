"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CircleAlert, Clock, MessageCircleWarning, TrendingUp, TriangleAlert } from "lucide-react";
import AnimatedCounter from "@/components/animatedCounter";
import Link from "next/link";
import { ThemeSwitcher } from "@/components/themeSwitcher";

function roundToNextMilestone(num: number) {
  const magnitude = Math.pow(10, Math.floor(Math.log10(num)));
  return Math.ceil(num / magnitude) * magnitude;
}

export default function Home() {
  const [userCount, setUserCount] = useState(0);
  const [lastUpdateResponse, setLastUpdateResponse] = useState(0);
  const [interpolatedCount, setInterpolatedCount] = useState(0);
  const [barMax, setBarMax] = useState(100);
  const [progressUntilNextUpdate, setProgressUntilNextUpdate] = useState(0);
  const [nextUpdateTime, setNextUpdateTime] = useState(Date.now());
  const [growthRate, setGrowthRate] = useState(0); // Default to 4.5 users per second

  // We get updates every 20 seconds
  const UPDATE_INTERVAL = 60000;
  // API updates every 60 seconds
  const UPDATE_TIME = 60000;
  
  const fetchData = async () => {
    try {
      const response = await fetch("https://bsky-stats.lut.li/");
      const data = await response.json();
      console.log(data);

      const newUserCount = data.total_users;
      let nextUpdate = Date.parse(data.last_update_time) + UPDATE_TIME;

      // Update the user count, bar max, and last update time
      if(data.users_growth_rate_per_second != null) {
      setGrowthRate((data.users_growth_rate_per_second ?? 3.45) * UPDATE_TIME/1000)
      }
      if (userCount !== newUserCount) {
        setUserCount(newUserCount);
        setBarMax(roundToNextMilestone(newUserCount));
        // set the last response
        setLastUpdateResponse(Date.parse(data.last_update_time));
        console.log('setting next update time', nextUpdate);
        setNextUpdateTime(nextUpdate);
      }

      // Align our requests with the API's update time, provide an offset to the next update time
      const offset = -Math.floor((Date.now() - nextUpdate) / 1000);
      console.log("Our offset is", offset);
      return offset;
    } catch (error) {
      console.error("Error fetching user count:", error);
      return 0; // In case of error, use 0 offset to avoid delays
    }
  };


  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;
    const initiateFetching = async () => {
      try {
        const offset = await fetchData();
        console.log("Offset before next fetch:", offset);
    
        // Clear any existing timeouts to avoid overlap
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
    
        // Delay next fetch based on the offset
        timeoutId = setTimeout(() => {
          initiateFetching();
        }, (offset ?? 0) * 1000 + 30);
      } catch (error) {
        console.error("Error fetching data:", error);
        // Optionally, retry after a fixed timeout on error
        timeoutId = setTimeout(() => {
          initiateFetching();
        }, 5000); // Retry in 5 seconds if fetch fails
      }
    };
  
    // Start the fetching process
    initiateFetching();
  
    // Cleanup: clear the timeout and interval on component unmount or update
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [userCount]);

  useEffect(() => {
    const timer = setInterval(() => {
      const elapsedTime = Date.now() - nextUpdateTime;

      // Estimate current user count based on growth rate
      const estimatedGrowth = (growthRate * elapsedTime) / 1000;
      setInterpolatedCount(Math.round(userCount + estimatedGrowth));
    }, 100);

    return () => clearInterval(timer);
  }, [nextUpdateTime, userCount, growthRate]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (userCount == 0) {
        return;
      }
      // time left until next update
      const elapsedTime = nextUpdateTime - Date.now();
      //console.log(elapsedTime)
      const progress = 100 - Math.min(elapsedTime / UPDATE_TIME, 1) * 100;
      // if elapsed time is negative force an update
      setProgressUntilNextUpdate(progress);

      // Estimate current user count based on growth rate
      const estimatedGrowth = (growthRate * elapsedTime) / 1000;
      setInterpolatedCount(Math.round(userCount + estimatedGrowth));
    }, 100);

    return () => clearInterval(timer);
  }, [nextUpdateTime, userCount, growthRate]);

  return (
    <div className="container mx-auto w-screen max-w-screen h-screen">
      <div className="md:grid place-items-center h-full w-full  pt-4 md:pt-0">
        <div>
          <div className="min-w-[8rem] max-w-screen-md pb-4">
            <div className="flex flex-col md:flex-row-reverse items-left justify-between">
              <div className="flex flex-row items-start justify-between pb-16 md:pb-0">
                <ThemeSwitcher />
              </div>
              <div>
              <div className="px-2 py-1 rounded-full bg-yellow-500 text-black flex flex-row items-center justify-center">
                  <TriangleAlert className="w-4 h-4 mr-2" /> There is an API issue. The numbers displayed may be inaccurate.
                </div>
                <div className="text-5xl md:text-6xl lg:text-8xl font-semibold text-blue-500">
                  <AnimatedCounter
                    value={Math.floor(
                      userCount + growthRate * (progressUntilNextUpdate / 100)
                    )}
                    includeCommas={true}
                    includeDecimals={false}
                    className="text-blue-500 tabular-nums"
                    showColorsWhenValueChanges={false}
                  />
                </div>
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
                      ((interpolatedCount +
                        growthRate * (progressUntilNextUpdate / 100)) /
                        barMax) *
                        100
                    )
              }
              className="h-2"
            />
            <div className="text-xs text-muted-foreground mt-2">
            <AnimatedCounter
                    className="inline-flex"
                    decimalPrecision={5}
                    value={userCount == 0
                      ? 0
                      : (userCount + growthRate * (progressUntilNextUpdate / 100)) / barMax * 100
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
                      1000
                  ) < 0 ? <div className="loader" /> :
                  Math.ceil(
                    (UPDATE_TIME -
                      (progressUntilNextUpdate / 100) * UPDATE_TIME) /
                      1000
                  )
                  + "s"}
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
                    value={growthRate * (progressUntilNextUpdate / 100)}
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
                  <AnimatedCounter
                    className="inline-flex"
                    value={growthRate/UPDATE_TIME * 1000}
                  />
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
