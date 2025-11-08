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
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import {
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import * as ImagePicker from "expo-image-picker";
import { uploadImageToCloudinary } from "../../services/cloudinaryService";
import { fetchGithubProfile } from "../../services/githubService";

const Feed = ({ navigation }) => {
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
    loadPosts();
  }, [user]);

  const loadUserData = async () => {
    try {
      if (user && db) {
        const userRef = doc(db, "users", user.id);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          let userData = userSnap.data();
          
          // If user has GitHub link, fetch GitHub avatar
          if (userData?.githubLink && !userData.profilePic) {
            try {
              const githubProfile = await fetchGithubProfile(userData.githubLink);
              if (githubProfile?.avatar) {
                userData = { ...userData, githubAvatar: githubProfile.avatar };
              }
            } catch (error) {
              console.error("Error fetching GitHub avatar:", error);
            }
          }
          
          setUserData(userData);
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      const postsRef = collection(db, "posts");
      const q = query(postsRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const postsData = [];
      for (const docSnap of querySnapshot.docs) {
        const postData = docSnap.data();
        
        // Fetch author data
        const authorRef = doc(db, "users", postData.authorId);
        const authorSnap = await getDoc(authorRef);
        let authorData = authorSnap.exists() ? authorSnap.data() : null;

        // If author has GitHub link, fetch GitHub avatar
        if (authorData?.githubLink && !authorData.profilePic) {
          try {
            const githubProfile = await fetchGithubProfile(authorData.githubLink);
            if (githubProfile?.avatar) {
              authorData = { ...authorData, githubAvatar: githubProfile.avatar };
            }
          } catch (error) {
            console.error("Error fetching GitHub avatar:", error);
          }
        }

        postsData.push({
          id: docSnap.id,
          ...postData,
          author: authorData,
        });
      }

      setPosts(postsData);
    } catch (error) {
      console.error("Error loading posts:", error);
      Alert.alert("Error", "Failed to load posts");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPosts();
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
        const cloudinaryUrl = await uploadImageToCloudinary(localUri);
        setPostImageUrl(cloudinaryUrl);
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

    try {
      setSubmitting(true);

      const postData = {
        content: postContent.trim(),
        imageUrl: postImageUrl || null,
        authorId: user.id,
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
      loadPosts();
    } catch (error) {
      console.error("Error creating post:", error);
      Alert.alert("Error", "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async (postId, currentLikes) => {
    try {
      const postRef = doc(db, "posts", postId);
      const hasLiked = currentLikes.includes(user.id);

      if (hasLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(user.id),
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(user.id),
        });
      }

      // Update local state
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes: hasLiked
                  ? post.likes.filter((id) => id !== user.id)
                  : [...post.likes, user.id],
              }
            : post
        )
      );
    } catch (error) {
      console.error("Error toggling like:", error);
      Alert.alert("Error", "Failed to update like");
    }
  };

  const openCommentModal = (post) => {
    setSelectedPost(post);
    setCommentModalVisible(true);
  };

  const sharePost = async (post) => {
    try {
      const shareMessage = `Check out this post by ${post.author?.firstName} ${post.author?.lastName}!\n\n${post.content || 'See attached image'}\n\n${post.imageUrl ? `Image: ${post.imageUrl}` : ''}`;
      
      const result = await Share.share({
        message: shareMessage,
        title: `Post from ${post.author?.firstName} ${post.author?.lastName}`,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Shared with activity type of result.activityType
          console.log('Shared with activity type:', result.activityType);
        } else {
          // Shared
          console.log('Post shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error sharing post:', error);
      Alert.alert('Error', 'Failed to share post');
    }
  };

  const addComment = async () => {
    if (!commentText.trim()) {
      Alert.alert("Error", "Please enter a comment");
      return;
    }

    try {
      setSubmittingComment(true);

      const comment = {
        text: commentText.trim(),
        authorId: user.id,
        authorName: `${userData?.firstName} ${userData?.lastName}`,
        authorPic: userData?.profilePic || null,
        createdAt: Timestamp.now(),
      };

      const postRef = doc(db, "posts", selectedPost.id);
      await updateDoc(postRef, {
        comments: arrayUnion(comment),
      });

      setCommentText("");
      setCommentModalVisible(false);
      Alert.alert("Success", "Comment added!");
      loadPosts();
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Error", "Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const deletePost = async (postId, authorId) => {
    if (authorId !== user.id) {
      Alert.alert("Error", "You can only delete your own posts");
      return;
    }

    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "posts", postId));
            Alert.alert("Success", "Post deleted successfully");
            loadPosts();
          } catch (error) {
            console.error("Error deleting post:", error);
            Alert.alert("Error", "Failed to delete post");
          }
        },
      },
    ]);
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
    
    // Determine avatar source: profilePic > githubAvatar > initials
    const avatarSource = post.author?.profilePic || post.author?.githubAvatar;

    return (
      <View key={post.id} className="bg-white mb-3 pb-2">
        {/* Post Header */}
        <View className="flex-row items-center justify-between px-4 pt-3 pb-2">
          <TouchableOpacity 
            className="flex-row items-center flex-1"
            onPress={() => {
              if (post.authorId !== user?.id) {
                navigation.navigate("Profile", { userId: post.authorId });
              }
            }}
            activeOpacity={0.7}
          >
            {avatarSource ? (
              <Image
                source={{ uri: avatarSource }}
                className="w-10 h-10 rounded-full"
                style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}
              />
            ) : (
              <View 
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: '#3b82f6' }}
              >
                <Text className="text-base font-bold text-white">
                  {post.author?.firstName?.charAt(0)}
                  {post.author?.lastName?.charAt(0)}
                </Text>
              </View>
            )}
            <View className="ml-3 flex-1">
              <Text className="text-sm font-semibold text-gray-900">
                {post.author?.firstName} {post.author?.lastName}
              </Text>
              <Text className="text-xs text-gray-500">
                {formatTimestamp(post.createdAt)}
              </Text>
            </View>
          </TouchableOpacity>
          
          {isAuthor && (
            <TouchableOpacity
              onPress={() => deletePost(post.id, post.authorId)}
              className="p-1.5"
            >
              <Feather name="more-horizontal" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Post Content */}
        {post.content && (
          <View className="px-4 pb-3">
            <Text className="text-[15px] text-gray-900 leading-5">
              {post.content}
            </Text>
          </View>
        )}

        {/* Post Image with padding */}
        {post.imageUrl && (
          <View className="px-4 pb-3">
            <Image
              source={{ uri: post.imageUrl }}
              className="w-full rounded-xl"
              style={{ aspectRatio: 4 / 3 }}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Action Buttons */}
        <View className="flex-row items-center px-3 pb-1">
          <TouchableOpacity
            onPress={() => toggleLike(post.id, post.likes || [])}
            className="py-2 pr-4"
            activeOpacity={0.7}
          >
            <Feather
              name="heart"
              size={26}
              color={isLiked ? "#ef4444" : "#1f2937"}
              fill={isLiked ? "#ef4444" : "none"}
              strokeWidth={2}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => openCommentModal(post)}
            className="py-2 pr-4"
            activeOpacity={0.7}
          >
            <Feather name="message-circle" size={26} color="#1f2937" strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => sharePost(post)}
            className="py-2 pr-4"
            activeOpacity={0.7}
          >
            <Feather name="send" size={24} color="#1f2937" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Likes and Caption Section */}
        <View className="px-4 pb-3">
          {/* Like count */}
          {(post.likes?.length || 0) > 0 && (
            <Text className="text-sm font-semibold text-gray-900 mb-2">
              {post.likes?.length} {post.likes?.length === 1 ? "like" : "likes"}
            </Text>
          )}
          
          {/* Author + Caption (Instagram style) */}
          {post.content && (
            <View className="flex-row">
              <TouchableOpacity
                onPress={() => {
                  if (post.authorId !== user?.id) {
                    navigation.navigate("Profile", { userId: post.authorId });
                  }
                }}
                activeOpacity={0.7}
              >
                <Text className="text-sm font-semibold text-gray-900 mr-2">
                  {post.author?.firstName} {post.author?.lastName}
                </Text>
              </TouchableOpacity>
              <Text className="text-sm text-gray-900 flex-1" numberOfLines={2}>
                {post.content}
              </Text>
            </View>
          )}
          
          {/* View comments */}
          {(post.comments?.length || 0) > 0 && (
            <TouchableOpacity onPress={() => openCommentModal(post)} className="mt-1">
              <Text className="text-sm text-gray-500">
                View all {post.comments?.length} {post.comments?.length === 1 ? "comment" : "comments"}
              </Text>
            </TouchableOpacity>
          )}
          
          {/* Timestamp */}
          <Text className="text-xs text-gray-400 mt-1 uppercase">
            {formatTimestamp(post.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-100 px-4 py-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
              <Feather name="arrow-left" size={24} color="#1f2937" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900">Feed</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
            {userData?.profilePic || userData?.githubAvatar ? (
              <Image
                source={{ uri: userData.profilePic || userData.githubAvatar }}
                className="w-9 h-9 rounded-full"
                style={{ borderWidth: 1, borderColor: '#e5e7eb' }}
              />
            ) : (
              <View 
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{ backgroundColor: '#3b82f6' }}
              >
                <Text className="text-sm font-bold text-white">
                  {userData?.firstName?.charAt(0)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Create Post Button */}
      <TouchableOpacity
        onPress={() => setShowCreatePost(true)}
        className="bg-white px-4 py-3 flex-row items-center mb-2"
        activeOpacity={0.7}
      >
        {userData?.profilePic || userData?.githubAvatar ? (
          <Image
            source={{ uri: userData.profilePic || userData.githubAvatar }}
            className="w-10 h-10 rounded-full"
            style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}
          />
        ) : (
          <View 
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: '#3b82f6' }}
          >
            <Text className="text-base font-bold text-white">
              {userData?.firstName?.charAt(0)}
            </Text>
          </View>
        )}
        <View className="ml-3 flex-1 bg-gray-100 rounded-full px-4 py-2.5">
          <Text className="text-gray-500 text-sm">What's on your mind?</Text>
        </View>
        <Feather name="image" size={22} color="#3b82f6" className="ml-3" />
      </TouchableOpacity>

      {/* Posts List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-500 mt-4">Loading feed...</Text>
        </View>
      ) : posts.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Feather name="message-square" size={64} color="#d1d5db" />
          <Text className="text-xl font-semibold text-gray-900 mt-4">
            No posts yet
          </Text>
          <Text className="text-gray-500 text-center mt-2">
            Be the first to share something with the community!
          </Text>
          <TouchableOpacity
            onPress={() => setShowCreatePost(true)}
            className="mt-6 bg-blue-600 px-6 py-3 rounded-full"
          >
            <Text className="text-white font-semibold">Create First Post</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {posts.map(renderPost)}
        </ScrollView>
      )}

      {/* Create Post Modal */}
      <Modal
        visible={showCreatePost}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowCreatePost(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          {/* Modal Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
            <TouchableOpacity onPress={() => setShowCreatePost(false)}>
              <Feather name="x" size={24} color="#1f2937" />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900">
              Create Post
            </Text>
            <TouchableOpacity
              onPress={createPost}
              disabled={submitting || uploadingImage}
              className={`${
                submitting || uploadingImage ? "opacity-50" : ""
              }`}
            >
              <Text className="text-blue-600 font-semibold text-base">
                {submitting ? "Posting..." : "Post"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-4 py-4">
            {/* User Info */}
            <View className="flex-row items-center mb-4">
              {userData?.profilePic || userData?.githubAvatar ? (
                <Image
                  source={{ uri: userData.profilePic || userData.githubAvatar }}
                  className="w-12 h-12 rounded-full"
                  style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}
                />
              ) : (
                <View 
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: '#3b82f6' }}
                >
                  <Text className="text-lg font-bold text-blue-600">
                    {userData?.firstName?.charAt(0)}
                  </Text>
                </View>
              )}
              <View className="ml-3">
                <Text className="text-base font-semibold text-gray-900">
                  {userData?.firstName} {userData?.lastName}
                </Text>
                <Text className="text-xs text-gray-500">
                  {userData?.major || "Student"}
                </Text>
              </View>
            </View>

            {/* Post Content Input */}
            <TextInput
              placeholder="What do you want to share?"
              placeholderTextColor="#9ca3af"
              value={postContent}
              onChangeText={setPostContent}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              className="text-base text-gray-900 mb-4"
              style={{ minHeight: 150 }}
            />

            {/* Image Preview */}
            {postImage && (
              <View className="mb-4 relative">
                <Image
                  source={{ uri: postImage }}
                  className="w-full h-64 rounded-lg"
                  resizeMode="cover"
                />
                {uploadingImage && (
                  <View className="absolute inset-0 bg-black/50 rounded-lg items-center justify-center">
                    <ActivityIndicator size="large" color="#fff" />
                    <Text className="text-white mt-2">Uploading...</Text>
                  </View>
                )}
                <TouchableOpacity
                  onPress={() => {
                    setPostImage(null);
                    setPostImageUrl(null);
                  }}
                  className="absolute top-2 right-2 bg-black/50 rounded-full p-2"
                >
                  <Feather name="x" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {/* Add Image Button */}
            <TouchableOpacity
              onPress={pickImage}
              disabled={uploadingImage}
              className="flex-row items-center bg-gray-100 rounded-lg p-4"
            >
              <Feather name="image" size={24} color="#3b82f6" />
              <Text className="ml-3 text-blue-600 font-medium">
                {postImage ? "Change Image" : "Add Image"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Comment Modal */}
      <Modal
        visible={commentModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          {/* Modal Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
            <TouchableOpacity onPress={() => setCommentModalVisible(false)}>
              <Feather name="arrow-left" size={24} color="#1f2937" />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900">
              Comments
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView className="flex-1">
            {selectedPost?.comments?.map((comment, index) => (
              <View key={index} className="flex-row px-4 py-3 border-b border-gray-100">
                <TouchableOpacity
                  onPress={() => {
                    if (comment.authorId && comment.authorId !== user?.id) {
                      setShowCommentsModal(false);
                      navigation.navigate("Profile", { userId: comment.authorId });
                    }
                  }}
                  activeOpacity={0.7}
                  className="flex-row flex-1"
                >
                  {comment.authorPic ? (
                    <Image
                      source={{ uri: comment.authorPic }}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                      <Text className="text-sm font-bold text-blue-600">
                        {comment.authorName?.charAt(0)}
                      </Text>
                    </View>
                  )}
                  <View className="ml-3 flex-1">
                    <Text className="text-sm font-semibold text-gray-900">
                      {comment.authorName}
                    </Text>
                    <Text className="text-sm text-gray-700 mt-1">
                      {comment.text}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1">
                      {formatTimestamp(comment.createdAt)}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {/* Add Comment Input */}
          <View className="flex-row items-center px-4 py-3 border-t border-gray-200 bg-white">
            {userData?.profilePic || userData?.githubAvatar ? (
              <Image
                source={{ uri: userData.profilePic || userData.githubAvatar }}
                className="w-9 h-9 rounded-full"
                style={{ borderWidth: 0.5, borderColor: '#e5e7eb' }}
              />
            ) : (
              <View 
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{ backgroundColor: '#3b82f6' }}
              >
                <Text className="text-sm font-bold text-white">
                  {userData?.firstName?.charAt(0)}
                </Text>
              </View>
            )}
            <TextInput
              placeholder="Write a comment..."
              placeholderTextColor="#9ca3af"
              value={commentText}
              onChangeText={setCommentText}
              className="flex-1 bg-gray-50 rounded-full px-4 py-2 mx-3 text-gray-900 text-sm"
              multiline
            />
            <TouchableOpacity
              onPress={addComment}
              disabled={submittingComment || !commentText.trim()}
              className={submittingComment || !commentText.trim() ? "opacity-50" : ""}
            >
              {submittingComment ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                <Feather 
                  name="send" 
                  size={20} 
                  color={commentText.trim() ? "#3b82f6" : "#9ca3af"} 
                />
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default Feed;
