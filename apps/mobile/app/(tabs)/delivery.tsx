import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, Modal, Platform, Switch, Text, TouchableOpacity, View, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera, CameraType } from 'expo-camera';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { authorizedFetch } from '@/utils/authFetch';
import { useDriverSocket } from '@/hooks/useSocket';

const STORAGE_KEYS = {
  availability: 'driver_availability',
};

type AvailabilityState = {
  isOnline: boolean;
  verifiedAt?: string; // ISO string when the current session verification happened
};

type Offer = {
  id: string;
  price_cents: number;
  currency: string;
  distance_km: number;
  eta_min: number;
  pickup: { name?: string; lat: number; lng: number; address?: string };
  dropoff: { name?: string; lat: number; lng: number; address?: string };
};

export default function DeliveryTab() {
  const [availability, setAvailability] = useState<AvailabilityState>({ isOnline: false });
  const [loading, setLoading] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [cameraPermission, requestCameraPermission] = Camera.useCameraPermissions();
  const cameraRef = useRef<Camera | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);
  
  // Use Socket.IO instead of polling
  const { 
    socket, 
    isConnected, 
    offers, 
    currentJob, 
    joinDriverRoom, 
    leaveDriverRoom, 
    acceptOffer: socketAcceptOffer, 
    declineOffer: socketDeclineOffer,
    sendLocationUpdate 
  } = useDriverSocket();

  // Load saved availability
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.availability);
        if (raw) {
          const parsed: AvailabilityState = JSON.parse(raw);
          setAvailability(parsed);
        }
      } catch {}
    })();
  }, []);

  // Persist on change
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.availability, JSON.stringify(availability));
      } catch {}
    })();
  }, [availability]);

  const ensureLocationPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('ต้องการสิทธิ์ตำแหน่ง', 'โปรดอนุญาตการเข้าถึงตำแหน่งเพื่อเปิดรับงาน');
      return false;
    }
    return true;
  }, []);

  const handleToggle = useCallback(async (nextOnline: boolean) => {
    if (loading) return;
    if (!nextOnline) {
      setAvailability({ isOnline: false });
      // Leave driver room and unsubscribe push
      try {
        if (pushToken) {
          await authorizedFetch('/driver/push', {
            method: 'DELETE',
            body: JSON.stringify({ token: pushToken }),
          });
        }
        await authorizedFetch('/driver/availability', {
          method: 'POST',
          body: JSON.stringify({ online: false }),
        });
        // Leave Socket.IO room
        leaveDriverRoom('driver_123'); // Replace with actual driver ID
      } catch {}
      return;
    }

    setLoading(true);
    try {
      const okLocation = await ensureLocationPermission();
      if (!okLocation) {
        setLoading(false);
        return;
      }

      // Require one-time face verification each time going online
      if (!cameraPermission || cameraPermission.status !== 'granted') {
        const perm = await requestCameraPermission();
        if (!perm.granted) {
          Alert.alert('ต้องการสิทธิ์กล้อง', 'โปรดยินยอมให้ใช้กล้องเพื่อยืนยันตัวตน');
          setLoading(false);
          return;
        }
      }

      setShowVerifyModal(true);
    } finally {
      // actual state update happens after verification success
    }
  }, [loading, cameraPermission, requestCameraPermission, ensureLocationPermission]);

  const onVerifySuccess = useCallback(() => {
    setShowVerifyModal(false);
    (async () => {
      try {
        // Register push token
        const token = await registerForPushNotificationsAsync();
        if (token) {
          setPushToken(token);
          await authorizedFetch('/driver/push', {
            method: 'POST',
            body: JSON.stringify({ token }),
          });
        }
        // Inform backend availability + verified
        await authorizedFetch('/driver/availability', {
          method: 'POST',
          body: JSON.stringify({ online: true, verified: true }),
        });
        // Join Socket.IO room for real-time updates
        joinDriverRoom('driver_123'); // Replace with actual driver ID
      } catch {}
      setAvailability({ isOnline: true, verifiedAt: new Date().toISOString() });
      setLoading(false);
      Alert.alert('พร้อมรับงาน', 'คุณได้เปิดระบบรับงานเรียบร้อยแล้ว');
    })();
  }, [joinDriverRoom]);

  const onVerifyCancel = useCallback(() => {
    setShowVerifyModal(false);
    setLoading(false);
  }, []);

  // Socket.IO handles real-time updates, no need for polling

  const acceptOffer = useCallback(async (offerId: string) => {
    try {
      // Use Socket.IO for real-time communication
      socketAcceptOffer(offerId);
      Alert.alert('รับงานแล้ว', 'โปรดเริ่มเดินทางไปยังจุดรับ');
    } catch (e: any) {
      Alert.alert('ผิดพลาด', e?.message || 'เกิดข้อผิดพลาด');
    }
  }, [socketAcceptOffer]);

  const declineOffer = useCallback(async (offerId: string) => {
    try {
      // Use Socket.IO for real-time communication
      socketDeclineOffer(offerId);
    } catch (e: any) {
      Alert.alert('ผิดพลาด', e?.message || 'เกิดข้อผิดพลาด');
    }
  }, [socketDeclineOffer]);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 12 }}>Delivery</Text>

      {/* Socket.IO Connection Status */}
      <View style={{ padding: 12, backgroundColor: isConnected ? '#d4edda' : '#f8d7da', borderRadius: 8, marginBottom: 16 }}>
        <Text style={{ color: isConnected ? '#155724' : '#721c24', fontWeight: '600' }}>
          Socket.IO: {isConnected ? 'เชื่อมต่อแล้ว' : 'ไม่เชื่อมต่อ'}
        </Text>
      </View>

      <View style={{ padding: 16, borderWidth: 1, borderColor: '#ddd', borderRadius: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ fontSize: 16, fontWeight: '600' }}>สถานะรับงาน</Text>
          <Text style={{ color: '#666', marginTop: 4 }}>{availability.isOnline ? 'ออนไลน์ (พร้อมรับงาน)' : 'ออฟไลน์'}</Text>
        </View>
        <Switch
          value={availability.isOnline}
          onValueChange={handleToggle}
          disabled={loading}
          trackColor={{ false: '#ccc', true: '#ffb199' }}
          thumbColor={availability.isOnline ? '#ff6b35' : '#f4f3f4'}
        />
      </View>

      {availability.isOnline ? (
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '600', marginBottom: 8 }}>ข้อเสนอใกล้คุณ (≤ 2 กม.)</Text>
          <FlatList
            data={offers}
            keyExtractor={(it) => it.id}
            refreshing={false}
            ListEmptyComponent={<Text style={{ color: '#666' }}>ยังไม่มีข้อเสนอ</Text>}
            renderItem={({ item }) => (
              <View style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                <Text style={{ fontWeight: '600' }}>ราคา {(item.price_cents/100).toFixed(2)} {item.currency}</Text>
                <Text style={{ color: '#666' }}>ระยะทาง {item.distance_km.toFixed(1)} กม. • ETA ~{item.eta_min} นาที</Text>
                <View style={{ marginTop: 8 }}>
                  <Text>รับ: {item.pickup.name || item.pickup.address || `${item.pickup.lat},${item.pickup.lng}`}</Text>
                  <Text>ส่ง: {item.dropoff.name || item.dropoff.address || `${item.dropoff.lat},${item.dropoff.lng}`}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                  <TouchableOpacity onPress={() => openMaps(item.pickup.lat, item.pickup.lng)} style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#ddd' }}>
                    <Text>นำทางไปจุดรับ</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => acceptOffer(item.id)} style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#0a7' }}>
                    <Text style={{ color: 'white' }}>รับงาน</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => declineOffer(item.id)} style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#c33' }}>
                    <Text style={{ color: 'white' }}>ปฏิเสธ</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => openMaps(item.dropoff.lat, item.dropoff.lng)} style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#ddd' }}>
                    <Text>ไปจุดส่ง</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>
      ) : (
        <View style={{ padding: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 8 }}>
          <Text style={{ color: '#666' }}>สลับสวิตช์เพื่อเปิดรับงาน และยืนยันตัวตนด้วยใบหน้าเพียงครั้งเดียวต่อการเปิดใช้งาน</Text>
        </View>
      )}

      <Modal visible={showVerifyModal} animationType="slide" onRequestClose={onVerifyCancel}>
        <View style={{ flex: 1, backgroundColor: 'black' }}>
          <View style={{ flex: 1 }}>
            <Camera
              ref={(r) => (cameraRef.current = r)}
              style={{ flex: 1 }}
              type={CameraType.front}
              ratio={Platform.OS === 'android' ? '16:9' : undefined}
            />
          </View>
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <Text style={{ color: 'white', fontSize: 16, marginBottom: 12 }}>ยืนยันตัวตนด้วยใบหน้า</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity onPress={onVerifyCancel} style={{ paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#666', borderRadius: 8 }}>
                <Text style={{ color: 'white' }}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onVerifySuccess} style={{ paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#ff6b35', borderRadius: 8 }}>
                <Text style={{ color: 'white' }}>ยืนยัน</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return null;
    }
    const token = await Notifications.getExpoPushTokenAsync();
    // token format: { data: 'ExponentPushToken[xxxx]' } in SDKs < 51; SDK 51 returns string
    // Normalize
    // @ts-expect-error SDK differences
    return (token?.data as string) || (token as unknown as string) || null;
  } catch {
    return null;
  }
}

function openMaps(lat: number, lng: number) {
  const scheme = Platform.select({ ios: 'maps://', android: 'geo:' });
  const latlng = `${lat},${lng}`;
  const url = Platform.select({
    ios: `http://maps.apple.com/?daddr=${lat},${lng}`,
    android: `geo:${latlng}?q=${latlng}`,
  });
  if (url) Linking.openURL(url).catch(() => {});
}

// Socket.IO handles real-time offer updates



