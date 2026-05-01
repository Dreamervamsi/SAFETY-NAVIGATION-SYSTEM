import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScoredRoute } from '../Map/RouteMap';
import RouteCard from './RouteCard';
import { useEffect, useState, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';

interface RouteListProps {
    routes: ScoredRoute[];
}

export default function RouteList({ routes }: RouteListProps) {
    const [subscription, setSubscription] = useState<any>(null);
    const lastTrigger = useRef<number>(0);

    const safestRoute = routes[0];
    const fastestRoute = [...routes].sort((a, b) => a.duration_seconds - b.duration_seconds)[0];

    if (!safestRoute) return null;

    const triggerSOS = async () => {
        const now = Date.now();
        if (now - lastTrigger.current < 10000) return;
        lastTrigger.current = now;

        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission denied', 'Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            const isAvailable = await SMS.isAvailableAsync();
            if (isAvailable) {
                const googleMapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
                const messageBody = `🚨 EMERGENCY SOS! 🚨\nI need help! My current location is:\n${googleMapsLink}`;

                const savedPhone = await AsyncStorage.getItem('@emergency_contact_phone');
                const recipients = savedPhone ? [savedPhone] : [];

                const { result } = await SMS.sendSMSAsync(recipients, messageBody);

                if (result === 'sent') {
                    Alert.alert('SOS SENT', 'Emergency message draft opened with your GPS location.');
                }
            } else {
                Alert.alert('SMS Not Available', 'SMS services are not available on this device.');
            }
        } catch (error) {
            console.error('SOS Exception:', error);
            Alert.alert('Error', 'An unexpected error occurred while sending SOS.');
        }
    };

    const _subscribe = () => {
        setSubscription(
            Accelerometer.addListener(accelerometerData => {
                const { x, y, z } = accelerometerData;
                const acceleration = Math.sqrt(x * x + y * y + z * z);

                // Threshold ~12-15 on g-force as requested
                if (acceleration > 13) {
                    triggerSOS();
                }
            })
        );
        Accelerometer.setUpdateInterval(500);
    };

    const _unsubscribe = () => {
        subscription && subscription.remove();
        setSubscription(null);
    };

    useEffect(() => {
        _subscribe();
        return () => _unsubscribe();
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Choose your route</Text>
                <Text style={styles.headerTime}>· {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>

            <RouteCard
                route={safestRoute}
                title="Safest route"
                icon="shield-check"
                iconColor="#2E7D32"
                backgroundColor="#E8F5E9"
            />

            {fastestRoute && fastestRoute !== safestRoute && (
                <RouteCard
                    route={fastestRoute}
                    title="Fastest route"
                    icon="lightning-bolt"
                    iconColor="#F57F17"
                    backgroundColor="#FFFDE7"
                />
            )}

            <View style={styles.statsRow}>
                <View style={styles.stat}>
                    <Text style={styles.statLabel}>Nearby police</Text>
                    <Text style={styles.statValue}>{safestRoute.nearby_police}</Text>
                </View>
                <View style={styles.stat}>
                    <Text style={styles.statLabel}>Street lights</Text>
                    <Text style={styles.statValue}>{safestRoute.lighting_status}</Text>
                </View>
                <View style={styles.stat}>
                    <Text style={styles.statLabel}>Time</Text>
                    <Text style={styles.statValue}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
            </View>

            <Pressable
                style={({ pressed }) => [
                    styles.sosButton,
                    pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
                ]}
                onLongPress={triggerSOS}
                delayLongPress={3000} // 3 seconds long press as requested
            >
                <Text style={styles.sosText}>! Emergency SOS</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    headerTime: {
        fontSize: 14,
        color: '#666',
        marginLeft: 4,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        marginBottom: 24,
    },
    stat: {
        alignItems: 'flex-start',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    sosButton: {
        backgroundColor: '#E53935',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sosText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    }
});
