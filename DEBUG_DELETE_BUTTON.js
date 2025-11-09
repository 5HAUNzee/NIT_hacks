// Temporary Debug Helper for Feed.js
// Add this at the TOP of your renderPost function to see what's happening

const DebugPostInfo = ({ post, userId, isAuthor }) => {
  return (
    <View style={{
      backgroundColor: '#fef3c7',
      padding: 12,
      margin: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: '#fbbf24',
    }}>
      <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#92400e', marginBottom: 8 }}>
        🐛 DEBUG INFO (Remove this component later)
      </Text>
      <Text style={{ fontSize: 12, color: '#78350f' }}>
        Post ID: {post.id}
      </Text>
      <Text style={{ fontSize: 12, color: '#78350f' }}>
        Post Author ID: {post.authorId || 'MISSING!'}
      </Text>
      <Text style={{ fontSize: 12, color: '#78350f' }}>
        Your User ID: {userId || 'MISSING!'}
      </Text>
      <Text style={{ fontSize: 12, color: '#78350f', fontWeight: 'bold', marginTop: 4 }}>
        Is Author: {isAuthor ? '✅ YES' : '❌ NO'}
      </Text>
      <Text style={{ fontSize: 12, color: '#78350f', fontWeight: 'bold' }}>
        Delete Button Should Show: {isAuthor ? '✅ YES' : '❌ NO'}
      </Text>
      {!post.authorId && (
        <Text style={{ fontSize: 12, color: '#dc2626', fontWeight: 'bold', marginTop: 8 }}>
          ⚠️ WARNING: Post has no authorId field!
        </Text>
      )}
      {!userId && (
        <Text style={{ fontSize: 12, color: '#dc2626', fontWeight: 'bold', marginTop: 8 }}>
          ⚠️ WARNING: User is not logged in!
        </Text>
      )}
    </View>
  );
};

// HOW TO USE:
// In your renderPost function, add this right after "return (":
//
// return (
//   <View key={post.id} className="bg-white mb-3 pb-2">
//     {/* ADD THIS DEBUG COMPONENT */}
//     <DebugPostInfo post={post} userId={user?.id} isAuthor={isAuthor} />
//     
//     {/* Rest of your post rendering... */}
//     <View className="flex-row items-center justify-between px-4 pt-3 pb-2">
//       ...
//
// This will show a YELLOW DEBUG BOX on every post showing:
// - Whether you're the author
// - The IDs being compared
// - Why the delete button is/isn't showing
//
// REMOVE THIS DEBUG COMPONENT once you've figured out the issue!
