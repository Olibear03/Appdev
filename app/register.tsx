import React, { useState } from 'react';
import { StyleSheet, TextInput, Button, Alert } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from './context/AuthContext';
import { router } from 'expo-router';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [email, setEmail] = useState('');

  const handleRegister = () => {
    if (!email.endsWith('@cvsu.edu.ph')) {
      Alert.alert('Error', 'Must use @cvsu.edu.ph email');
      return;
    }
    register(email);
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Register as Student</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="Email (@cvsu.edu.ph)"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <Button title="Register" onPress={handleRegister} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
  },
});