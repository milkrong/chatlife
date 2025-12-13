import { FlatList } from 'react-native';
import { useEffect, useState } from 'react';
import { Text, View } from '@/components/Themed';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type LifeEvent = Database['public']['Tables']['life_events']['Row'];

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [events, setEvents] = useState<LifeEvent[]>([]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) setProfile(data);

    const { data: eventData } = await supabase
      .from('life_events')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (eventData) setEvents(eventData);
  };

  return (
    <View className="flex-1 bg-white dark:bg-black p-4">
      <View className="items-center mb-8 mt-4">
        <View className="w-24 h-24 bg-gray-300 rounded-full mb-4" />
        <Text className="text-2xl font-bold">{profile?.full_name || 'Player'}</Text>
        <Text className="text-gray-500">{profile?.age || 0} years old • {profile?.stage || 'Infancy'}</Text>
      </View>

      <Text className="text-xl font-bold mb-4">Life Events</Text>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <Text className="font-bold text-base mb-1">{item.event_type.toUpperCase()}</Text>
            <Text className="text-gray-600 dark:text-gray-300">{item.description}</Text>
            <Text className="text-xs text-gray-400 mt-2">{new Date(item.created_at!).toLocaleDateString()}</Text>
          </View>
        )}
      />
    </View>
  );
}
