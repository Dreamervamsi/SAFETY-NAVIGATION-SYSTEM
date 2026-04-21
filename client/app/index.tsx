import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import { View, StyleSheet, TextInput, Pressable, Text } from 'react-native';
import { useEffect, useRef, useState } from 'react';

const INITIAL_REGION: Region = {
    latitude: 16.0171,
    longitude: 80.0685,
    latitudeDelta: 0.08,
    longitudeDelta: 0.02
}
type location = {
    latitude: number,
    longitude: number
}

export default function App() {
    const [startCoord, setStartCoord] = useState<location>();
    const [destCoord, setDestCoord] = useState<location>();
    const [source, setSource] = useState<string>('');
    const [destination, setDestination] = useState<string>('');

    const fitLoc = useRef<MapView>(null);

    const getCoordinates = async (place: string) => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`,
                {
                    headers: {
                        'User-Agent': 'my-react-native-app',
                    },
                }
            );

            const text = await res.text();
            const data = JSON.parse(text);

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
        fitLoc.current?.fitToCoordinates(
            [startCoord, destCoord],
            {
                edgePadding: {
                    top: 100,
                    right: 100,
                    bottom: 100,
                    left: 100
                },
                animated: true
            }
        )
    }
    useEffect(() => {
        if (startCoord && destCoord) {
            fitMap();
        }
    }, [startCoord, destCoord]);

    async function submitLocation() {
        const sCoord = await getCoordinates(source);
        const dCoord = await getCoordinates(destination);

        if (sCoord && dCoord) {
            setStartCoord(sCoord);
            setDestCoord(dCoord);
        }
    }
    return (
        <>
            <View
                style={styles.container}
            >
                <TextInput
                    style={styles.startLocation}
                    placeholder="Enter start location..."
                    onChangeText={(value) => setSource(value)}
                    value={source}
                />
                <TextInput
                    style={styles.destination}
                    placeholder="Enter destination..."
                    onChangeText={(value) => setDestination(value)}
                    value={destination}
                />
                <Pressable onPress={submitLocation} style={styles.btn}>
                    <Text style={styles.btnText}>Calculate Safety Route</Text>
                </Pressable>
                {/* Map */}
                <MapView
                    ref={fitLoc}
                    style={styles.map}
                    initialRegion={INITIAL_REGION}
                >
                    {startCoord && destCoord && (
                        <Polyline
                            coordinates={[startCoord, destCoord]}
                            strokeColor='#6366f1'
                            strokeWidth={4}
                        />
                    )}

                    {startCoord && (
                        <Marker
                            pinColor='blue'
                            coordinate={startCoord}
                            title='Start Location'
                        />
                    )}

                    {destCoord && (
                        <Marker
                            pinColor='red'
                            coordinate={destCoord}
                            title='Destination'
                        />
                    )}
                </MapView>
            </View>
        </>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    startLocation: {
        width: '90%',
        position: 'absolute',
        top: 50,
        alignSelf: 'center',
        padding: 15,
        zIndex: 10,
        backgroundColor: 'white',
        borderRadius: 12,
        height: 55,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    destination: {
        width: '90%',
        position: 'absolute',
        top: 115,
        alignSelf: 'center',
        padding: 15,
        zIndex: 10,
        backgroundColor: 'white',
        borderRadius: 12,
        height: 55,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    btn: {
        zIndex: 10,
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        width: '90%',
        backgroundColor: '#6366f1', // Modern Indigo
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    btnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    }
})