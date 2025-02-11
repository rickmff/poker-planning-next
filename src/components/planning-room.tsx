"use client";

import { useState, useEffect } from "react";
import { useSocketStore } from "@/hooks/use-socket-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PlayerCard } from "@/components/player-card";
import { DEFAULT_VOTING_OPTIONS } from "@/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";

export function PlanningRoom() {
  const room = useSocketStore((state) => state.room);
  const currentUser = useSocketStore((state) => state.currentUser);
  const submitVote = useSocketStore((state) => state.submitVote);
  const revealVotes = useSocketStore((state) => state.revealVotes);
  const startVoting = useSocketStore((state) => state.startVoting);
  const endVoting = useSocketStore((state) => state.endVoting);

  // Timer state
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Timer functions
  const startTimer = (duration: number = 60) => {
    setTimeLeft(duration);
    setIsTimerActive(true);
  };

  const stopTimer = () => {
    setTimeLeft(null);
    setIsTimerActive(false);
  };

  // Timer effect
  useEffect(() => {
    if (!room || !currentUser || !isTimerActive || timeLeft === null) return;

    if (timeLeft === 0) {
      if (currentUser.isHost && room.isVoting) revealVotes();
      stopTimer();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((time) => (time ?? 0) - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft, room, currentUser, revealVotes]);

  if (!room || !currentUser) return null;

  const canReveal = currentUser.isHost && room.isVoting;
  const canVote = !currentUser.isSpectator && room.isVoting;

  const spectators = room.users.filter((u) => u.isSpectator);
  const players = room.users.filter((u) => !u.isSpectator);

  // Calculate positions for players around the table
  const getPlayerPosition = (index: number, total: number) => {
    // Start from the bottom center and go clockwise
    const angle = (index * (360 / total) + 180) % 360; // Start from bottom
    const radius = { x: 45, y: 35 }; // Different radiuses for x and y to create oval
    const x = 50 + radius.x * Math.cos((angle * Math.PI) / 180);
    const y = 50 + radius.y * Math.sin((angle * Math.PI) / 180);
    return { x, y };
  };

  // Calculate most voted card
  const getMostVotedCard = () => {
    if (!room.showVotes) return null;

    const voteCount = players.reduce((acc, player) => {
      if (player.vote) {
        acc[player.vote] = (acc[player.vote] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    if (Object.keys(voteCount).length === 0) return null;

    const mostVoted = Object.entries(voteCount).reduce((a, b) =>
      voteCount[a[0]] > voteCount[b[0]] ? a : b
    );

    return {
      value: mostVoted[0],
      count: mostVoted[1],
      total: players.length,
    };
  };

  // Format time for display
  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Handle voting session start/end
  const handleStartVoting = () => {
    startVoting();
    startTimer(60); // Start 60 second timer
  };

  const handleEndVoting = () => {
    // Check if all players have voted
    const nonVoters = players.filter((p) => !p.isSpectator && p.vote === null);

    if (nonVoters.length > 0) {
      toast.warning(
        `${nonVoters.length} player${
          nonVoters.length > 1 ? "s" : ""
        } haven't voted yet`,
        {
          description: nonVoters.map((p) => p.name).join(", "),
          action: {
            label: "End Anyway",
            onClick: () => {
              revealVotes();
              stopTimer();
              setTimeout(() => endVoting(), 1500);
            },
          },
        }
      );
      return;
    }

    revealVotes();
    stopTimer();
    setTimeout(() => endVoting(), 1500);
  };

  return (
    <div className="min-h-screen flex flex-col gap-20">
      {/* Header with Timer */}
      <div className="flex items-center justify-between bg-card p-4 rounded-lg shadow-sm mb-12">
        <div className="flex items-center gap-4 w-2/4 mx-auto justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">{room.name}</h2>
            <p className="text-sm text-muted-foreground">
              {players.length} player{players.length !== 1 && "s"} •{" "}
              {spectators.length} spectator{spectators.length !== 1 && "s"}
            </p>
          </div>
          {isTimerActive && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="px-3 py-1 rounded-full bg-primary/10 text-primary font-mono"
            >
              {formatTime(timeLeft)}
            </motion.div>
          )}
          {currentUser.isHost && (
            <Button
              onClick={room.isVoting ? handleEndVoting : handleStartVoting}
              variant={room.isVoting ? "destructive" : "default"}
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white"
            >
              {room.isVoting ? "End & Reveal" : "Start New Round"}
            </Button>
          )}
        </div>
      </div>

      {/* Poker Table Layout */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          {/* The Table */}
          <div className="relative w-[80vw] h-[45vw] max-w-[800px] max-h-[450px]">
            {/* Table Surface */}
            <div className="absolute inset-[10%] rounded-full bg-gradient-to-br from-emerald-800 to-emerald-900 shadow-2xl border-[12px] border-[#61300d] overflow-hidden">
              {/* Wood Grain Effect */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `repeating-linear-gradient(
                    45deg,
                    #246742 0px,
                    #2C724C 5px,
                    #337E51 10px
                  )`,
                }}
              />
              {/* Table Felt Pattern */}
              <div className="absolute inset-3 rounded-full border border-emerald-700/30" />

              {/* Most Voted Card Display */}
              {room.showVotes && !room.isVoting && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                >
                  {getMostVotedCard() && (
                    <>
                      <Card
                        value={getMostVotedCard()?.value}
                        revealed={true}
                        className="w-20 h-28"
                        disabled
                      />
                      <div className="text-white/90 text-sm font-medium bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
                        {getMostVotedCard()?.count} of{" "}
                        {getMostVotedCard()?.total} votes
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </div>

            {/* Players around the table */}
            {players.map((user, index) => {
              const pos = getPlayerPosition(index, players.length);
              return (
                <div
                  key={user.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                  }}
                >
                  <PlayerCard
                    user={user}
                    showVote={room.showVotes}
                    isVoting={room.isVoting}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Voting Cards */}
      {room.isVoting && (
        <div>
          <div className="bg-card/50 backdrop-blur-sm p-4 rounded-lg shadow-sm space-y-4 flex flex-col items-center">
            <div className="flex flex-row gap-2 w-2/4">
              {DEFAULT_VOTING_OPTIONS.map((option) => (
                <Card
                  key={option}
                  value={option}
                  selected={currentUser.vote === option}
                  revealed={true}
                  disabled={!canVote}
                  onClick={() => canVote && submitVote(option)}
                  className="w-full"
                  isCurrentUser={true}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Spectators */}
      {spectators.length > 0 && (
        <div className="bg-muted/50 backdrop-blur-sm p-3 rounded-lg">
          <h3 className="text-sm font-medium mb-3">Spectators</h3>
          <div className="flex flex-wrap gap-3">
            {spectators.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs">{user.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
