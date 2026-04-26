import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

interface IncomingCallUIProps {
  callerName: string;
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingCallUI({ callerName, onAccept, onDecline }: IncomingCallUIProps) {
  const ringAnim = useSharedValue(1);

  useEffect(() => {
    const interval = setInterval(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1500);

    // Animation for the accept button pulse
    ringAnim.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );

    return () => clearInterval(interval);
  }, []);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringAnim.value }],
  }));

  return (
    <View style={styles.container}>
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={80} color="#fff" />
            </View>
          </View>
          <Text style={styles.callerName}>{callerName}</Text>
          <Text style={styles.callType}>Mobile</Text>
        </View>

        <View style={styles.actions}>
          <View style={styles.actionColumn}>
            <TouchableOpacity
              onPress={onDecline}
              style={[styles.button, styles.declineButton]}
            >
              <Ionicons name="close" size={40} color="white" />
            </TouchableOpacity>
            <Text style={styles.buttonLabel}>Decline</Text>
          </View>

          <View style={styles.actionColumn}>
            <Animated.View style={animatedButtonStyle}>
              <TouchableOpacity
                onPress={onAccept}
                style={[styles.button, styles.acceptButton]}
              >
                <Ionicons name="call" size={40} color="white" />
              </TouchableOpacity>
            </Animated.View>
            <Text style={styles.buttonLabel}>Accept</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 1000,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 100,
  },
  header: {
    alignItems: 'center',
    marginTop: 50,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatarPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#666',
  },
  callerName: {
    fontSize: 36,
    fontWeight: '300',
    color: 'white',
    letterSpacing: 1,
  },
  callType: {
    fontSize: 18,
    color: '#aaa',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 40,
  },
  actionColumn: {
    alignItems: 'center',
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  declineButton: {
    backgroundColor: '#ff3b30',
  },
  acceptButton: {
    backgroundColor: '#4cd964',
  },
  buttonLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});
