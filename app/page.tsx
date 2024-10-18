'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, Clock, TrendingUp } from 'lucide-react';
import AnimatedCounter from '@/components/animatedCounter';
import Link from 'next/link';

function roundToNextMilestone(num: number) {
  const magnitude = Math.pow(10, Math.floor(Math.log10(num)));
  return Math.ceil(num / magnitude) * magnitude;
}

export default function Home() {
  const [userCount, setUserCount] = useState(0);
  const [lastUserCount, setLastUserCount] = useState(0);
  const [interpolatedCount, setInterpolatedCount] = useState(0);
  const [barMax, setBarMax] = useState(100);
  const [progressUntilNextUpdate, setProgressUntilNextUpdate] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [growthRate, setGrowthRate] = useState(2.34 * 60); // Default to 4.5 users per second

  const UPDATE_INTERVAL = 60000; // 1 minute in milliseconds

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://bsky-stats.deno.dev/');
        const data = await response.json();

        const newUserCount = data.total_users;

        // Update the user count, bar max, and last update time
        if(userCount != 0 && userCount != newUserCount) {
          setLastUserCount(userCount);
        }
        setUserCount(newUserCount);
        setBarMax(roundToNextMilestone(newUserCount));
        setLastUpdateTime(Date.now());
      } catch (error) {
        console.error('Error fetching user count:', error);
      }
    };

    fetchData(); // Initial fetch
    const interval = setInterval(fetchData, UPDATE_INTERVAL); // Fetch every 60 seconds

    return () => clearInterval(interval);
  }, [userCount]);

  useEffect(() => {
    console.log(userCount, lastUserCount)
    if (userCount > 0 && lastUserCount > 0) {
      const currentTime = Date.now();
      // Calculate time difference between current time and API last update time (in seconds)
      // For now use 60 seconds
      // Calculate new growth rate (users per second)
      const newGrowthRate = userCount - lastUserCount;
      console.log("newGrowthRate", newGrowthRate,)
      setGrowthRate(newGrowthRate); // Update growth rate
    }
  }, [userCount, lastUpdateTime]);

  useEffect(() => {
    const timer = setInterval(() => {
      const elapsedTime = Date.now() - lastUpdateTime;
      const progress = (elapsedTime / UPDATE_INTERVAL) * 100;

      // Calculate time remaining in seconds until the next update
      // Set ranges for it too
      const timeRemaining = Math.min(Math.max(
        Math.ceil((UPDATE_INTERVAL - elapsedTime) / 1000), // Convert from ms to seconds
        0
      ), 100);

      // Estimate current user count based on growth rate
      const estimatedGrowth = (growthRate * elapsedTime) / 1000;
      setInterpolatedCount(Math.round(userCount + estimatedGrowth));
    }, 100);

    return () => clearInterval(timer);
  }, [lastUpdateTime, userCount, growthRate]);

  useEffect(() => {
    const timer = setInterval(() => {
      if(userCount == 0) { return; }
      const elapsedTime = Date.now() - lastUpdateTime;
      const progress = (elapsedTime / UPDATE_INTERVAL) * 100;
      setProgressUntilNextUpdate(Math.min(progress, 100));

      // Estimate current user count based on growth rate
      const estimatedGrowth = (growthRate * elapsedTime) / 1000;
      setInterpolatedCount(Math.round(userCount + estimatedGrowth));
    }, 100);

    return () => clearInterval(timer);
  }, [lastUpdateTime, userCount, growthRate]);

  return (
    <div className="container mx-auto w-screen max-w-screen h-screen">
      <div className="grid place-items-center h-full w-full">
        <div>
        <div className="min-w-[8rem] max-w-screen-md pb-4 mt-16 md:mt-0">
              <div className="text-5xl md:text-6xl lg:text-8xl font-semibold text-blue-500">
                <AnimatedCounter
                  value={Math.floor(
                    userCount + growthRate * (progressUntilNextUpdate / 100)
                  )}
                  includeCommas={true}
                  includeDecimals={false}
                  className='text-blue-500'
                  showColorsWhenValueChanges={false}
                />
              </div>
              <div className="text-lg text-muted-foreground mt-2 mb-1">users on Bluesky</div>
              <Progress
                value={
                  userCount == 0 ? 0 : Math.floor(((interpolatedCount +
                    growthRate * (progressUntilNextUpdate / 100)) /
                    barMax) *
                  100)
                }
                className="h-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {userCount == 0 ? 0 : (
                  ((interpolatedCount +
                    growthRate * (progressUntilNextUpdate / 100)) /
                    barMax) *
                  100
                ).toFixed(2)}
                % of {Intl.NumberFormat().format(barMax)} users
              </p>
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
                  (UPDATE_INTERVAL -
                    (progressUntilNextUpdate / 100) * UPDATE_INTERVAL) /
                    1000
                )}
                s
              </div>
              <Progress value={progressUntilNextUpdate} className="h-2 mt-4" />
              <div className="text-xs text-muted-foreground mt-2 inline-flex">
                Estimated growth:{' '}
                <AnimatedCounter
                  className="mx-1"
                  value={growthRate * (progressUntilNextUpdate / 100)}
                />{' '}
                users since last update
              </div>
            </CardContent>
          </Card>
          <Card className="min-w-sm max-w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lastUserCount == 0 && '~'}{(growthRate/60).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Users per second {lastUserCount == 0 && <><br/>(estimated, based on historical data.)</>}
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          hello from <Link className="text-blue-500" href="https://bsky.app/profile/natalie.sh">@natalie.sh</Link>! data sourced from <Link className="text-blue-500" href="https://bsky.app/profile/jaz.bsky.social">jaz's</Link> <Link className="text-blue-500" href="https://bsky.jazco.dev/stats">bsky stats</Link>
        </div>
        </div>
      </div>
    </div>
  );
}
