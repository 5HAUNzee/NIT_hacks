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
        className="bg-white rounded-2xl mb-4 overflow-hidden border border-gray-100"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        {/* Event Header with gradient */}
        <View className={`${colors.bg} px-4 py-3 flex-row justify-between items-center`}>
          <View className="flex-row items-center">
            <View className={`${colors.bg} p-2 rounded-lg`}>
              <Feather
                name={event.type === "Hackathon" ? "code" : event.type === "Workshop" ? "book-open" : event.type === "Conference" ? "users" : "award"}
                size={20}
                color={colors.dot}
              />
            </View>
            <View className="ml-3">
              <Text className={`text-xs font-semibold ${colors.text}`}>
                {event.type}
              </Text>
              <Text className="text-xs text-gray-500 mt-0.5">{event.organizer}</Text>
            </View>
          </View>
          <View
            className={`px-3 py-1 rounded-full ${
              event.status === "Open" ? "bg-green-500" : "bg-gray-400"
            }`}
          >
            <Text className="text-xs text-white font-semibold">
              {event.status}
            </Text>
          </View>
        </View>

        {/* Event Details */}
        <View className="px-4 py-4">
          <Text className="text-lg font-bold text-gray-900 mb-2">
            {event.title}
          </Text>
          <Text className="text-sm text-gray-600 mb-3" numberOfLines={2}>
            {event.description}
          </Text>

          {/* Tags */}
          <View className="flex-row flex-wrap gap-2 mb-3">
            {event.tags.map((tag, index) => (
              <View key={index} className="bg-gray-100 px-3 py-1 rounded-full">
                <Text className="text-xs text-gray-700">{tag}</Text>
              </View>
            ))}
          </View>

          {/* Event Info Grid */}
          <View className="border-t border-gray-100 pt-3">
            <View className="flex-row justify-between mb-2">
              <View className="flex-row items-center">
                <Feather name="calendar" size={14} color="#6b7280" />
                <Text className="text-xs text-gray-600 ml-2">{event.date}</Text>
              </View>
              <View className="flex-row items-center">
                <Feather name="clock" size={14} color="#6b7280" />
                <Text className="text-xs text-gray-600 ml-2">{event.time}</Text>
              </View>
            </View>
            <View className="flex-row justify-between">
              <View className="flex-row items-center flex-1">
                <Feather name="map-pin" size={14} color="#6b7280" />
                <Text className="text-xs text-gray-600 ml-2 flex-1" numberOfLines={1}>
                  {event.location}
                </Text>
              </View>
              <View className="flex-row items-center ml-4">
                <Feather name="users" size={14} color="#6b7280" />
                <Text className="text-xs text-gray-600 ml-2">
                  {event.participants}
                </Text>
              </View>
            </View>
            
            {/* Mini Map Preview */}
            {event.latitude && event.longitude && (
              <View className="mt-3" style={{ height: 120, borderRadius: 12, overflow: 'hidden' }}>
                <MapView
                  provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                  style={{ flex: 1 }}
                  initialRegion={{
                    latitude: event.latitude,
                    longitude: event.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                  pointerEvents="none"
                >
                  <Marker
                    coordinate={{
                      latitude: event.latitude,
                      longitude: event.longitude,
                    }}
                    pinColor={colors.dot}
                  />
                </MapView>
              </View>
            )}
          </View>

          {/* Registration Fee */}
          <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-100">
            <View>
              <Text className="text-xs text-gray-500">Registration Fee</Text>
              <Text className="text-base font-bold text-gray-900 mt-0.5">
                {event.registrationFee}
              </Text>
            </View>
            <TouchableOpacity className="bg-blue-600 px-6 py-2.5 rounded-xl">
              <Text className="text-white font-semibold text-sm">Register Now</Text>
            </TouchableOpacity>
          </View>
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="bg-white border-b border-gray-100 px-6 py-4"
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.name}
            onPress={() => setSelectedCategory(category.name)}
            className={`mr-3 px-4 py-2 rounded-xl flex-row items-center ${
              selectedCategory === category.name
                ? "bg-blue-600"
                : "bg-gray-100"
            }`}
          >
            <Feather
              name={category.icon}
              size={16}
              color={selectedCategory === category.name ? "#ffffff" : "#6b7280"}
            />
            <Text
              className={`ml-2 font-medium ${
                selectedCategory === category.name
                  ? "text-white"
                  : "text-gray-700"
              }`}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
              latitude: 22.2555,
              longitude: 84.9030,
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
                      <TouchableOpacity className="flex-1 bg-blue-600 py-4 rounded-xl items-center">
                        <Text className="text-white font-bold text-base">
                          Register Now
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity className="bg-gray-100 px-6 py-4 rounded-xl items-center justify-center">
                        <Feather name="share-2" size={20} color="#1f2937" />
                      </TouchableOpacity>
                      <TouchableOpacity className="bg-gray-100 px-6 py-4 rounded-xl items-center justify-center">
                        <Feather name="bookmark" size={20} color="#1f2937" />
                      </TouchableOpacity>
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
});

export default BrowseEvents;
