import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  StyleSheet,
  Platform,
  Image,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Brightness from "expo-brightness";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

const TICKET_DURATION = 24 * 60 * 60; // 24 hours in seconds
const STORAGE_KEY = "@transit_ticket_activation";

function generateTicketId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "";
  for (let i = 0; i < 10; i++) {
    if (i === 4 || i === 8) id += "-";
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export default function Index() {
  const [activationTime, setActivationTime] = useState<Date | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(TICKET_DURATION);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [brightnessActive, setBrightnessActive] = useState(false);
  const originalBrightnessRef = useRef<number | null>(null);
  const brightnessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animation value for pulsing effect
  const pulseValue = useSharedValue(1);

  useEffect(() => {
    // Start pulsing animation - scale bigger and smaller
    pulseValue.value = withRepeat(
      withTiming(1.1, {
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    // Load saved activation time or activate new ticket
    loadOrActivateTicket();
  }, []);

  useEffect(() => {
    if (!activationTime) return;

    // Update countdown every second
    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - activationTime.getTime()) / 1000);
      const remaining = TICKET_DURATION - elapsed;

      if (remaining <= 0) {
        setRemainingSeconds(0);
        setIsExpired(true);
        clearInterval(interval);
      } else {
        setRemainingSeconds(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadOrActivateTicket = async () => {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);

      if (savedData) {
        const { activationTime: savedTime, ticketId: savedId } = JSON.parse(savedData);
        const activation = new Date(savedTime);
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - activation.getTime()) / 1000);

        if (elapsed < TICKET_DURATION) {
          // Expiration is exactly activation + 24h
          const expDate = new Date(activation.getTime() + TICKET_DURATION * 1000);
          setActivationTime(activation);
          setExpirationDate(expDate);
          setRemainingSeconds(TICKET_DURATION - elapsed);
          setTicketId(savedId || generateTicketId());
          setIsExpired(false);
        } else {
          setIsExpired(true);
          setRemainingSeconds(0);
        }
      } else {
        activateNewTicket();
      }
    } catch (error) {
      console.error("Error loading ticket:", error);
      activateNewTicket();
    }
  };

  const activateNewTicket = async () => {
    const now = new Date();
    const expDate = new Date(now.getTime() + TICKET_DURATION * 1000);
    const newTicketId = generateTicketId();

    setActivationTime(now);
    setExpirationDate(expDate);
    setRemainingSeconds(TICKET_DURATION);
    setTicketId(newTicketId);
    setIsExpired(false);

    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ activationTime: now.toISOString(), ticketId: newTicketId })
      );
    } catch (error) {
      console.error("Error saving ticket:", error);
    }
  };

  const formatCountdown = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
  };

  const handleShowToDriver = async () => {
    if (brightnessActive) {
      // Restore brightness manually
      if (originalBrightnessRef.current !== null) {
        await Brightness.setBrightnessAsync(originalBrightnessRef.current);
      }
      if (brightnessTimerRef.current) clearTimeout(brightnessTimerRef.current);
      setBrightnessActive(false);
      return;
    }

    try {
      const { status } = await Brightness.requestPermissionsAsync();
      if (status === "granted") {
        const current = await Brightness.getBrightnessAsync();
        originalBrightnessRef.current = current;
        await Brightness.setBrightnessAsync(1.0);
        setBrightnessActive(true);

        // Auto-restore after 10 seconds
        brightnessTimerRef.current = setTimeout(async () => {
          if (originalBrightnessRef.current !== null) {
            await Brightness.setBrightnessAsync(originalBrightnessRef.current);
          }
          setBrightnessActive(false);
        }, 10000);
      }
    } catch (error) {
      console.error("Brightness error:", error);
    }
  };

  const formatExpirationDate = (date: Date | null) => {
    if (!date) return "";
    
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Chicago",
    };
    
    return date.toLocaleDateString("en-US", options).replace(",", " at");
  };

  // Animated style for pulsing effect - scale bigger and smaller
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseValue.value }],
    };
  });

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header - Top Left */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>RTA</Text>
          <Text style={styles.headerSubtitle}>Show operator your ticket</Text>
        </View>
      </View>

      {/* Warning Banner */}
      <View style={styles.warningBanner}>
        <Text style={styles.warningText}>
          ⚠️ Do not close this screen while boarding
        </Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Animated Circular Ticket Validator */}
        <Animated.View style={[styles.circleContainer, animatedStyle]}>
          <Svg height="220" width="220" style={styles.svg}>
            <Circle
              cx="110"
              cy="110"
              r="95"
              stroke={isExpired ? "#9ca3af" : "#f59e0b"}
              strokeWidth="18"
              fill="none"
            />
          </Svg>

          {/* Center Logo/Badge */}
          <View style={styles.centerBadge}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>RTA</Text>
            </View>
          </View>
        </Animated.View>

        {/* Countdown Timer */}
        <View style={styles.timerContainer}>
          <Text style={[styles.timer, isExpired && styles.timerExpired]}>
            {formatCountdown(remainingSeconds)}
          </Text>
          <Text style={styles.timerLabel}>
            {isExpired ? "TICKET EXPIRED" : "TIME REMAINING"}
          </Text>
        </View>

        {/* Ticket Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.ticketType}>Adult Regional Ride, 1 Day</Text>
          <Text style={styles.ticketLocation}>New Orleans, LA</Text>
          <View style={styles.divider} />
          <Text style={styles.expirationText}>
            Expires {formatExpirationDate(expirationDate)}
          </Text>
          {ticketId ? (
            <Text style={styles.ticketIdText}>Ticket # {ticketId}</Text>
          ) : null}
        </View>

        {/* Show to Driver Button */}
        {!isExpired && (
          <TouchableOpacity
            style={[styles.driverButton, brightnessActive && styles.driverButtonActive]}
            onPress={handleShowToDriver}
            activeOpacity={0.8}
          >
            <Text style={styles.driverButtonText}>
              {brightnessActive ? "Tap to Restore" : "Show Ticket to Driver"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
  },
  headerLeft: {
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#000",
  },
  warningBanner: {
    backgroundColor: "#fef3c7",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#f59e0b",
  },
  warningText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400e",
    textAlign: "center",
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  circleContainer: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  svg: {
    position: "absolute",
  },
  centerBadge: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#000",
    letterSpacing: 1,
  },
  timerContainer: {
    marginBottom: 28,
    alignItems: "center",
  },
  timer: {
    fontSize: 52,
    fontWeight: "700",
    color: "#000",
    letterSpacing: -1,
    fontVariant: ["tabular-nums"],
  },
  timerExpired: {
    color: "#9ca3af",
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6b7280",
    letterSpacing: 1.5,
    marginTop: 4,
  },
  detailsCard: {
    width: "100%",
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  ticketType: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  ticketLocation: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginBottom: 16,
  },
  expirationText: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 6,
  },
  ticketIdText: {
    fontSize: 12,
    color: "#9ca3af",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  driverButton: {
    backgroundColor: "#000",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
  },
  driverButtonActive: {
    backgroundColor: "#f59e0b",
  },
  driverButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
