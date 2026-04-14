import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { S1_Intro } from './scenes/S1_Intro';
import { S2_Pain } from './scenes/S2_Pain';
import { S3_Solution } from './scenes/S3_Solution';
import { S4_Chat } from './scenes/S4_Chat';
import { S5_Analysis } from './scenes/S5_Analysis';
import { S6_Backtest } from './scenes/S6_Backtest';
import { S7_Live } from './scenes/S7_Live';
import { S8_CTA } from './scenes/S8_CTA';

// Scene timing (frames at 30fps)
// Total: 1260 frames = 42 seconds
export const SCENES = {
  intro:    { from: 0,    duration: 90  }, // 3s
  pain:     { from: 90,   duration: 120 }, // 4s
  solution: { from: 210,  duration: 120 }, // 4s
  chat:     { from: 330,  duration: 180 }, // 6s
  analysis: { from: 510,  duration: 180 }, // 6s
  backtest: { from: 690,  duration: 210 }, // 7s
  live:     { from: 900,  duration: 150 }, // 5s
  cta:      { from: 1050, duration: 210 }, // 7s
};

export const TradeMindAd: React.FC = () => {
  return (
    <AbsoluteFill>
      <Sequence from={SCENES.intro.from} durationInFrames={SCENES.intro.duration}>
        <S1_Intro />
      </Sequence>
      <Sequence from={SCENES.pain.from} durationInFrames={SCENES.pain.duration}>
        <S2_Pain />
      </Sequence>
      <Sequence from={SCENES.solution.from} durationInFrames={SCENES.solution.duration}>
        <S3_Solution />
      </Sequence>
      <Sequence from={SCENES.chat.from} durationInFrames={SCENES.chat.duration}>
        <S4_Chat />
      </Sequence>
      <Sequence from={SCENES.analysis.from} durationInFrames={SCENES.analysis.duration}>
        <S5_Analysis />
      </Sequence>
      <Sequence from={SCENES.backtest.from} durationInFrames={SCENES.backtest.duration}>
        <S6_Backtest />
      </Sequence>
      <Sequence from={SCENES.live.from} durationInFrames={SCENES.live.duration}>
        <S7_Live />
      </Sequence>
      <Sequence from={SCENES.cta.from} durationInFrames={SCENES.cta.duration}>
        <S8_CTA />
      </Sequence>
    </AbsoluteFill>
  );
};
