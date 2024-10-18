'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, Clock, TrendingUp } from 'lucide-react';
import AnimatedCounter from '@/components/animatedCounter';

function roundToNextMilestone(num: number) {
  const magnitude = Math.pow(10, Math.floor(Math.log10(num)));
  return Math.ceil(num / magnitude) * magnitude;
}

export default function Home() {
  const [userCount, setUserCount] = useState(0);
  const [interpolatedCount, setInterpolatedCount] = useState(0);
  const [barMax, setBarMax] = useState(100);
  const [progressUntilNextUpdate, setProgressUntilNextUpdate] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [growthRate, setGrowthRate] = useState(4.5 * 60); // Default to 4.5 users per second

  const UPDATE_INTERVAL = 60000; // 1 minute in milliseconds

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();

        const newUserCount = data.total_users;
        const apiLastUpdateTime = new Date(data.last_update_time).getTime(); // API last update time to timestamp
        const currentTime = Date.now();

        if (userCount > 0) {
          // Calculate time difference between current time and API last update time (in seconds)
          const elapsedTime = (currentTime - lastUpdateTime) / 1000;

          // Calculate new growth rate (users per second)
          const newGrowthRate = (newUserCount - userCount) / elapsedTime;
          setGrowthRate(newGrowthRate); // Update growth rate
        }

        // Update the user count, bar max, and last update time
        setUserCount(newUserCount);
        setBarMax(roundToNextMilestone(newUserCount));
        setLastUpdateTime(apiLastUpdateTime); // Set last update time from API
      } catch (error) {
        console.error('Error fetching user count:', error);
      }
    };

    fetchData(); // Initial fetch
    const interval = setInterval(fetchData, UPDATE_INTERVAL); // Fetch every 60 seconds

    return () => clearInterval(interval);
  }, [userCount, lastUpdateTime]);

  useEffect(() => {
    const timer = setInterval(() => {
      const elapsedTime = Date.now() - lastUpdateTime;
      const progress = (elapsedTime / UPDATE_INTERVAL) * 100;

      // Ensure progress is capped at 100%
      setProgressUntilNextUpdate(Math.min(progress, 100));

      // Calculate time remaining in seconds until the next update
      const timeRemaining = Math.max(
        Math.ceil((UPDATE_INTERVAL - elapsedTime) / 1000), // Convert from ms to seconds
        0 // Ensure it doesn't go below 0
      );

      console.log((UPDATE_INTERVAL - elapsedTime) / 1000);

      // Estimate current user count based on growth rate
      const estimatedGrowth = (growthRate * elapsedTime) / 1000;
      setInterpolatedCount(Math.round(userCount + estimatedGrowth));

      // Set time until next update
      setProgressUntilNextUpdate(timeRemaining);
    }, 100);

    return () => clearInterval(timer);
  }, [lastUpdateTime, userCount, growthRate]);

  useEffect(() => {
    const timer = setInterval(() => {
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
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center mb-8">
        Bluesky User Counter
      </h1>
      <div className="grid place-items-center w-screen">
        <div className="max-w-lg pb-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold">
                <AnimatedCounter
                  value={Math.floor(
                    userCount + growthRate * (progressUntilNextUpdate / 100)
                  )}
                  includeCommas={true}
                  includeDecimals={false}
                  decrementColor="black"
                  incrementColor="black"
                />
              </div>
              <Progress
                value={
                  ((interpolatedCount +
                    growthRate * (progressUntilNextUpdate / 100)) /
                    barMax) *
                  100
                }
                className="h-2 mt-4"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {(
                  ((interpolatedCount +
                    growthRate * (progressUntilNextUpdate / 100)) /
                    barMax) *
                  100
                ).toFixed(2)}
                % of {Intl.NumberFormat().format(barMax)} users
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="max-w-sm">
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
          <Card className="max-w-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{growthRate.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Users per second
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
