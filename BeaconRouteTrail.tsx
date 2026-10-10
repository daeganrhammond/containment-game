import React from 'react';
import { View } from 'react-native';

type Point = { x: number; y: number };

type BeaconRouteTrailProps = {
  from: Point;
  to: Point;
  width: number;
  height: number;
  color: string;
  id: string;
  spacing?: number;
  minDots?: number;
  maxDots?: number;
  dotSize?: number;
  opacity?: number;
};

/** Shared dotted-route geometry for the live sector chart and saved route atlas. */
export function BeaconRouteTrail({
  from,
  to,
  width,
  height,
  color,
  id,
  spacing = 4,
  minDots = 5,
  maxDots = Number.POSITIVE_INFINITY,
  dotSize = 4,
  opacity = 1,
}: BeaconRouteTrailProps) {
  if (width <= 0 || height <= 0) return null;

  const dx = (to.x - from.x) * width;
  const dy = (to.y - from.y) * height;
  const count = Math.max(minDots, Math.min(maxDots, Math.ceil(Math.hypot(dx, dy) / spacing)));
  const offset = dotSize / 2;

  return <>
    {Array.from({ length: count }, (_, index) => {
      const progress = (index + 0.5) / count;
      return <View
        key={`${id}:${index}`}
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: from.x * width + dx * progress - offset,
          top: from.y * height + dy * progress - offset,
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize,
          backgroundColor: color,
          opacity,
        }}
      />;
    })}
  </>;
}
