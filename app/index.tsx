import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, TextInput, Button, Alert, Image, ScrollView, View, TouchableOpacity, Animated, LayoutAnimation, UIManager, Platform, Modal, Pressable, Dimensions } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from './context/AuthContext';
import { Link } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Report } from './types';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen() {
  const { user, login, addReport, reports, updateReportStatus, updateReportCollege, createAdmin } = useAuth();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'super-admin' | 'admin' | 'student'>('student');
  const [description, setDescription] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [college, setCollege] = useState<'CAS' | 'CCJ' | 'CEIT' | 'CEMDS' | 'unknown'>('unknown');
  const [category, setCategory] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminCollege, setAdminCollege] = useState('CAS');
  const [statusFilter, setStatusFilter] = useState<'all' | Report['status']>('all');
  const [collegeFilter, setCollegeFilter] = useState<'all' | Report['college']>('all');
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportStatus, setExportStatus] = useState<'all' | Report['status']>('all');
  const [exportCollege, setExportCollege] = useState<'all' | Report['college']>('all');

  useEffect(() => {
    (async () => {
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
      }
      const { status: imageStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (imageStatus !== 'granted') {
        Alert.alert('Permission denied', 'Media library permission is required');
      }
    })();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleLogin = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter email');
      return;
    }
    if (role === 'student' && !email.endsWith('@cvsu.edu.ph')) {
      Alert.alert('Error', 'Students must use @cvsu.edu.ph email');
      return;
    }
    try {
      await login(email, role);
    } catch (error) {
      Alert.alert('Error', 'Invalid credentials');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      const selectedUris = result.assets.slice(0, 5).map(asset => asset.uri);
      if (result.assets.length > 5) {
        Alert.alert('Info', 'Only the first 5 images were selected.');
      }
      setImageUris(selectedUris);
    }
  };

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const loc = await Location.getCurrentPositionAsync({});
    setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
  };

  const submitReport = () => {
    if (!description || imageUris.length === 0 || !location || !user || !category) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    addReport({
      studentId: user.id,
      location,
      imageUris,
      date: new Date().toISOString(),
      description,
      college,
      category,
      urgency,
    });
    setDescription('');
    setImageUris([]);
    setLocation(null);
    setCategory('');
    Alert.alert('Success', 'Report submitted');
  };

  const openGallery = (images: string[], index = 0) => {
    setGalleryImages(images);
    setGalleryIndex(index);
    setGalleryVisible(true);
  };

  const closeGallery = () => setGalleryVisible(false);
  const screenWidth = Dimensions.get('window').width;

  const generatePDF = async (data: Report[], title = 'CvSU Reports') => {
    try {
      if (data.length === 0) {
        Alert.alert('Info', 'No reports to export');
        return;
      }

      // Convert to CSV format
      const headers = ['No.', 'Date', 'College', 'Category', 'Urgency', 'Status', 'Description'];
      const rows = data.map((r, idx) => [
        String(idx + 1),
        new Date(r.date).toLocaleString(),
        String(r.college),
        String(r.category),
        String(r.urgency),
        String(r.status),
        (r.description || '').replace(/"/g, '""'), // Escape quotes in CSV
      ]);

      // Create CSV content
      const csvContent = [
        `"${headers.join('","')}"`,
        ...rows.map(row => `"${row.join('","')}"`)
      ].join('\n');

      const filename = `reports-summary-${new Date().getTime()}.csv`;

      if (Platform.OS === 'web') {
        try {
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', filename);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          Alert.alert('Success', 'Reports exported successfully as CSV');
        } catch (webErr) {
          console.error('Web export failed:', webErr);
          Alert.alert('Error', `Failed to export CSV: ${(webErr as any)?.message || String(webErr)}`);
        }
      } else {
        try {
          // Use FileSystem and Sharing for mobile platforms
          const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory || '';
          const fileUri = baseDir + filename;
          await FileSystem.writeAsStringAsync(fileUri, csvContent);
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
            Alert.alert('Success', 'CSV shared successfully');
          } else {
            Alert.alert('Success', `CSV saved to ${fileUri}`);
          }
        } catch (mobileErr) {
          console.error('Mobile export failed:', mobileErr);
          Alert.alert('Error', `Failed to export CSV: ${(mobileErr as any)?.message || String(mobileErr)}`);
        }
      }
    } catch (err: any) {
      console.error('generatePDF error:', err);
      Alert.alert('Error', `Failed to export reports: ${err?.message || String(err)}`);
    }
  };

  const handleCreateAdmin = async () => {
    if (!adminEmail || !adminCollege) {
      Alert.alert('Error', 'Please enter email and select college');
      return;
    }
    try {
      await createAdmin(adminEmail, adminCollege);
      setAdminEmail('');
      Alert.alert('Success', 'Admin created');
    } catch (error) {
      Alert.alert('Error', 'Failed to create admin');
    }
  };

  // Compute filtered reports based on modal selections and user role
  const exportFilteredReports = () => {
    if (!user) {
      Alert.alert('Error', 'Not signed in');
      return;
    }
    let dataToExport: Report[];
    if (user.role === 'super-admin') {
      dataToExport = reports;
    } else if (user.role === 'admin' && user.college) {
      dataToExport = reports.filter(r => r.college === user.college);
    } else {
      Alert.alert('Error', 'Unable to export reports');
      return;
    }
    // Apply additional filters
    dataToExport = dataToExport.filter(r => 
      (exportStatus === 'all' || r.status === exportStatus) && 
      (exportCollege === 'all' || r.college === exportCollege)
    );
    setExportModalVisible(false);
    generatePDF(dataToExport);
  };

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ThemedView style={styles.container}>
          <Animated.View style={{ opacity: fadeAnim }}>
            <ThemedText style={styles.title}>CvSU Reporting System</ThemedText>
          </Animated.View>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <ThemedView style={styles.roleContainer}>
            <TouchableOpacity
              style={[styles.roleButton, role === 'student' && styles.roleButtonSelected]}
              onPress={() => setRole('student')}
            >
              <ThemedText style={styles.roleText}>Student</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleButton, role === 'admin' && styles.roleButtonSelected]}
              onPress={() => setRole('admin')}
            >
              <ThemedText style={styles.roleText}>Admin</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleButton, role === 'super-admin' && styles.roleButtonSelected]}
              onPress={() => setRole('super-admin')}
            >
              <ThemedText style={styles.roleText}>Super Admin</ThemedText>
            </TouchableOpacity>
          </ThemedView>
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <ThemedText style={styles.buttonText}>Login</ThemedText>
          </TouchableOpacity>
          {role === 'student' && (
            <Link href="/register" style={styles.link}>
              <ThemedText>Register as Student</ThemedText>
            </Link>
          )}
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (user?.role === 'super-admin') {
    const filteredReports = reports.filter(r => 
      (statusFilter === 'all' || r.status === statusFilter) &&
      (collegeFilter === 'all' || r.college === collegeFilter)
    );
    const totalReports = reports.length;
    const pendingReports = reports.filter(r => r.status === 'pending').length;
    const inProgressReports = reports.filter(r => r.status === 'in-progress').length;
    const resolvedReports = reports.filter(r => r.status === 'resolved').length;
    const unknownCollegeReports = reports.filter(r => r.college === 'unknown').length;

    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={[styles.container, { paddingTop: insets.top + 10 }]}>
          <Animated.View style={{ opacity: fadeAnim }}>
            <ThemedText style={styles.title}>Super Admin Dashboard</ThemedText>
          </Animated.View>
          <TouchableOpacity style={[styles.button, { alignSelf: 'center' }]} onPress={() => setExportModalVisible(true)}>
            <ThemedText style={styles.buttonText}>Export Reports (CSV)</ThemedText>
          </TouchableOpacity>
          <ThemedView style={styles.statCard}>
            <ThemedText style={styles.statText}>Total Reports: {totalReports}</ThemedText>
          </ThemedView>
          <ThemedView style={styles.statCard}>
            <ThemedText style={styles.statText}>Pending: {pendingReports}</ThemedText>
          </ThemedView>
          <ThemedView style={styles.statCard}>
            <ThemedText style={styles.statText}>In Progress: {inProgressReports}</ThemedText>
          </ThemedView>
          <ThemedView style={styles.statCard}>
            <ThemedText style={styles.statText}>Resolved: {resolvedReports}</ThemedText>
          </ThemedView>
          <ThemedView style={styles.statCard}>
            <ThemedText style={styles.statText}>Unknown College: {unknownCollegeReports}</ThemedText>
          </ThemedView>
          
          <ThemedText type="subtitle">Filters</ThemedText>
          <ThemedText>Status:</ThemedText>
          <ThemedView style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, statusFilter === 'all' && styles.filterButtonSelected]}
              onPress={() => setStatusFilter('all')}
            >
              <ThemedText style={styles.filterText}>All</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, statusFilter === 'pending' && styles.filterButtonSelected]}
              onPress={() => setStatusFilter('pending')}
            >
              <ThemedText style={styles.filterText}>Pending</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, statusFilter === 'in-progress' && styles.filterButtonSelected]}
              onPress={() => setStatusFilter('in-progress')}
            >
              <ThemedText style={styles.filterText}>In Progress</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, statusFilter === 'resolved' && styles.filterButtonSelected]}
              onPress={() => setStatusFilter('resolved')}
            >
              <ThemedText style={styles.filterText}>Resolved</ThemedText>
            </TouchableOpacity>
          </ThemedView>
          <ThemedText>College:</ThemedText>
          <ThemedView style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, collegeFilter === 'all' && styles.filterButtonSelected]}
              onPress={() => setCollegeFilter('all')}
            >
              <ThemedText style={styles.filterText}>All</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, collegeFilter === 'CAS' && styles.filterButtonSelected]}
              onPress={() => setCollegeFilter('CAS')}
            >
              <ThemedText style={styles.filterText}>CAS</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, collegeFilter === 'CCJ' && styles.filterButtonSelected]}
              onPress={() => setCollegeFilter('CCJ')}
            >
              <ThemedText style={styles.filterText}>CCJ</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, collegeFilter === 'CEIT' && styles.filterButtonSelected]}
              onPress={() => setCollegeFilter('CEIT')}
            >
              <ThemedText style={styles.filterText}>CEIT</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, collegeFilter === 'CEMDS' && styles.filterButtonSelected]}
              onPress={() => setCollegeFilter('CEMDS')}
            >
              <ThemedText style={styles.filterText}>CEMDS</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, collegeFilter === 'unknown' && styles.filterButtonSelected]}
              onPress={() => setCollegeFilter('unknown')}
            >
              <ThemedText style={styles.filterText}>Unknown</ThemedText>
            </TouchableOpacity>
          </ThemedView>
          
          <ThemedText type="subtitle">Reports ({filteredReports.length})</ThemedText>
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
              {report.college === 'unknown' && (
                <ThemedView>
                  <ThemedText>Assign College:</ThemedText>
                  <ThemedView style={styles.filterButtons}>
                    <TouchableOpacity style={styles.filterButton} onPress={() => updateReportCollege(report.id, 'CAS')}>
                      <ThemedText style={styles.filterText}>CAS</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.filterButton} onPress={() => updateReportCollege(report.id, 'CCJ')}>
                      <ThemedText style={styles.filterText}>CCJ</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.filterButton} onPress={() => updateReportCollege(report.id, 'CEIT')}>
                      <ThemedText style={styles.filterText}>CEIT</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.filterButton} onPress={() => updateReportCollege(report.id, 'CEMDS')}>
                      <ThemedText style={styles.filterText}>CEMDS</ThemedText>
                    </TouchableOpacity>
                  </ThemedView>
                </ThemedView>
              )}
            </ThemedView>
          ))}
          
          <ThemedText type="subtitle">Create Admin</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Admin Email"
            value={adminEmail}
            onChangeText={setAdminEmail}
            keyboardType="email-address"
          />
          <ThemedView style={styles.roleContainer}>
            <Button title="CAS" onPress={() => setAdminCollege('CAS')} color={adminCollege === 'CAS' ? 'blue' : 'gray'} />
            <Button title="CCJ" onPress={() => setAdminCollege('CCJ')} color={adminCollege === 'CCJ' ? 'blue' : 'gray'} />
            <Button title="CEIT" onPress={() => setAdminCollege('CEIT')} color={adminCollege === 'CEIT' ? 'blue' : 'gray'} />
            <Button title="CEMDS" onPress={() => setAdminCollege('CEMDS')} color={adminCollege === 'CEMDS' ? 'blue' : 'gray'} />
          </ThemedView>
          <TouchableOpacity style={styles.button} onPress={handleCreateAdmin}>
            <ThemedText style={styles.buttonText}>Create Admin</ThemedText>
          </TouchableOpacity>
          <Modal visible={exportModalVisible} transparent animationType="fade" onRequestClose={() => setExportModalVisible(false)}>
            <SafeAreaView style={styles.exportModalContainer}>
              <ThemedText type="title">Export Reports</ThemedText>
              <ThemedText>Filter by status:</ThemedText>
              <ThemedView style={styles.filterButtons}>
                <TouchableOpacity style={[styles.filterButton, exportStatus === 'all' && styles.filterButtonSelected]} onPress={() => setExportStatus('all')}>
                  <ThemedText style={styles.filterText}>All</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.filterButton, exportStatus === 'pending' && styles.filterButtonSelected]} onPress={() => setExportStatus('pending')}>
                  <ThemedText style={styles.filterText}>Pending</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.filterButton, exportStatus === 'in-progress' && styles.filterButtonSelected]} onPress={() => setExportStatus('in-progress')}>
                  <ThemedText style={styles.filterText}>In Progress</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.filterButton, exportStatus === 'resolved' && styles.filterButtonSelected]} onPress={() => setExportStatus('resolved')}>
                  <ThemedText style={styles.filterText}>Resolved</ThemedText>
                </TouchableOpacity>
              </ThemedView>
              {user?.role === 'super-admin' && (
                <>
                  <ThemedText>Filter by college:</ThemedText>
                  <ThemedView style={styles.filterButtons}>
                    <TouchableOpacity style={[styles.filterButton, exportCollege === 'all' && styles.filterButtonSelected]} onPress={() => setExportCollege('all')}>
                      <ThemedText style={styles.filterText}>All</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.filterButton, exportCollege === 'CAS' && styles.filterButtonSelected]} onPress={() => setExportCollege('CAS')}>
                      <ThemedText style={styles.filterText}>CAS</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.filterButton, exportCollege === 'CCJ' && styles.filterButtonSelected]} onPress={() => setExportCollege('CCJ')}>
                      <ThemedText style={styles.filterText}>CCJ</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.filterButton, exportCollege === 'CEIT' && styles.filterButtonSelected]} onPress={() => setExportCollege('CEIT')}>
                      <ThemedText style={styles.filterText}>CEIT</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.filterButton, exportCollege === 'CEMDS' && styles.filterButtonSelected]} onPress={() => setExportCollege('CEMDS')}>
                      <ThemedText style={styles.filterText}>CEMDS</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.filterButton, exportCollege === 'unknown' && styles.filterButtonSelected]} onPress={() => setExportCollege('unknown')}>
                      <ThemedText style={styles.filterText}>Unknown</ThemedText>
                    </TouchableOpacity>
                  </ThemedView>
                </>
              )}
              <ThemedView style={{ flexDirection: 'row', marginTop: 12 }}>
                <TouchableOpacity style={[styles.button, { marginRight: 8 }]} onPress={exportFilteredReports}>
                  <ThemedText style={styles.buttonText}>Generate</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, { backgroundColor: '#888' }]} onPress={() => setExportModalVisible(false)}>
                  <ThemedText style={styles.buttonText}>Cancel</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </SafeAreaView>
          </Modal>
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
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (user?.role === 'student') {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={[styles.container, { paddingTop: insets.top + 10 }]}>
          <Animated.View style={{ opacity: fadeAnim }}>
            <ThemedText style={styles.title}>Submit Report</ThemedText>
          </Animated.View>
          <TextInput
            style={styles.input}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <TextInput
            style={styles.input}
            placeholder="Category"
            value={category}
            onChangeText={setCategory}
          />
          <ThemedText>Select Urgency:</ThemedText>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => Alert.alert(
              'Select Urgency',
              '',
              [
                { text: 'Low', onPress: () => setUrgency('low') },
                { text: 'Medium', onPress: () => setUrgency('medium') },
                { text: 'High', onPress: () => setUrgency('high') },
                { text: 'Cancel', style: 'cancel' }
              ]
            )}
          >
            <ThemedText>{urgency.charAt(0).toUpperCase() + urgency.slice(1)}</ThemedText>
          </TouchableOpacity>
          <ThemedText>Select College:</ThemedText>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => Alert.alert(
              'Select College',
              '',
              [
                { text: 'CAS', onPress: () => setCollege('CAS') },
                { text: 'CCJ', onPress: () => setCollege('CCJ') },
                { text: 'CEIT', onPress: () => setCollege('CEIT') },
                { text: 'CEMDS', onPress: () => setCollege('CEMDS') },
                { text: 'Unknown', onPress: () => setCollege('unknown') },
                { text: 'Cancel', style: 'cancel' }
              ]
            )}
          >
            <ThemedText>{college}</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <ThemedText style={styles.buttonText}>Pick Image</ThemedText>
          </TouchableOpacity>
          {imageUris && imageUris.length > 0 && (
            imageUris.length === 1 ? (
              <TouchableOpacity onPress={() => openGallery(imageUris, 0)}>
                <Image source={{ uri: imageUris[0] }} style={styles.image} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => openGallery(imageUris, 0)}>
                <View>
                  <Image source={{ uri: imageUris[0] }} style={styles.image} />
                  <View style={styles.thumbnailOverlay}>
                    <ThemedText style={styles.overlayText}>+{imageUris.length - 1} more</ThemedText>
                  </View>
                </View>
              </TouchableOpacity>
            )
          )}
          <TouchableOpacity style={styles.button} onPress={getLocation}>
            <ThemedText style={styles.buttonText}>Get Location</ThemedText>
          </TouchableOpacity>
          {location && <ThemedText>Lat: {location.lat}, Lng: {location.lng}</ThemedText>}
          <TouchableOpacity style={styles.button} onPress={submitReport}>
            <ThemedText style={styles.buttonText}>Submit</ThemedText>
          </TouchableOpacity>
          <Modal visible={galleryVisible} transparent={false} onRequestClose={closeGallery} animationType="slide">
            <SafeAreaView style={styles.modalContainer}>
              <ScrollView horizontal pagingEnabled contentContainerStyle={styles.modalScroll}>
                {galleryImages.map((uri, i) => (
                  <Image key={i} source={{ uri }} style={styles.modalImage} />
                ))}
              </ScrollView>
              <Pressable style={styles.modalCloseButton} onPress={closeGallery}>
                <ThemedText style={styles.modalCloseText}>Close</ThemedText>
              </Pressable>
            </SafeAreaView>
          </Modal>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Admin view
  const filteredReports = user.college ? reports.filter(r => r.college === user.college) : [];
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={[styles.container, { paddingTop: insets.top + 10 }]}>
        <ThemedText type="title">Reports {user.college ? `for ${user.college}` : ''}</ThemedText>
        <TouchableOpacity style={[styles.button, { alignSelf: 'center' }]} onPress={() => setExportModalVisible(true)}>
          <ThemedText style={styles.buttonText}>Export Reports (CSV)</ThemedText>
        </TouchableOpacity>
        <Modal visible={exportModalVisible} transparent animationType="fade" onRequestClose={() => setExportModalVisible(false)}>
          <SafeAreaView style={styles.exportModalContainer}>
            <ThemedText type="title">Export Reports</ThemedText>
            <ThemedText>Filter by status:</ThemedText>
            <ThemedView style={styles.filterButtons}>
              <TouchableOpacity style={[styles.filterButton, exportStatus === 'all' && styles.filterButtonSelected]} onPress={() => setExportStatus('all')}>
                <ThemedText style={styles.filterText}>All</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.filterButton, exportStatus === 'pending' && styles.filterButtonSelected]} onPress={() => setExportStatus('pending')}>
                <ThemedText style={styles.filterText}>Pending</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.filterButton, exportStatus === 'in-progress' && styles.filterButtonSelected]} onPress={() => setExportStatus('in-progress')}>
                <ThemedText style={styles.filterText}>In Progress</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.filterButton, exportStatus === 'resolved' && styles.filterButtonSelected]} onPress={() => setExportStatus('resolved')}>
                <ThemedText style={styles.filterText}>Resolved</ThemedText>
              </TouchableOpacity>
            </ThemedView>

            <ThemedView style={{ flexDirection: 'row', marginTop: 12 }}>
              <TouchableOpacity style={[styles.button, { marginRight: 8 }]} onPress={exportFilteredReports}>
                <ThemedText style={styles.buttonText}>Generate</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, { backgroundColor: '#888' }]} onPress={() => setExportModalVisible(false)}>
                <ThemedText style={styles.buttonText}>Cancel</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </SafeAreaView>
        </Modal>
        {filteredReports.map(report => (
          <ThemedView key={report.id} style={styles.report}>
            <ThemedText>Description: {report.description}</ThemedText>
            <ThemedText>Date: {new Date(report.date).toLocaleDateString()}</ThemedText>
            <ThemedText>Location: {report.location.lat}, {report.location.lng}</ThemedText>
            <ThemedText>College: {report.college}</ThemedText>
            {user?.role === 'super-admin' && report.college === 'unknown' && (
              <ThemedView>
                <ThemedText>Assign College:</ThemedText>
                <ThemedView style={styles.filterButtons}>
                  <TouchableOpacity style={styles.filterButton} onPress={() => updateReportCollege(report.id, 'CAS')}>
                    <ThemedText style={styles.filterText}>CAS</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.filterButton} onPress={() => updateReportCollege(report.id, 'CCJ')}>
                    <ThemedText style={styles.filterText}>CCJ</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.filterButton} onPress={() => updateReportCollege(report.id, 'CEIT')}>
                    <ThemedText style={styles.filterText}>CEIT</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.filterButton} onPress={() => updateReportCollege(report.id, 'CEMDS')}>
                    <ThemedText style={styles.filterText}>CEMDS</ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              </ThemedView>
            )}
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
            {user?.role !== 'student' && (              <ThemedView style={styles.statusButtons}>
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
          <ScrollView horizontal pagingEnabled contentContainerStyle={styles.modalScroll}>
            {galleryImages.map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.modalImage} />
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
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 10,
    marginVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.light.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
    flexWrap: 'wrap',
  },
  roleButton: {
    backgroundColor: Colors.light.secondary,
    padding: 10,
    borderRadius: 8,
    margin: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roleButtonSelected: {
    backgroundColor: Colors.light.primary,
  },
  roleText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: Colors.light.primary,
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  link: {
    marginTop: 20,
    alignSelf: 'center',
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
  picker: {
    marginVertical: 10,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 10,
    marginVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.light.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCard: {
    backgroundColor: Colors.light.card,
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
    flexWrap: 'wrap',
  },
  filterButton: {
    backgroundColor: Colors.light.secondary,
    padding: 8,
    borderRadius: 6,
    margin: 2,
  },
  filterButtonSelected: {
    backgroundColor: Colors.light.primary,
  },
  filterText: {
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
  exportModalContainer: {
    flex: 1,
    backgroundColor: Colors.light.card,
    margin: 20,
    padding: 16,
    borderRadius: 8,
  }
});