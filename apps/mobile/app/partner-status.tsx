import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { authorizedFetch } from '../src/utils/authFetch';

const API_BASE = (global as any).API_BASE_URL || 'http://localhost:3000';

export default function PartnerStatusScreen() {
  const [nationalId, setNationalId] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    setLoading(true);
    const res = await authorizedFetch(`/partner/status?nationalId=${encodeURIComponent(nationalId)}`);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 8 }}>สถานะใบสมัครพาร์ทเนอร์</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <TextInput placeholder='เลขบัตรประชาชน' value={nationalId} onChangeText={setNationalId} style={{ flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12 }} />
        <TouchableOpacity onPress={search} style={{ backgroundColor: 'black', paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center' }}>
          <Text style={{ color: 'white' }}>{loading ? '...' : 'ค้นหา'}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 8 }}>
            <Text style={{ fontWeight: '600' }}>{item.full_name} — {item.vehicle_type}</Text>
            <Text>สถานะ: {item.status}</Text>
            <Text style={{ color: '#666' }}>ส่งเมื่อ {new Date(item.submitted_at).toLocaleString()}</Text>
          </View>
        )}
        ListEmptyComponent={!loading ? <Text style={{ color: '#888' }}>ไม่พบข้อมูล</Text> : null}
      />
    </View>
  );
}


