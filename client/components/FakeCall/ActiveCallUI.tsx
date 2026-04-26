import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  interpolate 
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

interface ActiveCallUIProps {
  callerName: string;
  onEndCall: () => void;
  backendUrl: string;
}

export default function ActiveCallUI({ callerName, onEndCall, backendUrl }: ActiveCallUIProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Connected');
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const pulseAnim = useSharedValue(0);

  // Call duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Pulse animation for recording
  useEffect(() => {
    if (isRecording) {
      pulseAnim.value = withRepeat(withTiming(1, { duration: 1000 }), -1, true);
    } else {
      pulseAnim.value = withTiming(0);
    }
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setStatusMessage('Listening...');
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecordingAndProcess = async () => {
    if (!recordingRef.current) return;

    try {
      setIsRecording(false);
      setIsProcessing(true);
      setStatusMessage('Thinking...');
      
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (uri) {
        // Send to backend
        const formData = new FormData();
        // @ts-ignore
        formData.append('file', {
          uri,
          name: 'recording.m4a',
          type: 'audio/m4a',
        });

        const response = await fetch(`${backendUrl}/process-fake-call`, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const data = await response.json();
        
        if (data.response) {
          setStatusMessage('Speaking...');
          Speech.speak(data.response, {
            onDone: () => {
              setStatusMessage('Connected');
              setIsProcessing(false);
            },
            onError: (e) => {
              console.error('Speech error', e);
              setIsProcessing(false);
            }
          });
        }
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
      setIsProcessing(false);
      setStatusMessage('Error');
    }
  };

  const animatedPulse = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulseAnim.value, [0, 1], [1, 1.5]) }],
    opacity: interpolate(pulseAnim.value, [0, 1], [0.8, 0.2]),
  }));

  return (
    <View style={styles.container}>
      <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.callerName}>{callerName}</Text>
          <Text style={styles.duration}>{formatTime(callDuration)}</Text>
          <Text style={styles.status}>{statusMessage}</Text>
        </View>

        <View style={styles.visualizerContainer}>
          {isRecording && (
            <Animated.View style={[styles.pulseCircle, animatedPulse]} />
          )}
          <View style={[styles.mainCircle, isRecording && styles.recordingCircle]}>
             {isProcessing ? (
               <ActivityIndicator size="large" color="white" />
             ) : (
               <Ionicons 
                name={isRecording ? "mic" : "mic-outline"} 
                size={50} 
                color="white" 
              />
             )}
          </View>
        </View>

        <View style={styles.controls}>
          <View style={styles.row}>
            <TouchableOpacity style={styles.controlButton}>
              <Ionicons name="volume-high" size={28} color="white" />
              <Text style={styles.controlText}>speaker</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton}>
              <Ionicons name="videocam" size={28} color="white" />
              <Text style={styles.controlText}>video</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton}>
              <Ionicons name="mic-off" size={28} color="white" />
              <Text style={styles.controlText}>mute</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomActions}>
            <TouchableOpacity 
              onPressIn={startRecording}
              onPressOut={stopRecordingAndProcess}
              style={[styles.micButton, isRecording && styles.micButtonActive]}
            >
               <Text style={styles.micButtonText}>
                 {isRecording ? "Release to Send" : "Hold to Speak"}
               </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={onEndCall} 
              style={styles.endCallButton}
            >
              <Ionicons name="call" size={32} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 1001,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  header: {
    alignItems: 'center',
  },
  callerName: {
    fontSize: 32,
    color: 'white',
    fontWeight: '300',
  },
  duration: {
    fontSize: 18,
    color: 'white',
    marginTop: 10,
    fontVariant: ['tabular-nums'],
  },
  status: {
    fontSize: 16,
    color: '#4cd964',
    marginTop: 5,
    fontWeight: '600',
  },
  visualizerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
  },
  mainCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  recordingCircle: {
    backgroundColor: '#ff3b30',
    borderColor: '#ff3b30',
  },
  pulseCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ff3b30',
  },
  controls: {
    width: '100%',
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 40,
  },
  controlButton: {
    alignItems: 'center',
    width: 80,
  },
  controlText: {
    color: 'white',
    fontSize: 12,
    marginTop: 8,
  },
  bottomActions: {
    alignItems: 'center',
    gap: 20,
  },
  micButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  micButtonActive: {
    backgroundColor: '#ff3b30',
    borderColor: '#ff3b30',
  },
  micButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  endCallButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
});
