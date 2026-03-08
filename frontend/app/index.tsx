import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Dimensions,
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
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

const TICKET_DURATION = 24 * 60 * 60; // 24 hours in seconds
const STORAGE_KEY = "@transit_ticket_activation";

export default function Index() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isBrightened, setIsBrightened] = useState(false);
  const originalBrightness = useRef<number>(0.5);

  // Animation value for pulsing effect
  const pulseValue = useSharedValue(1);

  useEffect(() => {
    // Start pulsing animation
    pulseValue.value = withRepeat(
      withTiming(0.6, {
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

  const handleShowToDriver = async () => {
    try {
      if (!isBrightened) {
        // Save current brightness
        const { status } = await Brightness.requestPermissionsAsync();
        if (status === "granted") {
          const currentBrightness = await Brightness.getBrightnessAsync();
          originalBrightness.current = currentBrightness;
          await Brightness.setBrightnessAsync(1.0);
          setIsBrightened(true);

          // Auto-restore after 10 seconds
          setTimeout(async () => {
            await Brightness.setBrightnessAsync(originalBrightness.current);
            setIsBrightened(false);
          }, 10000);
        }
      } else {
        // Restore brightness
        await Brightness.setBrightnessAsync(originalBrightness.current);
        setIsBrightened(false);
      }
    } catch (error) {
      console.error("Error adjusting brightness:", error);
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

  const generateTicketId = () => {
    // Generate a unique ticket ID based on activation time
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let id = "TKT-";
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  };

  // Animated style for pulsing effect
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: pulseValue.value,
      transform: [{ scale: 0.95 + pulseValue.value * 0.05 }],
    };
  });

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>RTA</Text>
          <Text style={styles.headerSubtitle}>Show operator your ticket</Text>
        </View>
        <TouchableOpacity style={styles.helpButton}>
          <Ionicons name="help-circle-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Animated Circular Ticket Validator */}
        <Animated.View style={[styles.circleContainer, animatedStyle]}>
          <Svg height="200" width="200" style={styles.svg}>
            <Defs>
              <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#9333ea" stopOpacity="1" />
                <Stop offset="50%" stopColor="#a855f7" stopOpacity="1" />
                <Stop offset="100%" stopColor="#ec4899" stopOpacity="1" />
              </LinearGradient>
            </Defs>
            <Circle
              cx="100"
              cy="100"
              r="85"
              stroke="url(#grad)"
              strokeWidth="16"
              fill="none"
            />
          </Svg>
          
          {/* Center Logo/Badge */}
          <View style={styles.centerBadge}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>RTA</Text>
              <View style={styles.chevronContainer}>
                <View style={[styles.chevron, { backgroundColor: "#9333ea" }]} />
                <View style={[styles.chevron, { backgroundColor: "#10b981" }]} />
                <View style={[styles.chevron, { backgroundColor: "#f59e0b" }]} />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Countdown Timer Display */}
        <View style={styles.timerContainer}>
          <Text style={[styles.timer, isExpired && styles.expiredTimer]}>
            {formatCurrentTime(currentTime)}
          </Text>
        </View>

        {/* Ticket Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.ticketType}>Regional Day Pass</Text>
          <Text style={styles.ticketSubtitle}>Unlimited rides on Bus, Streetcar & Ferry</Text>
          <View style={styles.divider} />
          <Text style={styles.expirationText}>
            Expires: {formatExpirationDate(expirationDate)}
          </Text>
          <Text style={styles.ticketId}>Ticket ID: {generateTicketId()}</Text>
        </View>

        {/* Show to Driver Button */}
        <TouchableOpacity
          style={[styles.showButton, isBrightened && styles.showButtonActive]}
          onPress={handleShowToDriver}
        >
          <Ionicons
            name={isBrightened ? "sunny" : "sunny-outline"}
            size={20}
            color="#fff"
            style={styles.buttonIcon}
          />
          <Text style={styles.showButtonText}>
            {isBrightened ? "Brightness Boosted" : "Show Ticket to Driver"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Warning Banner */}
      <View style={styles.warningBanner}>
        <Ionicons name="alert-circle" size={18} color="#dc2626" />
        <Text style={styles.warningText}>
          Do not close this screen while boarding
        </Text>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: "#ffffff",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  helpButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  circleContainer: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  svg: {
    position: "absolute",
  },
  centerBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)",
    elevation: 4,
  },
  logoBadge: {
    alignItems: "center",
  },
  logoText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#000",
    letterSpacing: 1,
  },
  chevronContainer: {
    flexDirection: "row",
    marginTop: 4,
    gap: 2,
  },
  chevron: {
    width: 8,
    height: 12,
    borderRadius: 2,
  },
  timerContainer: {
    marginBottom: 32,
  },
  timer: {
    fontSize: 56,
    fontWeight: "700",
    color: "#000",
    letterSpacing: -1,
  },
  expiredTimer: {
    color: "#dc2626",
  },
  detailsCard: {
    width: "100%",
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  ticketType: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  ticketSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginBottom: 16,
  },
  expirationText: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 8,
  },
  ticketId: {
    fontSize: 12,
    color: "#9ca3af",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  showButton: {
    flexDirection: "row",
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 4px 8px rgba(59, 130, 246, 0.3)",
    elevation: 4,
  },
  showButtonActive: {
    backgroundColor: "#f59e0b",
  },
  buttonIcon: {
    marginRight: 8,
  },
  showButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fef2f2",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: "#fecaca",
    gap: 8,
  },
  warningText: {
    fontSize: 14,
    color: "#dc2626",
    fontWeight: "500",
  },
});
