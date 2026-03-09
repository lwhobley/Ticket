import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  StyleSheet,
  Platform,
  Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

export default function Index() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [isExpired, setIsExpired] = useState(false);

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
    // Update current time every second
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadOrActivateTicket = async () => {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (savedData) {
        const { activationTime } = JSON.parse(savedData);
        const activationDate = new Date(activationTime);
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - activationDate.getTime()) / 1000);

        if (elapsed < TICKET_DURATION) {
          const expDate = new Date(activationDate.getTime() + TICKET_DURATION * 1000);
          setExpirationDate(expDate);
          setIsExpired(false);
        } else {
          setIsExpired(true);
        }
      } else {
        // Activate new ticket
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
    
    setExpirationDate(expDate);
    setIsExpired(false);

    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ activationTime: now.toISOString() })
      );
    } catch (error) {
      console.error("Error saving ticket:", error);
    }
  };

  const formatCurrentTime = (date: Date) => {
    // Convert to Central Time (CST/CDT - UTC-6 or UTC-5)
    const options: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: "America/Chicago",
    };
    
    return date.toLocaleTimeString("en-US", options);
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

      {/* Main Content */}
      <View style={styles.content}>
        {/* Animated Circular Ticket Validator */}
        <Animated.View style={[styles.circleContainer, animatedStyle]}>
          <Svg height="220" width="220" style={styles.svg}>
            <Circle
              cx="110"
              cy="110"
              r="95"
              stroke="#f59e0b"
              strokeWidth="18"
              fill="none"
            />
          </Svg>
          
          {/* Center Logo/Badge */}
          <View style={styles.centerBadge}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>RTA</Text>
              <View style={styles.chevronsContainer}>
                <Svg width="24" height="30" viewBox="0 0 24 30">
                  {/* Purple chevron - top, least offset */}
                  <Path d="M0 2 L8 6 L0 10 Z" fill="#9333ea" />
                  {/* Green chevron - middle, medium offset */}
                  <Path d="M3 11 L11 15 L3 19 Z" fill="#10b981" />
                  {/* Orange chevron - bottom, most offset */}
                  <Path d="M6 20 L14 24 L6 28 Z" fill="#f59e0b" />
                </Svg>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Time Display */}
        <View style={styles.timerContainer}>
          <Text style={styles.timer}>
            {formatCurrentTime(currentTime)}
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
        </View>
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
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  circleContainer: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
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
    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)",
    elevation: 4,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#000",
    letterSpacing: 1,
  },
  chevronsContainer: {
    marginLeft: 4,
  },
  timerContainer: {
    marginBottom: 32,
  },
  timer: {
    fontSize: 52,
    fontWeight: "700",
    color: "#000",
    letterSpacing: -1,
  },
  detailsCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 0,
    padding: 0,
    paddingHorizontal: 24,
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
  },
});
