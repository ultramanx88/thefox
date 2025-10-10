import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { authorizedFetch } from '../../src/utils/authFetch';

type Assignment = {
  id: string;
  total_cents: number;
  currency: string;
  status: string;
  created_at: string;
};

const API_BASE = (global as any).API_BASE_URL || 'http://localhost:3000';

export default function AssignmentsScreen() {
  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [vendorId, setVendorId] = useState('');

  const reload = async () => {
    setLoading(true);
    try {
      const res = await authorizedFetch(`/worker/assignments`);
      if (res.status === 401) {
        Alert.alert('ต้องเข้าสู่ระบบ', 'โปรดเข้าสู่ระบบก่อนใช้งานแท็บนี้');
        setItems([]);
      } else if (res.ok) {
        setItems(await res.json());
      } else {
        Alert.alert('เกิดข้อผิดพลาด', 'โหลดงานไม่สำเร็จ');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const markPacked = async (id: string) => {
    try {
      const res = await authorizedFetch(`/worker/assignments/${id}/packed`, { method: 'POST' });
      if (!res.ok) throw new Error('ไม่สามารถยืนยันได้');
      Alert.alert('สำเร็จ', 'ยืนยันจัดเสร็จแล้ว');
      reload();
    } catch (e: any) {
      Alert.alert('ผิดพลาด', e?.message || 'เกิดข้อผิดพลาด');
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 8 }}>งานที่ได้รับมอบหมาย</Text>
      <FlatList
        refreshing={loading}
        onRefresh={reload}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontWeight: '600' }}>Order #{item.id}</Text>
              <Text style={{ color: '#666' }}>สถานะ: {item.status}</Text>
              <Text>ยอดรวม {(item.total_cents/100).toFixed(2)} {item.currency}</Text>
            </View>
            <TouchableOpacity onPress={() => markPacked(item.id)} style={{ backgroundColor: 'black', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 }}>
              <Text style={{ color: 'white' }}>ยืนยันจัดเสร็จ</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={!loading ? <Text style={{ color: '#888' }}>ไม่มีงาน</Text> : null}
      />
    </View>
  );
}


