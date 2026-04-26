import { View, StyleSheet, TextInput, Pressable, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface LocationSearchProps {
    source: string;
    destination: string;
    onSourceChange: (val: string) => void;
    onDestinationChange: (val: string) => void;
    onSubmit: () => void;
    onUseCurrentLocation: () => void;
}

export default function LocationSearch({ 
    source, 
    destination, 
    onSourceChange, 
    onDestinationChange, 
    onSubmit,
    onUseCurrentLocation 
}: LocationSearchProps) {
    return (
        <View style={styles.container}>
            <View style={styles.inputWrapper}>
                <TextInput
                    style={styles.startLocation}
                    placeholder="Enter start location..."
                    onChangeText={onSourceChange}
                    value={source}
                />
                <Pressable onPress={onUseCurrentLocation} style={styles.currentLocationBtn}>
                    <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#6366f1" />
                </Pressable>
            </View>
            
            <TextInput
                style={styles.destination}
                placeholder="Enter destination..."
                onChangeText={onDestinationChange}
                value={destination}
            />
            <Pressable onPress={onSubmit} style={styles.btn}>
                <Text style={styles.btnText}>Calculate Safety Route</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 50,
        width: '100%',
        alignItems: 'center',
        zIndex: 10,
    },
    inputWrapper: {
        width: '90%',
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    startLocation: {
        flex: 1,
        padding: 15,
        paddingRight: 50,
        backgroundColor: 'white',
        borderRadius: 12,
        height: 55,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    currentLocationBtn: {
        position: 'absolute',
        right: 15,
        height: '100%',
        justifyContent: 'center',
        zIndex: 15,
    },
    destination: {
        width: '90%',
        padding: 15,
        backgroundColor: 'white',
        borderRadius: 12,
        height: 55,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        marginBottom: 10,
    },
    btn: {
        width: '90%',
        backgroundColor: '#6366f1',
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
});
