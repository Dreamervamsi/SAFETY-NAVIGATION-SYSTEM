import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRef, useState, useEffect } from 'react';
import MapView from 'react-native-maps';
import * as Location from 'expo-location';
import LocationSearch from '../components/Search/LocationSearch';
import RouteMap, { ScoredRoute } from '../components/Map/RouteMap';
import SafetyLegend from '../components/Legend/SafetyLegend';
import RouteList from '../components/RouteInfo/RouteList';
import FakeCallManager, { FakeCallManagerHandle } from '../components/FakeCall/FakeCallManager';
import { Pressable, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EmergencyContactModal from '../components/ui/EmergencyContactModal';
import { API_URL } from '../constants/Config';

type Coord = {
    latitude: number,
    longitude: number
}

export default function App() {
    const [startCoord, setStartCoord] = useState<Coord>();
    const [destCoord, setDestCoord] = useState<Coord>();
    const [source, setSource] = useState<string>('');
    const [destination, setDestination] = useState<string>('');
    const [routes, setRoutes] = useState<ScoredRoute[]>([]);
    const [loading, setLoading] = useState(false);
    const [isContactModalVisible, setIsContactModalVisible] = useState(false);
    const [emergencyContact, setEmergencyContact] = useState<string | null>(null);

    const mapRef = useRef<MapView>(null);
    const fakeCallRef = useRef<FakeCallManagerHandle>(null);

    useEffect(() => {
        const checkEmergencyContact = async () => {
            const savedPhone = await AsyncStorage.getItem('@emergency_contact_phone');
            if (!savedPhone) {
                setIsContactModalVisible(true);
            } else {
                setEmergencyContact(savedPhone);
            }
        };
        checkEmergencyContact();
    }, []);

    const getCoordinates = async (place: string): Promise<Coord | undefined> => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`,
                {
                    headers: {
                        'User-Agent': 'my-react-native-app',
                    },
                }
            );

            const data = await res.json();

            if (Array.isArray(data) && data.length > 0) {
                return {
                    latitude: parseFloat(data[0].lat),
                    longitude: parseFloat(data[0].lon),
                };
            }

            return undefined;
        } catch (error) {
            console.error("Geocoding error:", error);
            return undefined;
        }
    };

    function fitMap() {
        if (!startCoord || !destCoord) return;

        let allCoords: Coord[] = [startCoord, destCoord];

        if (routes.length > 0) {
            routes.forEach(route => {
                route.geometry.coordinates.forEach(coord => {
                    allCoords.push({
                        latitude: coord[1],
                        longitude: coord[0]
                    });
                });
            });
        }

        mapRef.current?.fitToCoordinates(
            allCoords,
            {
                edgePadding: {
                    top: 100,
                    right: 50,
                    bottom: 300,
                    left: 50
                },
                animated: true
            }
        )
    }

    useEffect(() => {
        if (startCoord && destCoord) {
            fitMap();
        }
    }, [startCoord, destCoord, routes]);

    async function submitLocation() {
        if (!source || !destination) {
            Alert.alert("Error", "Please enter both source and destination.");
            return;
        }

        setLoading(true);
        try {
            let sCoord = startCoord;
            let dCoord = destCoord;

            if (!sCoord) sCoord = await getCoordinates(source);
            if (!dCoord) dCoord = await getCoordinates(destination);

            if (sCoord && dCoord) {
                setStartCoord(sCoord);
                setDestCoord(dCoord);

                const startStr = `${sCoord.longitude},${sCoord.latitude}`;
                const destStr = `${dCoord.longitude},${dCoord.latitude}`;

                const backendUrl = `${API_URL}/score-route?start_coords=${startStr}&end_coords=${destStr}`;

                const res = await fetch(backendUrl);

                if (!res.ok) {
                    throw new Error("Failed to fetch routes");
                }

                const data = await res.json();
                setRoutes(data);
            } else {
                Alert.alert("Error", "Could not find coordinates for the given locations.");
            }
        } catch (err) {
            console.error("Error fetching routes:", err);
            Alert.alert("Backend Error", "Could not fetch routes from the backend. Make sure your local IP is correct.");
        } finally {
            setLoading(false);
        }
    }

    async function handleUseCurrentLocation() {
        setLoading(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission denied', 'Permission to access location was denied');
                setLoading(false);
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            const currentCoord = { latitude, longitude };
            setStartCoord(currentCoord);

            const reverseGeocode = await Location.reverseGeocodeAsync(currentCoord);
            if (reverseGeocode.length > 0) {
                const address = reverseGeocode[0];
                const readableAddress = [address.street, address.city, address.region]
                    .filter(Boolean)
                    .join(', ');
                setSource(readableAddress || "Current Location");
            } else {
                setSource("Current Location");
            }
        } catch (error) {
            console.error("Location error:", error);
            Alert.alert("Error", "Could not fetch current location.");
        } finally {
            setLoading(false);
        }
    }

    const triggerFakeCall = () => {
        fakeCallRef.current?.triggerCall("Protective Friend");
    };

    return (
        <View style={styles.container}>
            <LocationSearch
                source={source}
                destination={destination}
                onSourceChange={(val) => {
                    setSource(val);
                    setStartCoord(undefined);
                    if (routes.length > 0) setRoutes([]);
                }}
                onDestinationChange={(val) => {
                    setDestination(val);
                    setDestCoord(undefined);
                    if (routes.length > 0) setRoutes([]);
                }}
                onSubmit={submitLocation}
                onUseCurrentLocation={handleUseCurrentLocation}
            />

            <Pressable
                style={styles.settingsBtn}
                onPress={() => setIsContactModalVisible(true)}
            >
                <MaterialCommunityIcons name="account-cog" size={24} color="#6366f1" />
            </Pressable>

            <View style={styles.mapContainer}>
                <RouteMap
                    mapRef={mapRef}
                    startCoord={startCoord}
                    destCoord={destCoord}
                    source={source}
                    destination={destination}
                    routes={routes}
                />

                {routes.length > 0 && <SafetyLegend />}

                <Pressable
                    onPress={triggerFakeCall}
                    style={styles.fakeCallFab}
                >
                    <MaterialCommunityIcons name="phone-alert" size={28} color="white" />
                </Pressable>

                <FakeCallManager
                    ref={fakeCallRef}
                    backendUrl={API_URL}
                />

                <EmergencyContactModal
                    visible={isContactModalVisible}
                    onClose={() => setIsContactModalVisible(false)}
                    onSave={(phone) => setEmergencyContact(phone)}
                />
            </View>

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#6366f1" />
                </View>
            )}

            {routes.length > 0 && (
                <View style={styles.bottomSheetContainer}>
                    <RouteList routes={routes} />
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    bottomSheetContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50,
    },
    fakeCallFab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 65,
        height: 65,
        borderRadius: 32.5,
        backgroundColor: '#ff3b30',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
        zIndex: 40,
    },
    settingsBtn: {
        position: 'absolute',
        top: 60,
        right: 25,
        backgroundColor: 'white',
        width: 45,
        height: 45,
        borderRadius: 22.5,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 100,
    }
});