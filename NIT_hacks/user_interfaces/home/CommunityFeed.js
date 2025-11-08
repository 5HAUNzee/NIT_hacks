import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import * as ImagePicker from "expo-image-picker";
import { uploadImageToCloudinary } from "../../services/cloudinaryService";

const CommunityFeed = ({ route, navigation }) => {
  const { communityId, communityName } = route.params;
  const { user } = useUser();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState(null);
  const [postImageUrl, setPostImageUrl] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userData, setUserData] = useState(null);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    loadUserData();

    const postsRef = collection(db, "posts");
    const q = query(postsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const communityPosts = [];
      snapshot.forEach((docSnap) => {
        const post = docSnap.data();
        if (post.communityId === communityId) {
          communityPosts.push({ id: docSnap.id, ...post });
        }
      });
      setPosts(communityPosts);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, [communityId, user]);

  const loadUserData = async () => {
    try {
      if (user && db) {
        const userRef = doc(db, "users", user.id);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        const localUri = result.assets[0].uri;
        setPostImage(localUri);

        setUploadingImage(true);
        const uploadedUrl = await uploadImageToCloudinary(localUri);
        setPostImageUrl(uploadedUrl);
        setUploadingImage(false);
      }
    } catch (error) {
      setUploadingImage(false);
      Alert.alert("Error", "Failed to upload image");
      console.error(error);
    }
  };

  const createPost = async () => {
    if (!postContent.trim() && !postImageUrl) {
      Alert.alert("Error", "Please add some content or image to your post");
      return;
    }

    setSubmitting(true);
    try {
      const postData = {
        content: postContent.trim(),
        imageUrl: postImageUrl || null,
        authorId: user.id,
        communityId: communityId,
        likes: [],
        comments: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await addDoc(collection(db, "posts"), postData);

      setPostContent("");
      setPostImage(null);
      setPostImageUrl(null);
      setShowCreatePost(false);
      Alert.alert("Success", "Post created successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to create post");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async (postId, currentLikes) => {
    try {
      const postRef = doc(db, "posts", postId);
      const hasLiked = currentLikes.includes(user.id);

      if (hasLiked) {
        await updateDoc(postRef, { likes: arrayRemove(user.id) });
      } else {
        await updateDoc(postRef, { likes: arrayUnion(user.id) });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update like");
      console.error(error);
    }
  };

  const openCommentModal = (post) => {
    setSelectedPost(post);
    setCommentModalVisible(true);
  };

  const addComment = async () => {
    if (!commentText.trim()) {
      Alert.alert("Error", "Please enter a comment");
      return;
    }

    setSubmittingComment(true);
    try {
      const comment = {
        text: commentText.trim(),
        authorId: user.id,
        authorName: `${userData?.firstName} ${userData?.lastName}`,
        authorPic: userData?.profilePic || null,
        createdAt: Timestamp.now(),
      };

      const postRef = doc(db, "posts", selectedPost.id);
      await updateDoc(postRef, { comments: arrayUnion(comment) });

      setCommentText("");
      setCommentModalVisible(false);
      Alert.alert("Success", "Comment added!");
    } catch (error) {
      Alert.alert("Error", "Failed to add comment");
      console.error(error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
  };

  const renderPost = (post) => {
    const isLiked = post.likes?.includes(user.id);
    const isAuthor = post.authorId === user.id;

    return (
      <View key={post.id} style={{ backgroundColor: "white", marginBottom: 12, borderRadius: 10, padding: 12, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5 }}>
        {/* Post Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            {post.author?.profilePic ? (
              <Image source={{ uri: post.author.profilePic }} style={{ width: 40, height: 40, borderRadius: 20 }} />
            ) : (
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#3b82f6", justifyContent: "center", alignItems: "center" }}>
                <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}>
                  {post.author?.firstName?.charAt(0)}
                  {post.author?.lastName?.charAt(0)}
                </Text>
              </View>
            )}
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ fontWeight: "bold", fontSize: 16 }}>{post.author?.firstName} {post.author?.lastName}</Text>
              <Text style={{ color: "#666", fontSize: 12 }}>{formatTimestamp(post.createdAt)}</Text>
            </View>
          </View>
          {isAuthor && (
            <TouchableOpacity onPress={() => deletePost(post.id, post.authorId)} style={{ padding: 8 }}>
              <Feather name="trash-2" size={20} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        <Text style={{ marginTop: 10, fontSize: 14, color: "#333" }}>{post.content}</Text>

        {/* Post Image */}
        {post.imageUrl && (
          <Image source={{ uri: post.imageUrl }} style={{ marginTop: 10, height: 200, borderRadius: 10 }} resizeMode="cover" />
        )}

        {/* Post Actions */}
        <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 12 }}>
          <TouchableOpacity onPress={() => toggleLike(post.id, post.likes || [])} style={{ flexDirection: "row", alignItems: "center" }}>
            <Feather name="heart" size={20} color={isLiked ? "#ef4444" : "#666"} />
            <Text style={{ marginLeft: 6, color: isLiked ? "#ef4444" : "#666" }}>{post.likes?.length || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openCommentModal(post)} style={{ flexDirection: "row", alignItems: "center" }}>
            <Feather name="message-circle" size={20} color="#666" />
            <Text style={{ marginLeft: 6, color: "#666" }}>{post.comments?.length || 0}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const deletePost = async (postId, authorId) => {
    if (authorId !== user.id) {
      Alert.alert("Error", "You can only delete your own posts");
      return;
    }
    Alert.alert("Delete Post", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "posts", postId));
            Alert.alert("Deleted", "Post successfully deleted");
          } catch (error) {
            Alert.alert("Error", "Failed to delete post");
            console.error(error);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f0f2f5" }}>
      {/* Header */}
      <View style={{ padding: 16, backgroundColor: "#fff", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "bold" }}>{communityName || "Community Feed"}</Text>
        <View style={{ width: 24 }} /> {/* Placeholder for alignment */}
      </View>

      {/* Create Post Button */}
      <TouchableOpacity
        onPress={() => setShowCreatePost(true)}
        style={{ margin: 16, backgroundColor: "#3b82f6", padding: 12, borderRadius: 8, alignItems: "center" }}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Create Post</Text>
      </TouchableOpacity>

      {/* Posts */}
      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ flex: 1, justifyContent: "center", alignItems: "center" }} />
      ) : posts.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 16, color: "#666" }}>No posts yet.</Text>
        </View>
      ) : (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} />}>
          {posts.map(renderPost)}
        </ScrollView>
      )}

      {/* Create Post Modal */}
      <Modal visible={showCreatePost} animationType="slide" onRequestClose={() => setShowCreatePost(false)}>
        <SafeAreaView style={{ flex: 1, padding: 16, backgroundColor: "#fff" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
            <TouchableOpacity onPress={() => setShowCreatePost(false)}>
              <Feather name="x" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={{ fontWeight: "bold", fontSize: 18 }}>Create Post</Text>
            <TouchableOpacity onPress={createPost} disabled={submitting || uploadingImage}>
              <Text style={{ color: submitting || uploadingImage ? "#999" : "#3b82f6", fontWeight: "bold" }}>
                {submitting ? "Posting..." : "Post"}
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            placeholder="What's on your mind?"
            multiline
            value={postContent}
            onChangeText={setPostContent}
            style={{ flex: 1, textAlignVertical: "top", borderColor: "#ccc", borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 }}
          />
          {postImage && (
            <View style={{ marginBottom: 12 }}>
              <Image source={{ uri: postImage }} style={{ width: "100%", height: 200, borderRadius: 8 }} />
              {uploadingImage && <ActivityIndicator size="large" color="#3b82f6" style={{ position: "absolute", top: "50%", left: "50%" }} />}
              <TouchableOpacity onPress={() => { setPostImage(null); setPostImageUrl(null); }} style={{ position: "absolute", top: 8, right: 8 }}>
                <Feather name="x" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity onPress={pickImage} style={{ padding: 12, backgroundColor: "#e0e7ff", borderRadius: 8, alignItems: "center" }}>
            <Text style={{ color: "#3b82f6" }}>{postImage ? "Change Image" : "Add Image"}</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

      {/* Comment Modal */}
      <Modal visible={commentModalVisible} animationType="slide" onRequestClose={() => setCommentModalVisible(false)}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 16, borderBottomColor: "#ccc", borderBottomWidth: 1 }}>
            <TouchableOpacity onPress={() => setCommentModalVisible(false)}>
              <Feather name="x" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={{ fontWeight: "bold", fontSize: 18 }}>Comments</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView style={{ flex: 1, padding: 16 }}>
            {selectedPost?.comments?.map((comment, idx) => (
              <View key={idx} style={{ flexDirection: "row", marginBottom: 12 }}>
                {comment.authorPic ? (
                  <Image source={{ uri: comment.authorPic }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                ) : (
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#3b82f6", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: "white", fontWeight: "bold" }}>{comment.authorName[0]}</Text>
                  </View>
                )}
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={{ fontWeight: "bold" }}>{comment.authorName}</Text>
                  <Text>{comment.text}</Text>
                  <Text style={{ fontSize: 12, color: "#666" }}>{formatTimestamp(comment.createdAt)}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={{ flexDirection: "row", padding: 16, borderTopColor: "#ccc", borderTopWidth: 1, alignItems: "center" }}>
            {userData?.profilePic ? (
              <Image source={{ uri: userData.profilePic }} style={{ width: 40, height: 40, borderRadius: 20 }} />
            ) : (
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#3b82f6", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "white", fontWeight: "bold" }}>{userData?.firstName?.charAt(0)}</Text>
              </View>
            )}
            <TextInput
              placeholder="Add a comment"
              value={commentText}
              onChangeText={setCommentText}
              style={{
                flex: 1,
                marginLeft: 12,
                borderColor: "#ccc",
                borderWidth: 1,
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            />
            <TouchableOpacity
              onPress={addComment}
              disabled={submittingComment}
              style={{ marginLeft: 12 }}
            >
              {submittingComment ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                <Feather name="send" size={24} color="#3b82f6" />
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default CommunityFeed;
