import React, { useRef, useState } from 'react';
import { StyleSheet, ScrollView, Button, Image, Animated, TouchableOpacity, LayoutAnimation, UIManager, Platform, Modal, Pressable, View, Dimensions } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from './context/AuthContext';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ReportsScreen() {
  const { user, reports, logout, updateReportStatus } = useAuth();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const openGallery = (images: string[], index = 0) => {
    setGalleryImages(images);
    setGalleryIndex(index);
    setGalleryVisible(true);
  };
  const closeGallery = () => setGalleryVisible(false);
  const screenWidth = Dimensions.get('window').width;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  if (!user) return null;

  const filteredReports = user.role === 'student' 
    ? reports.filter(r => r.studentId === user.id) 
    : user.role === 'admin' 
    ? reports.filter(r => r.college === user.college) 
    : reports; // super-admin sees all

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={[styles.container, { paddingTop: insets.top + 10 }]}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <ThemedText style={styles.title}>
            {user.role === 'student' ? 'My Reports' : user.role === 'admin' ? `Reports for ${user.college}` : 'All Reports'}
          </ThemedText>
        </Animated.View>
        {filteredReports.map(report => (
          <ThemedView key={report.id} style={styles.report}>
            <ThemedText>Description: {report.description}</ThemedText>
            <ThemedText>Date: {new Date(report.date).toLocaleDateString()}</ThemedText>
            <ThemedText>Location: {report.location.lat}, {report.location.lng}</ThemedText>
            <ThemedText>College: {report.college}</ThemedText>
            <ThemedText>Category: {report.category}</ThemedText>
            <ThemedText>Urgency: {report.urgency}</ThemedText>
            <ThemedText>Status: {report.status}</ThemedText>
            {report.imageUris && report.imageUris.length > 0 && (
              report.imageUris.length === 1 ? (
                <TouchableOpacity onPress={() => openGallery(report.imageUris, 0)}>
                  <Image source={{ uri: report.imageUris[0] }} style={styles.image} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => openGallery(report.imageUris, 0)}>
                  <View>
                    <Image source={{ uri: report.imageUris[0] }} style={styles.image} />
                    <View style={styles.thumbnailOverlay}>
                      <ThemedText style={styles.overlayText}>+{report.imageUris.length - 1} more</ThemedText>
                    </View>
                  </View>
                </TouchableOpacity>
              )
            )}
            {user.role !== 'student' && (
              <ThemedView style={styles.statusButtons}>
                <TouchableOpacity style={styles.statusButton} onPress={() => updateReportStatus(report.id, 'pending')}>
                  <ThemedText style={styles.statusButtonText}>Pending</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.statusButton} onPress={() => updateReportStatus(report.id, 'in-progress')}>
                  <ThemedText style={styles.statusButtonText}>In Progress</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.statusButton} onPress={() => updateReportStatus(report.id, 'resolved')}>
                  <ThemedText style={styles.statusButtonText}>Resolved</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            )}
          </ThemedView>
        ))}
      </ScrollView>
      <Modal visible={galleryVisible} transparent={false} onRequestClose={closeGallery} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView horizontal pagingEnabled style={{ flex: 1 }} contentContainerStyle={styles.modalScroll}>
            {galleryImages.map((uri, i) => (
              <View key={i} style={{ width: screenWidth, height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <Image source={{ uri }} style={[styles.modalImage, { width: screenWidth }]} />
              </View>
            ))}
          </ScrollView>
          <Pressable style={styles.modalCloseButton} onPress={closeGallery}>
            <ThemedText style={styles.modalCloseText}>Close</ThemedText>
          </Pressable>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 20, // Base padding, insets will add more
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: Colors.light.primary,
  },
  report: {
    marginVertical: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    backgroundColor: Colors.light.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 200,
    height: 150,
    marginVertical: 10,
    alignSelf: 'center',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    flexWrap: 'wrap',
  },
  statusButton: {
    backgroundColor: Colors.light.accent,
    padding: 8,
    borderRadius: 6,
    margin: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  thumbnailOverlay: {
    position: 'absolute',
    right: 10,
    top: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  overlayText: {
    color: '#fff',
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 8,
  },
  modalCloseText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});