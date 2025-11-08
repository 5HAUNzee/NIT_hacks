import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { db } from "../../firebase.config";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

const { height } = Dimensions.get("window");

const BrowseEvents = ({ navigation }) => {
  const [eventsData, setEventsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);

  useEffect(() => {
    const eventsRef = collection(db, "events");
    const q = query(eventsRef, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const events = [];
        querySnapshot.forEach((doc) => {
          events.push({ id: doc.id, ...doc.data() });
        });
        setEventsData(events);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching events:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const categories = [
    { name: "All", icon: "grid" },
    { name: "Hackathon", icon: "code" },
    { name: "Workshop", icon: "book-open" },
    { name: "Conference", icon: "users" },
    { name: "Competition", icon: "award" },
  ];

  const filteredEvents = eventsData.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesCategory =
      selectedCategory === "All" || event.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEventPress = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const getEventTypeColor = (type) => {
    switch (type) {
      case "Hackathon":
        return { bg: "#dbeafe", text: "#2563eb" };
      case "Workshop":
        return { bg: "#dcfce7", text: "#15803d" };
      case "Conference":
        return { bg: "#ede9fe", text: "#7c3aed" };
      case "Competition":
        return { bg: "#ffedd5", text: "#c2410c" };
      default:
        return { bg: "#f3f4f6", text: "#374151" };
    }
  };

  const EventCard = ({ event }) => {
    const colors = getEventTypeColor(event.type);
    return (
      <TouchableOpacity
        onPress={() => handleEventPress(event)}
        style={{
          backgroundColor: "white",
          borderRadius: 12,
          marginBottom: 16,
          borderColor: "#e5e7eb",
          borderWidth: 1,
          padding: 16,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <View
          style={{
            backgroundColor: colors.bg,
            padding: 12,
            borderRadius: 12,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text style={{ color: colors.text, fontWeight: "600" }}>{event.type}</Text>
          <Text
            style={{
              backgroundColor: event.status === "Open" ? "#22c55e" : "#a1a1aa",
              color: "white",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              fontWeight: "600",
              fontSize: 12,
            }}
          >
            {event.status}
          </Text>
        </View>
        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>
          {event.title}
        </Text>
        <Text style={{ color: "#6b7280", marginBottom: 10 }} numberOfLines={2}>
          {event.description}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 8 }}>
          {event.tags.map((tag, idx) => (
            <View
              key={idx}
              style={{
                backgroundColor: "#e0e7ff",
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 6,
                marginRight: 8,
                marginBottom: 8,
              }}
            >
              <Text style={{ color: "#3730a3", fontWeight: "600" }}>{tag}</Text>
            </View>
          ))}
        </View>
        <Text style={{ color: "#6b7280" }}>Date: {event.date}</Text>
        <Text style={{ color: "#6b7280" }}>Time: {event.time}</Text>
        <Text style={{ color: "#6b7280" }}>Location: {event.location}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      {/* Header */}
      <View
        style={{
          padding: 16,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottomWidth: 1,
          borderBottomColor: "#e5e7eb",
          backgroundColor: "white",
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "bold" }}>Browse Events</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search */}
      <View
        style={{
          backgroundColor: "#e0e7ff",
          margin: 16,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 10,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Feather name="search" size={20} color="#6366f1" />
        <TextInput
          style={{ marginLeft: 12, flex: 1, color: "#4b5563" }}
          placeholder="Search events..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Feather name="x" size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ paddingLeft: 16, paddingBottom: 10 }}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.name}
            onPress={() => setSelectedCategory(cat.name)}
            style={{
              backgroundColor: selectedCategory === cat.name ? "#4f46e5" : "#e0e7ff",
              marginRight: 12,
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 20,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Feather
              name={cat.icon}
              size={16}
              color={selectedCategory === cat.name ? "white" : "#4f46e5"}
            />
            <Text
              style={{
                marginLeft: 8,
                fontWeight: "600",
                color: selectedCategory === cat.name ? "white" : "#4f46e5",
              }}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Events List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : filteredEvents.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#9ca3af", fontSize: 16 }}>No events found.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </ScrollView>
      )}

      {/* Event Detail Modal */}
      <Modal
        visible={showEventModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEventModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setShowEventModal(false)}
          />
          {selectedEvent && (
            <View
              style={{
                backgroundColor: "white",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                maxHeight: height * 0.75,
                padding: 20,
              }}
            >
              <ScrollView>
                <Text style={{ fontSize: 24, fontWeight: "bold" }}>
                  {selectedEvent.title}
                </Text>
                <Text style={{ marginTop: 12, color: "#4b5563" }}>
                  {selectedEvent.description}
                </Text>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default BrowseEvents;
