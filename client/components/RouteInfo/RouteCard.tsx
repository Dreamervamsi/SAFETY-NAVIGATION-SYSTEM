import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScoredRoute } from '../Map/RouteMap';

interface RouteCardProps {
    route: ScoredRoute;
    title: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    iconColor: string;
    backgroundColor: string;
}

export default function RouteCard({ route, title, icon, iconColor, backgroundColor }: RouteCardProps) {
    const km = (route.distance_meters / 1000).toFixed(1);
    const mins = Math.round(route.duration_seconds / 60);

    return (
        <View style={[styles.card, { backgroundColor }]}>
            <View style={styles.iconContainer}>
                <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>
                    {km} km · {mins} min · {route.description}
                </Text>
            </View>
            <View style={[styles.scoreContainer, { backgroundColor: `${iconColor}20` }]}>
                <Text style={[styles.score, { color: iconColor }]}>{route.score}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    iconContainer: {
        marginRight: 16,
    },
    infoContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    scoreContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        minWidth: 40,
    },
    score: {
        fontSize: 16,
        fontWeight: 'bold',
    }
});
