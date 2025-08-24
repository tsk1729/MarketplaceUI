import AsyncStorage from '@react-native-async-storage/async-storage';

// Debug function to see all stored items
export const debugStorage = async () => {
    try {
        console.log('🔍 Checking AsyncStorage contents...');
        const allKeys = await AsyncStorage.getAllKeys();
        console.log('📋 All storage keys:', allKeys);

        for (const key of allKeys) {
            const value = await AsyncStorage.getItem(key);
            console.log(`📦 ${key}:`, value);
        }
    } catch (error) {
        console.error('❌ Error reading storage:', error);
    }
};

// Function to store user preferences
export const storeUserPreferences = async (preferences: any) => {
    try {
        await AsyncStorage.setItem('userPreferences', JSON.stringify(preferences));
        console.log('✅ User preferences saved');
    } catch (error) {
        console.error('❌ Error saving preferences:', error);
    }
};

// Function to get user preferences
export const getUserPreferences = async () => {
    try {
        const preferences = await AsyncStorage.getItem('userPreferences');
        return preferences ? JSON.parse(preferences) : null;
    } catch (error) {
        console.error('❌ Error reading preferences:', error);
        return null;
    }
};

// Function to check storage size
export const getStorageSize = async () => {
    try {
        const allKeys = await AsyncStorage.getAllKeys();
        let totalSize = 0;

        for (const key of allKeys) {
            const value = await AsyncStorage.getItem(key);
            if (value) {
                totalSize += value.length;
            }
        }

        console.log(`📊 Total storage size: ${totalSize} bytes`);
        return totalSize;
    } catch (error) {
        console.error('❌ Error calculating storage size:', error);
        return 0;
    }
}; 