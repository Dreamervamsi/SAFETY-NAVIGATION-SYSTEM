import React, { useState, useEffect } from 'react';
import { 
    Modal, 
    View, 
    Text, 
    TextInput, 
    StyleSheet, 
    Pressable, 
    KeyboardAvoidingView, 
    Platform,
    Alert 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface EmergencyContactModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (phone: string) => void;
}

const STORAGE_KEY = '@emergency_contact_phone';

export default function EmergencyContactModal({ visible, onClose, onSave }: EmergencyContactModalProps) {
    const [phone, setPhone] = useState('');

    useEffect(() => {
        const loadPhone = async () => {
            const savedPhone = await AsyncStorage.getItem(STORAGE_KEY);
            if (savedPhone) {
                setPhone(savedPhone);
            }
        };
        if (visible) {
            loadPhone();
        }
    }, [visible]);

    const handleSave = async () => {
        if (!phone || phone.length < 10) {
            Alert.alert('Invalid Number', 'Please enter a valid mobile number.');
            return;
        }

        try {
            await AsyncStorage.setItem(STORAGE_KEY, phone);
            onSave(phone);
            onClose();
        } catch (error) {
            Alert.alert('Error', 'Failed to save the number.');
        }
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.centeredView}
            >
                <View style={styles.modalView}>
                    <View style={styles.iconContainer}>
                        <MaterialCommunityIcons name="shield-alert" size={40} color="#ff3b30" />
                    </View>
                    
                    <Text style={styles.modalTitle}>Emergency Contact</Text>
                    <Text style={styles.modalText}>
                        Please enter the mobile number for your SOS emergency alerts.
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Mobile Number (e.g. +91...)"
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                        placeholderTextColor="#999"
                    />

                    <View style={styles.buttonContainer}>
                        <Pressable
                            style={[styles.button, styles.buttonCancel]}
                            onPress={onClose}
                        >
                            <Text style={styles.textStyleCancel}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.button, styles.buttonSave]}
                            onPress={handleSave}
                        >
                            <Text style={styles.textStyleSave}>Save Contact</Text>
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 10,
    },
    modalText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    input: {
        width: '100%',
        height: 55,
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 18,
        color: '#1a1a1a',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#eee',
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
    button: {
        flex: 1,
        height: 55,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonCancel: {
        backgroundColor: 'transparent',
        marginRight: 8,
    },
    buttonSave: {
        backgroundColor: '#6366f1',
        marginLeft: 8,
    },
    textStyleCancel: {
        color: '#666',
        fontWeight: '600',
        fontSize: 16,
    },
    textStyleSave: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
