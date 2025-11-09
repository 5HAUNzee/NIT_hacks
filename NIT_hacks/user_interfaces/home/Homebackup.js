 {activeTab === "Notes" && (
        <View style={{ flex: 1 }}>
          <ScrollView style={{ flex: 1, padding: 24 }}>
            {notes.length === 0 ? (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 }}>
                <Feather name="file-text" size={48} color="#d1d5db" />
                <Text style={{ marginTop: 16, color: "#6b7280" }}>No notes yet</Text>
                <Text style={{ marginTop: 8, color: "#9ca3af", textAlign: "center" }}>Share study notes with your circle</Text>
              </View>
            ) : (
              notes.map((note) => (
                <View key={note.id} style={{ backgroundColor: "white", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <TouchableOpacity onPress={() => openNote(note.url)} style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={{ width: 48, height: 48, backgroundColor: "#fee2e2", borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 16 }}>
                      <Feather name="file-text" size={24} color="#b91c1c" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "600", fontSize: 16, marginBottom: 4 }}>{note.title}</Text>
                      <Text style={{ fontSize: 12, color: "#6b7280" }}>Uploaded by {note.uploaderName} • {formatTime(note.createdAt)}</Text>
                    </View>
                    <Feather name="external-link" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                  {note.uploadedBy === user.id && (
                    <TouchableOpacity onPress={() => deleteNote(note.id, note.uploadedBy)} style={{ marginTop: 12, backgroundColor: "#fee2e2", padding: 8, borderRadius: 8, flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
                      <Feather name="trash-2" size={16} color="#b91c1c" />
                      <Text style={{ color: "#b91c1c", fontWeight: "600", marginLeft: 8 }}>Delete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </ScrollView>
          <View style={{ paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 1, borderTopColor: "#e5e7eb" }}>
            <TouchableOpacity onPress={uploadNote} disabled={uploadingNote} style={{ backgroundColor: uploadingNote ? "#a5b4fc" : "#111827", paddingVertical: 16, borderRadius: 12, justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 6 }}>
              {uploadingNote ? <ActivityIndicator color="#fff" /> : <Feather name="upload" size={20} color="#fff" />}
              <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>Upload PDF Note</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {activeTab === "Sessions" && (
        <View style={{ flex: 1 }}>
          <ScrollView style={{ flex: 1, padding: 24 }}>
            {sessions.length === 0 ? (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 }}>
                <Feather name="calendar" size={48} color="#d1d5db" />
                <Text style={{ marginTop: 16, color: "#6b7280" }}>No sessions scheduled</Text>
                <Text style={{ marginTop: 8, color: "#9ca3af", textAlign: "center" }}>Schedule study sessions with members</Text>
              </View>
            ) : (
              sessions.map((session) => (
                <View key={session.id} style={{ backgroundColor: "white", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>{session.title}</Text>
                  <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>{session.meetingTime}</Text>
                  <TouchableOpacity onPress={() => openSessionLink(session.meetingLink)} style={{ flexDirection: "row", alignItems: "center" }}>
                    <Feather name="external-link" size={20} color="#2563eb" />
                    <Text style={{ marginLeft: 8, fontWeight: "600", color: "#2563eb" }}>Join Meeting</Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>Scheduled by {session.creatorName}</Text>
                </View>
              ))
            )}
          </ScrollView>
          <View style={{ paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 1, borderTopColor: "#e5e7eb" }}>
            <TouchableOpacity onPress={() => setShowSessionModal(true)} style={{ backgroundColor: "#111827", paddingVertical: 16, borderRadius: 12, justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 8 }}>
              <Feather name="plus-circle" size={20} color="#fff" />
              <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>Schedule New Session</Text>
            </TouchableOpacity>
          </View>
          <Modal
            visible={showSessionModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowSessionModal(false)}
          >
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 24 }}>
              <View style={{ backgroundColor: "white", borderRadius: 16, padding: 24 }}>
                <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 12 }}>Schedule Session</Text>
                <TextInput placeholder="Session Title" value={sessionTitle} onChangeText={setSessionTitle} style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 12, padding: 12, marginBottom: 12 }} />
                <TextInput placeholder="Pick date & time (e.g. Mon 10 Nov, 6:30PM)" value={sessionDateString} onChangeText={setSessionDateString} style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 12, padding: 12, marginBottom: 12 }} />
                <TextInput placeholder="Meeting Link (e.g., Google Meet)" value={sessionLink} onChangeText={setSessionLink} style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 12, padding: 12, marginBottom: 24 }} />
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <TouchableOpacity onPress={addSession} disabled={addingSession} style={{ backgroundColor: "#111827", flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", marginRight: 12 }}>
                    <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>{addingSession ? "Scheduling..." : "Schedule"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowSessionModal(false)} style={{ backgroundColor: "#e5e7eb", flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center" }}>
                    <Text style={{ color: "#374151", fontWeight: "700", fontSize: 16 }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      )}