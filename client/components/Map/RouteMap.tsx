import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import { StyleSheet, View, Text } from 'react-native';
import { RefObject } from 'react';

type Location = {
    latitude: number;
    longitude: number;
};

export type ScoredRoute = {
    score: number;
    color: string;
    status: string;
    description: string;
    nearby_police: string;
    lighting_status: string;
    geometry: {
        coordinates: [number, number][];
    };
    distance_meters: number;
    duration_seconds: number;
};

interface RouteMapProps {
    startCoord?: Location;
    destCoord?: Location;
    source: string;
    destination: string;
    routes: ScoredRoute[];
    mapRef: RefObject<MapView>;
}

const INITIAL_REGION: Region = {
    latitude: 16.0171,
    longitude: 80.0685,
    latitudeDelta: 0.08,
    longitudeDelta: 0.02
};

export default function RouteMap({ startCoord, destCoord, source, destination, routes, mapRef }: RouteMapProps) {
    const safestRoute = routes.length > 0 ? routes[0] : null;

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={INITIAL_REGION}
            >
                {routes.map((route, index) => {
                    const routeCoordinates = route.geometry.coordinates.map(coord => ({
                        latitude: coord[1],
                        longitude: coord[0],
                    }));

                    const isBest = index === 0;

                    return (
                        <Polyline
                            key={`route-${index}-${route.score}`}
                            coordinates={routeCoordinates}
                            strokeColor={isBest ? route.color : `${route.color}80`}
                            strokeWidth={isBest ? 6 : 4}
                            zIndex={isBest ? 10 : routes.length - index}
                            lineJoin="round"
                            lineCap="round"
                        />
                    );
                })}

                {startCoord && (
                    <Marker
                        pinColor='blue'
                        coordinate={startCoord}
                        title={source || "Start"}
                    />
                )}

                {destCoord && (
                    <Marker
                        pinColor='red'
                        coordinate={destCoord}
                        title={destination || "Destination"}
                    />
                )}
            </MapView>

            {safestRoute && (
                <View style={styles.scorePill}>
                    <View style={[styles.pillDot, { backgroundColor: safestRoute.color }]} />
                    <Text style={styles.pillText}>
                        Safe route score: <Text style={styles.boldText}>{safestRoute.score}</Text> / 100
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1, zIndex: 1 },
    scorePill: {
        position: 'absolute',
        top: 20,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 10,
    },
    pillDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    pillText: {
        fontSize: 14,
        color: '#333',
    },
    boldText: {
        fontWeight: 'bold',
    }
});
