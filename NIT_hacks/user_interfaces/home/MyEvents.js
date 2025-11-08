import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase.config";

const MyEvents = ({ navigation }) => {
  const { user } = useUser();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");

  useEffect(() => {
    if (!user?.id) return;

    const registrationsRef = collection(
      db,
      "users",
      user.id,
      "eventRegistrations"
    );

    const unsubscribe = onSnapshot(
      registrationsRef,
      (querySnapshot) => {
        const events = [];
        querySnapshot.forEach((doc) => {
          events.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        // Sort by event date
        events.sort((a, b) => {
          const dateA = new Date(a.eventDate);
          const dateB = new Date(b.eventDate);
          return dateA - dateB;
        });
        setRegistrations(events);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching registrations:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.id]);

  const getFilteredEvents = () => {
    const now = new Date();
    if (activeTab === "upcoming") {
      return registrations.filter((event) => new Date(event.eventDate) >= now);
    } else {
      return registrations.filter((event) => new Date(event.eventDate) < now);
    }
  };

  const getEventTypeIcon = (type) => {
    switch (type) {
      case "Hackathon":
        return "code";
      case "Workshop":
        return "book-open";
      case "Conference":
        return "users";
      case "Competition":
        return "award";
      default:
        return "calendar";
    }
  };

  const getEventTypeColor = (type) => {
    switch (type) {
      case "Hackathon":
        return "#8b5cf6";
      case "Workshop":
        return "#3b82f6";
      case "Conference":
        return "#10b981";
      case "Competition":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  const EventCard = ({ event }) => {
    const typeColor = getEventTypeColor(event.eventType || "Event");
    const isPast = new Date(event.eventDate) < new Date();

    return (
      <TouchableOpacity
        style={[styles.eventCard, isPast && styles.eventCardPast]}
        activeOpacity={0.7}
        onPress={() => {
          // Navigate to event details or show registration details
        }}
      >
        {/* Event Type Badge */}
        <View style={[styles.typeBadge, { backgroundColor: typeColor + "20" }]}>
          <Feather
            name={getEventTypeIcon(event.eventType)}
            size={16}
            color={typeColor}
          />
          <Text style={[styles.typeText, { color: typeColor }]}>
            {event.eventType || "Event"}
          </Text>
        </View>

        {/* Event Title */}
        <Text style={styles.eventTitle} numberOfLines={2}>
          {event.eventTitle}
        </Text>

        {/* Event Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Feather name="calendar" size={14} color="#6b7280" />
            <Text style={styles.infoText}>{event.eventDate}</Text>
          </View>
          <View style={styles.infoRow}>
            <Feather name="clock" size={14} color="#6b7280" />
            <Text style={styles.infoText}>{event.eventTime}</Text>
          </View>
        </View>

        {/* Registration Status */}
        <View style={styles.statusContainer}>
          <View style={styles.statusBadge}>
            <Feather name="check-circle" size={14} color="#10b981" />
            <Text style={styles.statusText}>
              {event.status === "confirmed" ? "Confirmed" : "Pending"}
            </Text>
          </View>
          {event.teamName && (
            <View style={styles.teamBadge}>
              <Feather name="users" size={14} color="#3b82f6" />
              <Text style={styles.teamText}>{event.teamName}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const filteredEvents = getFilteredEvents();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Events</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "upcoming" && styles.tabActive]}
          onPress={() => setActiveTab("upcoming")}
        >
          <Text
            style={[styles.tabText, activeTab === "upcoming" && styles.tabTextActive]}
          >
            Upcoming
          </Text>
          {activeTab === "upcoming" && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "past" && styles.tabActive]}
          onPress={() => setActiveTab("past")}
        >
          <Text
            style={[styles.tabText, activeTab === "past" && styles.tabTextActive]}
          >
            Past
          </Text>
          {activeTab === "past" && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {filteredEvents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="calendar" size={64} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No Events Found</Text>
              <Text style={styles.emptyText}>
                {activeTab === "upcoming"
                  ? "You haven't registered for any upcoming events yet."
                  : "You haven't attended any past events."}
              </Text>
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => navigation.navigate("BrowseEvents")}
              >
                <Text style={styles.browseButtonText}>Browse Events</Text>
                <Feather name="arrow-right" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.eventsGrid}>
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    position: "relative",
  },
  tabActive: {
    // Active tab styling
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6b7280",
  },
  tabTextActive: {
    color: "#3b82f6",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#3b82f6",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  eventsGrid: {
    gap: 12,
  },
  eventCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  eventCardPast: {
    opacity: 0.7,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
  },
  infoContainer: {
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 8,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d1fae5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#10b981",
    marginLeft: 4,
  },
  teamBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dbeafe",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  teamText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3b82f6",
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 32,
  },
  browseButton: {
    flexDirection: "row",
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 24,
  },
  browseButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginRight: 8,
  },
});

export default MyEvents;
