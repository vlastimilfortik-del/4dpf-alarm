import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import Animated, {
  useAnimatedProps,
  SharedValue,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing } from "@/constants/theme";

interface CircularProgressProps {
  progress: SharedValue<number>;
  size?: number;
  strokeWidth?: number;
  progressColor?: string;
  backgroundColor?: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function CircularProgress({
  progress,
  size = 200,
  strokeWidth = 12,
  progressColor = Colors.dark.link,
  backgroundColor = Colors.dark.backgroundDefault,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const animatedProps = useAnimatedProps(() => {
    const clampedProgress = Math.min(Math.max(progress.value, 0), 100);
    const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;
    return {
      strokeDashoffset,
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <G rotation="-90" origin={`${center}, ${center}`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={progressColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={styles.centerContent}>
        <ProgressText progress={progress} />
        <ThemedText type="small" color="secondary">
          DPF Level
        </ThemedText>
      </View>
    </View>
  );
}

function ProgressText({ progress }: { progress: SharedValue<number> }) {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setDisplayValue(Math.round(progress.value));
    }, 50);
    return () => clearInterval(interval);
  }, [progress]);

  return (
    <ThemedText type="h1" style={styles.progressText}>
      {displayValue}%
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  svg: {
    position: "absolute",
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: {
    fontFamily: "ui-monospace",
  },
});
