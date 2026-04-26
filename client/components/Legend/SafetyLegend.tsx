import { View, Text, StyleSheet } from 'react-native';

export default function SafetyLegend() {
    return (
        <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: '#2E7D32' }]} />
                <Text style={styles.legendText}>Safe</Text>
            </View>
            <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: '#F57F17' }]} />
                <Text style={styles.legendText}>Caution</Text>
            </View>
            <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: '#D32F2F' }]} />
                <Text style={styles.legendText}>Avoid</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    legendContainer: {
        position: 'absolute',
        bottom: 10,
        alignSelf: 'center',
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        gap: 16,
        zIndex: 5,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#333',
    }
});
