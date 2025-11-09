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
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Linking,
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
  const { communityId, communityName } = route.params || {};
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
  const [communityData, setCommunityData] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [communitySentimentSummary, setCommunitySentimentSummary] = useState("");
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [selectedPostForMenu, setSelectedPostForMenu] = useState(null);

  useEffect(() => {
    loadUserData();
    loadCommunityData();

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
      analyzeCommunitySentiment(communityPosts);
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

  const loadCommunityData = async () => {
    try {
      if (communityId && user) {
        const communityRef = doc(db, "communities", communityId);
        const communitySnap = await getDoc(communityRef);
        if (communitySnap.exists()) {
          const data = communitySnap.data();
          setCommunityData(data);
          setIsMember(data.members?.includes(user.id) || false);
        }
      }
    } catch (error) {
      console.error("Error loading community data:", error);
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

  const checkContentForModeration = async (text) => {
    // Replace with actual Gemini or external moderation API
    if (text.toLowerCase().includes("badword")) {
      return { allowed: false, reason: "Inappropriate language detected." };
    }
    return { allowed: true };
  };

  const analyzeCommunitySentiment = async (communityPosts) => {
    const combinedText = communityPosts.map((p) => p.content).join(" ");
    // TODO: Replace with actual Gemini sentiment summary API call
    setCommunitySentimentSummary(
      "This community promotes positive and respectful interactions."
    );
  };

  const createPost = async () => {
    if (!isMember) {
      Alert.alert(
        "Access Denied",
        "You must be a member of this community to create posts.",
        [
          { text: "Join Community", onPress: () => navigation.goBack() },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }

    if (!postContent.trim() && !postImageUrl) {
      Alert.alert("Error", "Please add some content or image to your post");
      return;
    }

    setSubmitting(true);
    try {
      if (postContent.trim()) {
        const modResult = await checkContentForModeration(postContent.trim());
        if (!modResult.allowed) {
          Alert.alert("Content blocked", modResult.reason || "Your post was blocked.");
          setSubmitting(false);
          return;
        }
      }

      const postData = {
        content: postContent.trim(),
        imageUrl: postImageUrl || null,
        authorId: user.id,
        authorName: `${userData?.firstName || ""} ${userData?.lastName || ""}`.trim() || "Anonymous",
        authorProfilePic: userData?.profilePic || null,
        communityId,
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
      const modResult = await checkContentForModeration(commentText.trim());
      if (!modResult.allowed) {
        Alert.alert("Content blocked", modResult.reason || "Your comment was blocked.");
        setSubmittingComment(false);
        return;
      }

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

  const shareOnWhatsApp = async (post) => {
    const message = `Community "${communityName}" post:\n${post.content || ""}\n— ${post.authorName || "Unknown"}`;
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) await Linking.openURL(url);
    else Alert.alert("Error", "WhatsApp is not installed");
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

  const renderPost = ({ item: post }) => {
    const isLiked = post.likes?.includes(user.id);
    const isAuthor = post.authorId === user.id;
    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.authorInfo}>
            {post.authorProfilePic ? (
              <Image source={{ uri: post.authorProfilePic }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {post.authorName?.charAt(0)?.toUpperCase() || "U"}
                </Text>
              </View>
            )}
            <View style={styles.authorDetails}>
              <Text style={styles.authorName}>{post.authorName || "Unknown User"}</Text>
              <Text style={styles.timestamp}>{formatTimestamp(post.createdAt)}</Text>
            </View>
          </View>
          {isAuthor && (
            <TouchableOpacity 
              onPress={() => {
                console.log('Delete button clicked in Community Feed!');
                openPostMenu(post);
              }} 
              style={{
                padding: 8,
                borderRadius: 8,
                backgroundColor: '#fee2e2',
              }}
              activeOpacity={0.7}
            >
              <Feather name="trash-2" size={18} color="#dc2626" />
            </TouchableOpacity>
          )}
        </View>
        {post.content && <Text style={styles.postContent}>{post.content}</Text>}
        {post.imageUrl && (
          <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
        )}
        {(post.likes?.length > 0 || post.comments?.length > 0) && (
          <View style={styles.statsRow}>
            {post.likes?.length > 0 && (
              <Text style={styles.statsText}>
                {post.likes.length} {post.likes.length === 1 ? "like" : "likes"}
              </Text>
            )}
            {post.comments?.length > 0 && (
              <Text style={styles.statsText}>
                {post.comments.length} {post.comments.length === 1 ? "comment" : "comments"}
              </Text>
            )}
          </View>
        )}
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            onPress={() => toggleLike(post.id, post.likes || [])} 
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <Feather 
              name={isLiked ? "heart" : "heart"} 
              size={22} 
              color={isLiked ? "#ef4444" : "#6b7280"} 
              fill={isLiked ? "#ef4444" : "transparent"}
            />
            <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>Like</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => openCommentModal(post)} 
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <Feather name="message-circle" size={22} color="#6b7280" />
            <Text style={styles.actionText}>Comment</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => shareOnWhatsApp(post)}
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <Feather name="share-2" size={22} color="#6b7280" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
        
        {/* Delete option for author - VISIBLE */}
        {isAuthor && (
          <TouchableOpacity 
            onPress={() => openPostMenu(post)}
            style={{ 
              paddingHorizontal: 16, 
              paddingVertical: 12,
              borderTopWidth: 1,
              borderTopColor: '#f3f4f6',
              backgroundColor: '#fee2e2',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.7}
          >
            <Feather name="trash-2" size={16} color="#dc2626" />
            <Text style={{ fontSize: 14, color: '#dc2626', fontWeight: '600', marginLeft: 8 }}>
              Delete Post
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const deletePost = async (postId, authorId) => {
    if (authorId !== user.id) {
      Alert.alert("Error", "You can only delete your own posts");
      return;
    }
    
    setShowPostMenu(false);
    setSelectedPostForMenu(null);

    Alert.alert(
      "Delete Post", 
      "Are you sure you want to delete this post? This action cannot be undone.", 
      [
        { 
          text: "Cancel", 
          style: "cancel",
          onPress: () => console.log("Delete cancelled")
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "posts", postId));
              Alert.alert("Success", "Post deleted successfully");
            } catch (error) {
              console.error("Error deleting post:", error);
              Alert.alert("Error", "Failed to delete post. Please try again.");
            }
          },
        },
      ]
    );
  };

  const openPostMenu = (post) => {
    setSelectedPostForMenu(post);
    setShowPostMenu(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{communityName || "Community Feed"}</Text>
          <Text style={styles.headerSubtitle}>{posts.length} {posts.length === 1 ? "post" : "posts"}</Text>
        </View>
        <TouchableOpacity style={styles.headerButton} onPress={() => setShowCreatePost(true)}>
          <Feather name="plus" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Community Sentiment Summary */}
      {communitySentimentSummary.length > 0 && (
        <View style={styles.sentimentSummary}>
          <Text style={styles.sentimentSummaryText}>{communitySentimentSummary}</Text>
        </View>
      )}

      {/* Posts List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="edit-3" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No posts yet</Text>
          <Text style={styles.emptySubtitle}>Be the first to share something!</Text>
          {isMember && (
            <TouchableOpacity
              onPress={() => setShowCreatePost(true)}
              style={styles.emptyButton}
            >
              <Feather name="plus" size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Create Post</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          renderItem={renderPost}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} tintColor="#3b82f6" />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create Post Modal */}
      <Modal visible={showCreatePost} animationType="slide" onRequestClose={() => setShowCreatePost(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreatePost(false)} style={styles.modalCloseButton}>
              <Feather name="x" size={24} color="#1f2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Post</Text>
            <TouchableOpacity 
              onPress={createPost} 
              disabled={submitting || uploadingImage || (!postContent.trim() && !postImageUrl)}
              style={[
                styles.modalPostButton,
                (submitting || uploadingImage || (!postContent.trim() && !postImageUrl)) && styles.modalPostButtonDisabled,
              ]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalPostButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.modalAuthorInfo}>
            {userData?.profilePic ? (
              <Image source={{ uri: userData.profilePic }} style={styles.modalAvatar} />
            ) : (
              <View style={styles.modalAvatarPlaceholder}>
                <Text style={styles.avatarText}>{userData?.firstName?.charAt(0)?.toUpperCase() || "U"}</Text>
              </View>
            )}
            <Text style={styles.modalAuthorName}>{`${userData?.firstName || ""} ${userData?.lastName || ""}`.trim() || "You"}</Text>
          </View>
          <TextInput
            placeholder="What's on your mind?"
            placeholderTextColor="#9ca3af"
            multiline
            value={postContent}
            onChangeText={setPostContent}
            style={styles.modalTextInput}
            autoFocus
          />

          {/* Image Preview */}
          {postImage && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: postImage }} style={styles.imagePreview} />
              {uploadingImage && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.uploadingText}>Uploading...</Text>
                </View>
              )}
              <TouchableOpacity onPress={() => { setPostImage(null); setPostImageUrl(null); }} style={styles.removeImageButton}>
                <Feather name="x" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.modalActions}>
            <TouchableOpacity onPress={pickImage} style={styles.modalActionButton} disabled={uploadingImage}>
              <Feather name="image" size={24} color="#10b981" />
              <Text style={styles.modalActionText}>{postImage ? "Change Photo" : "Add Photo"}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Comment Modal */}
      <Modal visible={commentModalVisible} animationType="slide" onRequestClose={() => setCommentModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setCommentModalVisible(false)} style={styles.modalCloseButton}>
              <Feather name="arrow-left" size={24} color="#1f2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Comments ({selectedPost?.comments?.length || 0})</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView style={styles.commentsContainer}>
            {selectedPost?.comments && selectedPost.comments.length > 0 ? (
              selectedPost.comments.map((comment, idx) => (
                <View key={idx} style={styles.commentItem}>
                  {comment.authorPic ? (
                    <Image source={{ uri: comment.authorPic }} style={styles.commentAvatar} />
                  ) : (
                    <View style={styles.commentAvatarPlaceholder}>
                      <Text style={styles.commentAvatarText}>{comment.authorName?.charAt(0)?.toUpperCase() || "U"}</Text>
                    </View>
                  )}
                  <View style={styles.commentContent}>
                    <View style={styles.commentBubble}>
                      <Text style={styles.commentAuthor}>{comment.authorName}</Text>
                      <Text style={styles.commentText}>{comment.text}</Text>
                    </View>
                    <Text style={styles.commentTimestamp}>{formatTimestamp(comment.createdAt)}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.noCommentsContainer}>
                <Feather name="message-circle" size={48} color="#d1d5db" />
                <Text style={styles.noCommentsText}>No comments yet</Text>
                <Text style={styles.noCommentsSubtext}>Be the first to comment!</Text>
              </View>
            )}
          </ScrollView>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}>
            <View style={styles.commentInputContainer}>
              {userData?.profilePic ? (
                <Image source={{ uri: userData.profilePic }} style={styles.commentInputAvatar} />
              ) : (
                <View style={styles.commentInputAvatarPlaceholder}>
                  <Text style={styles.avatarText}>{userData?.firstName?.charAt(0)?.toUpperCase() || "U"}</Text>
                </View>
              )}
              <TextInput
                placeholder="Write a comment..."
                placeholderTextColor="#9ca3af"
                value={commentText}
                onChangeText={setCommentText}
                style={styles.commentInput}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                onPress={addComment}
                disabled={submittingComment || !commentText.trim()}
                style={[styles.commentSendButton, (!commentText.trim() || submittingComment) && styles.commentSendButtonDisabled]}
              >
                {submittingComment ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Feather name="send" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Post Menu Modal */}
      <Modal
        visible={showPostMenu}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowPostMenu(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowPostMenu(false)}
          style={styles.menuModalOverlay}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.menuModalContent}
          >
            {/* Menu Header */}
            <View style={styles.menuModalHeader}>
              <View style={styles.menuModalHandle} />
            </View>

            {/* Menu Options */}
            <View style={styles.menuModalOptions}>
              <TouchableOpacity
                onPress={() => {
                  if (selectedPostForMenu) {
                    deletePost(selectedPostForMenu.id, selectedPostForMenu.authorId);
                  }
                }}
                style={styles.menuModalOption}
                activeOpacity={0.7}
              >
                <View style={styles.menuModalOptionIconContainer}>
                  <Feather name="trash-2" size={20} color="#ef4444" />
                </View>
                <View style={styles.menuModalOptionTextContainer}>
                  <Text style={styles.menuModalOptionTitle}>Delete Post</Text>
                  <Text style={styles.menuModalOptionSubtitle}>
                    This action cannot be undone
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.menuModalDivider} />

              <TouchableOpacity
                onPress={() => setShowPostMenu(false)}
                style={styles.menuModalOption}
                activeOpacity={0.7}
              >
                <View style={[styles.menuModalOptionIconContainer, { backgroundColor: '#f3f4f6' }]}>
                  <Feather name="x" size={20} color="#6b7280" />
                </View>
                <View style={styles.menuModalOptionTextContainer}>
                  <Text style={[styles.menuModalOptionTitle, { color: '#1f2937' }]}>
                    Cancel
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  backButton: { padding: 4 },
  headerCenter: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#1f2937" },
  headerSubtitle: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  headerButton: { padding: 4 },
  sentimentSummary: { backgroundColor: "#e0f2fe", padding: 12, marginHorizontal: 16, marginVertical: 8, borderRadius: 8 },
  sentimentSummaryText: { color: "#0369a1", fontWeight: "600", fontSize: 14, textAlign: "center" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#6b7280" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: "bold", color: "#1f2937", marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: "#6b7280", marginTop: 8, textAlign: "center" },
  emptyButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#3b82f6", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 24 },
  emptyButtonText: { color: "#fff", fontSize: 16, fontWeight: "600", marginLeft: 8 },
  listContainer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 },
  postCard: { backgroundColor: "#fff", borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#e5e7eb" },
  postHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  authorInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#3b82f6", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  authorDetails: { marginLeft: 12, flex: 1 },
  authorName: { fontWeight: "600", fontSize: 16, color: "#1f2937" },
  timestamp: { color: "#6b7280", fontSize: 13, marginTop: 2 },
  deleteButton: { padding: 8 },
  postContent: { paddingHorizontal: 16, fontSize: 15, color: "#1f2937", lineHeight: 22, marginBottom: 12 },
  postImage: { width: "100%", height: 300, backgroundColor: "#f3f4f6" },
  statsRow: { flexDirection: "row", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 16 },
  statsText: { fontSize: 13, color: "#6b7280" },
  actionsRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#f3f4f6", paddingVertical: 4 },
  actionButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12 },
  actionText: { marginLeft: 8, fontSize: 14, color: "#6b7280", fontWeight: "500" },
  actionTextActive: { color: "#ef4444" },
  modalContainer: { flex: 1, backgroundColor: "#fff" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  modalCloseButton: { padding: 4 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#1f2937" },
  modalPostButton: { backgroundColor: "#3b82f6", paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  modalPostButtonDisabled: { backgroundColor: "#d1d5db" },
  modalPostButtonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  modalAuthorInfo: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  modalAvatar: { width: 40, height: 40, borderRadius: 20 },
  modalAvatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#3b82f6", justifyContent: "center", alignItems: "center" },
  modalAuthorName: { marginLeft: 12, fontSize: 16, fontWeight: "600", color: "#1f2937" },
  modalTextInput: { flex: 1, fontSize: 16, color: "#1f2937", paddingHorizontal: 16, paddingTop: 16, textAlignVertical: "top" },
  imagePreviewContainer: { marginHorizontal: 16, marginBottom: 16, borderRadius: 12, overflow: "hidden" },
  imagePreview: { width: "100%", height: 250, backgroundColor: "#f3f4f6" },
  uploadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  uploadingText: { color: "#fff", marginTop: 12, fontSize: 16, fontWeight: "500" },
  removeImageButton: { position: "absolute", top: 12, right: 12, backgroundColor: "rgba(0,0,0,0.6)", width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  modalActions: { padding: 16, borderTopWidth: 1, borderTopColor: "#e5e7eb" },
  modalActionButton: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  modalActionText: { marginLeft: 12, fontSize: 16, color: "#1f2937", fontWeight: "500" },
  commentsContainer: { flex: 1, backgroundColor: "#f9fafb" },
  commentItem: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff" },
  commentAvatar: { width: 36, height: 36, borderRadius: 18 },
  commentAvatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#3b82f6", justifyContent: "center", alignItems: "center" },
  commentAvatarText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  commentContent: { flex: 1, marginLeft: 12 },
  commentBubble: { backgroundColor: "#f3f4f6", borderRadius: 16, padding: 12 },
  commentAuthor: { fontWeight: "600", fontSize: 14, color: "#1f2937", marginBottom: 4 },
  commentText: { fontSize: 14, color: "#374151", lineHeight: 20 },
  commentTimestamp: { fontSize: 12, color: "#9ca3af", marginTop: 4, marginLeft: 12 },
  noCommentsContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 64 },
  noCommentsText: { fontSize: 18, fontWeight: "600", color: "#1f2937", marginTop: 16 },
  noCommentsSubtext: { fontSize: 14, color: "#6b7280", marginTop: 8 },
  commentInputContainer: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e5e7eb" },
  commentInputAvatar: { width: 36, height: 36, borderRadius: 18 },
  commentInputAvatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#3b82f6", justifyContent: "center", alignItems: "center" },
  commentInput: { flex: 1, marginLeft: 12, marginRight: 12, backgroundColor: "#f3f4f6", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: "#1f2937", maxHeight: 100 },
  commentSendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#3b82f6", justifyContent: "center", alignItems: "center" },
  commentSendButtonDisabled: { backgroundColor: "#d1d5db" },
  menuModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  menuModalContent: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  menuModalHeader: { alignItems: "center", paddingTop: 12, paddingBottom: 8 },
  menuModalHandle: { width: 40, height: 4, backgroundColor: "#d1d5db", borderRadius: 2 },
  menuModalOptions: { paddingBottom: 24 },
  menuModalOption: { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 16 },
  menuModalOptionIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fee2e2", justifyContent: "center", alignItems: "center" },
  menuModalOptionTextContainer: { marginLeft: 16, flex: 1 },
  menuModalOptionTitle: { fontSize: 16, fontWeight: "600", color: "#ef4444" },
  menuModalOptionSubtitle: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  menuModalDivider: { height: 1, backgroundColor: "#f3f4f6", marginHorizontal: 24 },
});

export default CommunityFeed;
