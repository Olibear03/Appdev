import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Button, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { COLLEGES } from './colleges';
import { useAuth } from './context/AuthContext';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [college, setCollege] = useState(COLLEGES[0]?.code || 'unknown');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [collegeModalVisible, setCollegeModalVisible] = useState(false);

  const handleRegister = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }
    if (!email.endsWith('@cvsu.edu.ph')) {
      Alert.alert('Error', 'Must use @cvsu.edu.ph email');
      return;
    }
    if (!studentId.trim()) {
      Alert.alert('Error', 'Please enter your student ID');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    try {
      await register(email, password, { name: fullName, studentId, college });
      router.push('/');
    } catch (err) {
      Alert.alert('Error', 'Failed to register');
    }
  };
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Student Registration</ThemedText>
      <ThemedText>Create your account to start reporting</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email (@cvsu.edu.ph)"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Student ID"
        value={studentId}
        onChangeText={setStudentId}
        autoCapitalize="characters"
      />
      <ThemedText style={{ marginTop: 8 }}>College</ThemedText>
      <TouchableOpacity style={styles.dropdown} onPress={() => setCollegeModalVisible(true)}>
        <ThemedText>{COLLEGES.find(c => c.code === college)?.label}</ThemedText>
      </TouchableOpacity>
      <Modal visible={collegeModalVisible} animationType="slide" onRequestClose={() => setCollegeModalVisible(false)}>
        <SafeAreaView style={{ flex: 1 }}>
          <ThemedText type="title" style={{ padding: 16 }}>Select your college</ThemedText>
          <ScrollView>
            {COLLEGES.map(c => (
              <Pressable key={c.code} onPress={() => { setCollege(c.code); setCollegeModalVisible(false); }} style={({ pressed }) => [{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f3f6', backgroundColor: pressed ? '#eef5ff' : '#fff' }]}>
                <ThemedText style={{ color: college === c.code ? '#0a4dbd' : undefined }}>{c.label}</ThemedText>
              </Pressable>
            ))}
          </ScrollView>
          <View style={{ padding: 12 }}>
            <Button title="Close" onPress={() => setCollegeModalVisible(false)} />
          </View>
        </SafeAreaView>
      </Modal>
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      <Button title="Create Account" onPress={handleRegister} />
      <Link href="/" style={{ marginTop: 12 }}>
        <ThemedText>Already have an account? Sign in</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'stretch',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e6ef',
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#e1e6ef',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginVertical: 8,
  },
  collegeOption: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f6'
  }
});