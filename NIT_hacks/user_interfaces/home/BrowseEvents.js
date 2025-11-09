import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Modal,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Share,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { db } from "../../firebase.config";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

const { width, height } = Dimensions.get("window");

const BrowseEvents = ({ navigation }) => {
  const [eventsData, setEventsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'map'
  const mapRef = useRef(null);

  // Fetch events from Firebase
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsRef = collection(db, "events");
        const q = query(eventsRef, orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(
          q,
          (querySnapshot) => {
            const events = [];
            querySnapshot.forEach((doc) => {
              events.push({
                id: doc.id,
                ...doc.data(),
              });
            });
            setEventsData(events);
            setLoading(false);
          },
          (error) => {
            console.error("Error fetching events:", error);
            // If orderBy fails due to missing index, fetch without ordering
            if (error.code === "failed-precondition") {
              console.log("Fetching without ordering...");
              const simpleQuery = collection(db, "events");
              const unsubscribeSimple = onSnapshot(
                simpleQuery,
                (querySnapshot) => {
                  const events = [];
                  querySnapshot.forEach((doc) => {
                    events.push({
                      id: doc.id,
                      ...doc.data(),
                    });
                  });
                  // Sort by createdAt client-side
                  events.sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                    return dateB - dateA;
                  });
                  setEventsData(events);
                  setLoading(false);
                }
              );
              return unsubscribeSimple;
            }
            setLoading(false);
          }
        );

        return () => unsubscribe();
      } catch (error) {
        console.error("Error setting up events listener:", error);
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const categories = [
    { name: "All", icon: "grid" },
    { name: "Hackathon", icon: "code" },
    { name: "Workshop", icon: "book-open" },
    { name: "Conference", icon: "users" },
    { name: "Competition", icon: "award" },
  ];

  // Filter events based on search and category
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

  const handleMapMarkerPress = (event) => {
    setSelectedEvent(event);
    mapRef.current?.animateToRegion({
      latitude: event.latitude,
      longitude: event.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const handleShareEvent = async (event) => {
    try {
      const message = `🎉 Check out this event!\n\n📌 ${event.title}\n📅 ${event.date} at ${event.time}\n📍 ${event.location}\n💰 ${event.registrationFee}\n\nOrganized by ${event.organizer}\n\n${event.description}`;
      
      const result = await Share.share({
        message: message,
        title: event.title,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Shared with activity type of result.activityType
          console.log('Shared with', result.activityType);
        } else {
          // Shared
          console.log('Event shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
        console.log('Share dismissed');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to share event');
      console.error('Error sharing event:', error);
    }
  };

  const getEventTypeColor = (type) => {
    switch (type) {
      case "Hackathon":
        return { bg: "bg-blue-100", text: "text-blue-700", dot: "#3b82f6" };
      case "Workshop":
        return { bg: "bg-green-100", text: "text-green-700", dot: "#10b981" };
      case "Conference":
        return { bg: "bg-purple-100", text: "text-purple-700", dot: "#8b5cf6" };
      case "Competition":
        return { bg: "bg-orange-100", text: "text-orange-700", dot: "#f97316" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-700", dot: "#6b7280" };
    }
  };

  const EventCard = ({ event }) => {
    const colors = getEventTypeColor(event.type);
    
    return (
      <TouchableOpacity
        onPress={() => handleEventPress(event)}
        style={styles.eventCard}
        activeOpacity={0.7}
      >
        {/* Event Header */}
        <View style={styles.eventHeader}>
          <View style={styles.eventTypeContainer}>
            <Feather
              name={event.type === "Hackathon" ? "code" : event.type === "Workshop" ? "book-open" : event.type === "Conference" ? "users" : "award"}
              size={18}
              color={colors.dot}
            />
            <Text style={[styles.eventTypeText, { color: colors.dot }]}>
              {event.type}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: event.status === "Open" ? "#10b981" : "#6b7280" }
            ]}
          >
            <Text style={styles.statusText}>{event.status}</Text>
          </View>
        </View>

        {/* Event Title & Description */}
        <View style={styles.eventBody}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {event.title}
          </Text>
          <Text style={styles.eventDescription} numberOfLines={2}>
            {event.description}
          </Text>
          <Text style={styles.eventOrganizer} numberOfLines={1}>
            by {event.organizer}
          </Text>

          {/* Event Info */}
          <View style={styles.eventInfoContainer}>
            <View style={styles.infoRow}>
              <Feather name="calendar" size={14} color="#6b7280" />
              <Text style={styles.infoText}>{event.date}</Text>
            </View>
            <View style={styles.infoRow}>
              <Feather name="clock" size={14} color="#6b7280" />
              <Text style={styles.infoText}>{event.time}</Text>
            </View>
          </View>

          <View style={styles.eventInfoContainer}>
            <View style={[styles.infoRow, { flex: 1 }]}>
              <Feather name="map-pin" size={14} color="#6b7280" />
              <Text style={styles.infoText} numberOfLines={1}>
                {event.location}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Feather name="users" size={14} color="#6b7280" />
              <Text style={styles.infoText}>{event.participants}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.eventFooter}>
          <View>
            <Text style={styles.feeLabel}>Fee</Text>
            <Text style={styles.feeAmount}>{event.registrationFee}</Text>
          </View>
          <TouchableOpacity 
            style={styles.registerButton}
            onPress={(e) => {
              e.stopPropagation();
              navigation.navigate("EventRegistration", { event });
            }}
          >
            <Text style={styles.registerButtonText}>Register</Text>
            <Feather name="arrow-right" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-100">
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Browse Events</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity onPress={() => navigation.navigate("MyEvents")}>
              <Feather name="bookmark" size={24} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("AddEvent")}>
              <Feather name="plus-circle" size={24} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode(viewMode === "list" ? "map" : "list")}
            >
              <Feather
                name={viewMode === "list" ? "map" : "list"}
                size={24}
                color="#3b82f6"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View className="bg-gray-100 rounded-xl px-4 py-3 flex-row items-center">
          <Feather name="search" size={20} color="#6b7280" />
          <TextInput
            placeholder="Search events..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-3 text-gray-900"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Feather name="x" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter */}
      <View className="bg-white border-b border-gray-100">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
        >
          {categories.map((category) => {
            const isActive = selectedCategory === category.name;

            return (
              <TouchableOpacity
                key={category.name}
                onPress={() => setSelectedCategory(category.name)}
                style={[
                  styles.categoryChip,
                  isActive ? styles.categoryChipActive : styles.categoryChipInactive
                ]}
                activeOpacity={0.7}
              >
                <Feather
                  name={category.icon}
                  size={16}
                  color={isActive ? "#ffffff" : "#6b7280"}
                />
                <Text
                  style={[
                    styles.categoryText,
                    isActive ? styles.categoryTextActive : styles.categoryTextInactive
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>



      {/* View Mode Toggle */}
      {viewMode === "list" ? (
        // List View
        <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-base text-gray-600">
              {filteredEvents.length} events found
            </Text>
            <TouchableOpacity className="flex-row items-center">
              <Feather name="filter" size={16} color="#3b82f6" />
              <Text className="text-blue-600 font-medium ml-2">Filter</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="items-center justify-center py-20">
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text className="text-gray-500 mt-4">Loading events...</Text>
            </View>
          ) : filteredEvents.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Feather name="calendar" size={64} color="#d1d5db" />
              <Text className="text-gray-500 mt-4 text-center">
                No events found
              </Text>
              <Text className="text-gray-400 text-sm mt-2 text-center">
                {eventsData.length === 0
                  ? "Be the first to create an event!"
                  : "Try adjusting your search or filters"}
              </Text>
              {eventsData.length === 0 && (
                <TouchableOpacity
                  onPress={() => navigation.navigate("AddEvent")}
                  className="mt-6 bg-blue-600 px-6 py-3 rounded-xl flex-row items-center"
                >
                  <Feather name="plus" size={20} color="#ffffff" />
                  <Text className="text-white font-semibold ml-2">Create Event</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredEvents.map((event) => <EventCard key={event.id} event={event} />)
          )}
        </ScrollView>
      ) : (
        // Map View
        <View style={{ flex: 1 }}>
          <MapView
            ref={mapRef}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            style={styles.map}
            initialRegion={{
                latitude: 15.2993,
                longitude: 74.1240,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            {filteredEvents.map((event) => {
              const colors = getEventTypeColor(event.type);
              return (
                <Marker
                  key={event.id}
                  coordinate={{
                    latitude: event.latitude,
                    longitude: event.longitude,
                  }}
                  onPress={() => handleMapMarkerPress(event)}
                  pinColor={colors.dot}
                  title={event.title}
                  description={event.location}
                />
              );
            })}
          </MapView>

          {/* Selected Event Card on Map */}
          {selectedEvent && (
            <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl px-6 py-4 border-t border-gray-200">
              <TouchableOpacity
                onPress={() => handleEventPress(selectedEvent)}
                className="flex-row items-center"
              >
                <View className={`${getEventTypeColor(selectedEvent.type).bg} p-3 rounded-xl`}>
                  <Feather
                    name={
                      selectedEvent.type === "Hackathon"
                        ? "code"
                        : selectedEvent.type === "Workshop"
                        ? "book-open"
                        : selectedEvent.type === "Conference"
                        ? "users"
                        : "award"
                    }
                    size={24}
                    color={getEventTypeColor(selectedEvent.type).dot}
                  />
                </View>
                <View className="flex-1 ml-4">
                  <Text className="text-lg font-bold text-gray-900">
                    {selectedEvent.title}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Feather name="map-pin" size={14} color="#6b7280" />
                    <Text className="text-sm text-gray-600 ml-2" numberOfLines={1}>
                      {selectedEvent.location}
                    </Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Event Detail Modal */}
      <Modal
        visible={showEventModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEventModal(false)}
      >
        <View className="flex-1 bg-black/50">
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={() => setShowEventModal(false)}
          />
          <View className="bg-white rounded-t-3xl" style={{ maxHeight: height * 0.85 }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedEvent && (
                <>
                  {/* Modal Header */}
                  <View className={`${getEventTypeColor(selectedEvent.type).bg} px-6 py-6`}>
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <View className="flex-row items-center mb-2">
                          <View
                            className={`${getEventTypeColor(selectedEvent.type).bg} px-3 py-1 rounded-full`}
                          >
                            <Text
                              className={`text-xs font-bold ${
                                getEventTypeColor(selectedEvent.type).text
                              }`}
                            >
                              {selectedEvent.type}
                            </Text>
                          </View>
                          <View
                            className={`ml-2 px-3 py-1 rounded-full ${
                              selectedEvent.status === "Open" ? "bg-green-500" : "bg-gray-400"
                            }`}
                          >
                            <Text className="text-xs text-white font-semibold">
                              {selectedEvent.status}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-2xl font-bold text-gray-900 mb-1">
                          {selectedEvent.title}
                        </Text>
                        <Text className="text-sm text-gray-600">
                          Organized by {selectedEvent.organizer}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setShowEventModal(false)}
                        className="bg-white/50 p-2 rounded-full"
                      >
                        <Feather name="x" size={24} color="#1f2937" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Modal Content */}
                  <View className="px-6 py-6">
                    {/* Description */}
                    <View className="mb-6">
                      <Text className="text-lg font-bold text-gray-900 mb-2">
                        About Event
                      </Text>
                      <Text className="text-base text-gray-600 leading-6">
                        {selectedEvent.description}
                      </Text>
                    </View>

                    {/* Tags */}
                    <View className="mb-6">
                      <Text className="text-lg font-bold text-gray-900 mb-3">
                        Topics
                      </Text>
                      <View className="flex-row flex-wrap gap-2">
                        {selectedEvent.tags.map((tag, index) => (
                          <View
                            key={index}
                            className="bg-blue-100 px-4 py-2 rounded-xl"
                          >
                            <Text className="text-sm font-medium text-blue-700">
                              {tag}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Event Details */}
                    <View className="mb-6">
                      <Text className="text-lg font-bold text-gray-900 mb-3">
                        Event Details
                      </Text>
                      <View className="space-y-3">
                        <View className="flex-row items-center py-3 border-b border-gray-100">
                          <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                            <Feather name="calendar" size={20} color="#3b82f6" />
                          </View>
                          <View className="ml-4">
                            <Text className="text-sm text-gray-500">Date</Text>
                            <Text className="text-base font-semibold text-gray-900">
                              {selectedEvent.date}
                            </Text>
                          </View>
                        </View>
                        <View className="flex-row items-center py-3 border-b border-gray-100">
                          <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center">
                            <Feather name="clock" size={20} color="#10b981" />
                          </View>
                          <View className="ml-4">
                            <Text className="text-sm text-gray-500">Time</Text>
                            <Text className="text-base font-semibold text-gray-900">
                              {selectedEvent.time}
                            </Text>
                          </View>
                        </View>
                        <View className="flex-row items-center py-3 border-b border-gray-100">
                          <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center">
                            <Feather name="map-pin" size={20} color="#8b5cf6" />
                          </View>
                          <View className="ml-4 flex-1">
                            <Text className="text-sm text-gray-500">Location</Text>
                            <Text className="text-base font-semibold text-gray-900">
                              {selectedEvent.location}
                            </Text>
                          </View>
                        </View>
                        
                        {/* Map Preview */}
                        {selectedEvent.latitude && selectedEvent.longitude && (
                          <View className="py-3 border-b border-gray-100">
                            <Text className="text-sm text-gray-500 mb-3">Location on Map</Text>
                            <View style={{ height: 200, borderRadius: 12, overflow: 'hidden' }}>
                              <MapView
                                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                                style={{ flex: 1 }}
                                initialRegion={{
                                  latitude: selectedEvent.latitude,
                                  longitude: selectedEvent.longitude,
                                  latitudeDelta: 0.01,
                                  longitudeDelta: 0.01,
                                }}
                                scrollEnabled={false}
                                zoomEnabled={false}
                                pitchEnabled={false}
                                rotateEnabled={false}
                              >
                                <Marker
                                  coordinate={{
                                    latitude: selectedEvent.latitude,
                                    longitude: selectedEvent.longitude,
                                  }}
                                  pinColor={getEventTypeColor(selectedEvent.type).dot}
                                  title={selectedEvent.title}
                                />
                              </MapView>
                            </View>
                            <Text className="text-xs text-gray-500 mt-2">
                              📍 {selectedEvent.latitude.toFixed(4)}, {selectedEvent.longitude.toFixed(4)}
                            </Text>
                          </View>
                        )}
                        
                        <View className="flex-row items-center py-3 border-b border-gray-100">
                          <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center">
                            <Feather name="users" size={20} color="#f97316" />
                          </View>
                          <View className="ml-4">
                            <Text className="text-sm text-gray-500">Participants</Text>
                            <Text className="text-base font-semibold text-gray-900">
                              {selectedEvent.participants} registered
                            </Text>
                          </View>
                        </View>
                        <View className="flex-row items-center py-3">
                          <View className="w-10 h-10 bg-pink-100 rounded-full items-center justify-center">
                            <Feather name="dollar-sign" size={20} color="#ec4899" />
                          </View>
                          <View className="ml-4">
                            <Text className="text-sm text-gray-500">
                              Registration Fee
                            </Text>
                            <Text className="text-base font-semibold text-gray-900">
                              {selectedEvent.registrationFee}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View className="flex-row gap-3 mb-6">
                      <TouchableOpacity 
                        className="flex-1 bg-blue-600 py-4 rounded-xl items-center"
                        onPress={() => {
                          setShowEventModal(false);
                          navigation.navigate("EventRegistration", { event: selectedEvent });
                        }}
                      >
                        <Text className="text-white font-bold text-base">
                          Register Now
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        className="bg-gray-100 px-6 py-4 rounded-xl items-center justify-center"
                        onPress={() => handleShareEvent(selectedEvent)}
                      >
                        <Feather name="share-2" size={20} color="#1f2937" />
                      </TouchableOpacity>
                      {/* <TouchableOpacity className="bg-gray-100 px-6 py-4 rounded-xl items-center justify-center">
                        <Feather name="bookmark" size={20} color="#1f2937" />
                      </TouchableOpacity> */}
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#3b82f6',
  },
  categoryChipInactive: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  categoryTextInactive: {
    color: '#6b7280',
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  eventTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTypeText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  eventBody: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
  },
  eventDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
    lineHeight: 20,
  },
  eventOrganizer: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 12,
  },
  eventInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  feeLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 2,
  },
  feeAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
});

export default BrowseEvents;

