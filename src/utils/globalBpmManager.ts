import React, { useState, useEffect } from 'react';
import { setMetronomeBpm } from './metronomeEngine';
import { setDrumBpm } from './drumMachineEngine';

let globalBpm = 90;
const subscribers = new Set<(bpm: number) => void>();

export function getGlobalBpm(): number {
  return globalBpm;
}

export function setGlobalBpm(newBpm: number): void {
  const rounded = Math.min(240, Math.max(30, Math.round(newBpm)));
  globalBpm = rounded;

  // Sync metronome & drum machine engines
  setMetronomeBpm(rounded);
  setDrumBpm(rounded);

  // Notify all subscribers
  subscribers.forEach(sub => sub(rounded));
}

export function subscribeGlobalBpm(listener: (bpm: number) => void): () => void {
  subscribers.add(listener);
  listener(globalBpm);
  return () => {
    subscribers.delete(listener);
  };
}

/**
 * React hook to bind any component's BPM state directly to the global master tempo.
 */
export function useGlobalBpm(): [number, (newBpm: number) => void] {
  const [bpm, setBpmState] = useState<number>(globalBpm);

  useEffect(() => {
    return subscribeGlobalBpm((updatedBpm) => {
      setBpmState(updatedBpm);
    });
  }, []);

  const updateBpm = (newBpm: number) => {
    setGlobalBpm(newBpm);
  };

  return [bpm, updateBpm];
}
