import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Feather } from "@expo/vector-icons";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { cameraWithTensors } from "@tensorflow/tfjs-react-native";

const TensorCamera = cameraWithTensors(CameraView);

const ObjectDetection = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [tfReady, setTfReady] = useState(false);
  const [model, setModel] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [facing, setFacing] = useState("back");
  
  const requestAnimationFrameId = useRef(null);
  const isDetectingRef = useRef(false);

  useEffect(() => {
    const initializeTensorFlow = async () => {
      try {
        // Wait for TensorFlow to be ready
        await tf.ready();
        setTfReady(true);
        console.log("✅ TensorFlow.js is ready");

        // Load COCO-SSD model
        const loadedModel = await cocoSsd.load();
        setModel(loadedModel);
        console.log("✅ COCO-SSD model loaded");
      } catch (error) {
        console.error("❌ Error initializing TensorFlow:", error);
        Alert.alert("Error", "Failed to initialize object detection model");
      }
    };

    initializeTensorFlow();

    return () => {
      if (requestAnimationFrameId.current) {
        cancelAnimationFrame(requestAnimationFrameId.current);
      }
    };
  }, []);

  const handleCameraStream = (images) => {
    if (!model) return;

    const loop = async () => {
      try {
        // Check if detection is still active
        if (!isDetectingRef.current) {
          return;
        }

        const nextImageTensor = images.next().value;
        
        if (nextImageTensor) {
          // Run object detection
          const detections = await model.detect(nextImageTensor);
          
          // Update predictions
          setPredictions(detections);

          // Cleanup
          tf.dispose(nextImageTensor);
        }

        // Schedule next frame only if still detecting
        if (isDetectingRef.current) {
          requestAnimationFrameId.current = requestAnimationFrame(loop);
        }
      } catch (error) {
        console.error("Detection error:", error);
      }
    };

    if (isDetectingRef.current) {
      loop();
    }
  };

  const toggleDetection = () => {
    const newDetectingState = !isDetecting;
    setIsDetecting(newDetectingState);
    isDetectingRef.current = newDetectingState;
    
    if (newDetectingState) {
      // Starting detection - clear previous predictions
      setPredictions([]);
    } else {
      // Stopping detection - cancel animation frame
      if (requestAnimationFrameId.current) {
        cancelAnimationFrame(requestAnimationFrameId.current);
        requestAnimationFrameId.current = null;
      }
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  if (!permission) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 justify-center items-center px-6">
          <Feather name="camera-off" size={64} color="#666" />
          <Text className="text-white text-xl font-semibold mt-6 mb-4">
            Camera Permission Required
          </Text>
          <Text className="text-gray-400 text-center mb-8">
            We need camera access to detect objects in real-time
          </Text>
          <TouchableOpacity
            onPress={requestPermission}
            className="bg-blue-600 px-8 py-4 rounded-2xl"
          >
            <Text className="text-white font-semibold text-base">
              Grant Permission
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mt-4"
          >
            <Text className="text-gray-500">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!tfReady || !model) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-white text-base mt-4">
            Loading AI Model...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">
        {/* Header */}
        <View className="absolute top-0 left-0 right-0 z-10 px-6 py-4 bg-black bg-opacity-70">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-xs text-gray-400 tracking-widest">
                AI VISION
              </Text>
              <Text className="text-2xl font-light text-white">
                Object Detection
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-full bg-zinc-900 justify-center items-center"
            >
              <Feather name="x" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Camera View */}
        <View className="flex-1">
          <TensorCamera
            style={styles.camera}
            facing={facing}
            onReady={handleCameraStream}
            autorender={true}
            resizeWidth={300}
            resizeHeight={400}
            resizeDepth={3}
            cameraTextureWidth={1920}
            cameraTextureHeight={1080}
          />

          {/* Detection Overlay */}
          <View style={styles.overlay}>
            {predictions.map((prediction, index) => (
              <View
                key={index}
                style={[
                  styles.boundingBox,
                  {
                    left: prediction.bbox[0],
                    top: prediction.bbox[1],
                    width: prediction.bbox[2],
                    height: prediction.bbox[3],
                  },
                ]}
              >
                <View style={styles.label}>
                  <Text style={styles.labelText}>
                    {prediction.class} ({Math.round(prediction.score * 100)}%)
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom Controls */}
        <View className="absolute bottom-0 left-0 right-0 z-10 px-6 py-8 bg-black bg-opacity-70">
          {/* Detection Info */}
          {isDetecting && predictions.length > 0 && (
            <View className="mb-4 bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
              <Text className="text-xs text-gray-500 mb-2">
                DETECTED OBJECTS
              </Text>
              {predictions.slice(0, 3).map((pred, idx) => (
                <Text key={idx} className="text-white text-sm mb-1">
                  • {pred.class} - {Math.round(pred.score * 100)}% confidence
                </Text>
              ))}
              {predictions.length > 3 && (
                <Text className="text-gray-500 text-xs mt-1">
                  +{predictions.length - 3} more objects
                </Text>
              )}
            </View>
          )}

          {/* Control Buttons */}
          <View className="flex-row justify-center items-center gap-4">
            <TouchableOpacity
              onPress={toggleCameraFacing}
              className="w-14 h-14 rounded-full bg-zinc-900 justify-center items-center border border-zinc-800"
            >
              <Feather name="rotate-cw" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleDetection}
              className={`w-20 h-20 rounded-full justify-center items-center ${
                isDetecting ? "bg-red-600" : "bg-blue-600"
              }`}
            >
              <Feather
                name={isDetecting ? "stop-circle" : "play-circle"}
                size={32}
                color="#fff"
              />
            </TouchableOpacity>

            <View className="w-14 h-14" />
          </View>

          {/* Status Text */}
          <Text className="text-center text-gray-500 text-xs mt-4">
            {isDetecting
              ? `Detecting... ${predictions.length} objects found`
              : "Tap play to start detection"}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  boundingBox: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#3b82f6",
    borderRadius: 8,
  },
  label: {
    position: "absolute",
    top: -24,
    left: 0,
    backgroundColor: "#3b82f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  labelText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default ObjectDetection;
