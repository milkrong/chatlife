import { Text, View } from '@/components/Themed';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Image, TouchableOpacity } from 'react-native';

type UserCharacter = Database['public']['Tables']['user_characters']['Row'] & {
  characters: Database['public']['Tables']['characters']['Row'];
};

export default function ChatListScreen() {
  const [characters, setCharacters] = useState<UserCharacter[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Ensure we have some characters if list is empty (e.g. new user)
    // This is a simple heuristic for the prototype
    const { data, error } = await supabase
      .from('user_characters')
      .select('*, characters(*)')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (data && data.length > 0) {
      setCharacters(data as any);
    } else {
      // If no characters, maybe try to unlock initial ones (Mom/Dad)
      // For now, we just rely on the "Game Loop" or manual trigger,
      // but let's auto-unlock Mom/Dad if not present for demo.
      await unlockInitialCharacters(user.id);
    }
  };

  const unlockInitialCharacters = async (userId: string) => {
    const { data: mom } = await supabase
      .from('characters')
      .select('*')
      .eq('name', 'Mom')
      .single();
    if (mom) {
      await supabase
        .from('user_characters')
        .insert({ user_id: userId, character_id: mom.id })
        .ignore();
    }
    const { data: dad } = await supabase
      .from('characters')
      .select('*')
      .eq('name', 'Dad')
      .single();
    if (dad) {
      await supabase
        .from('user_characters')
        .insert({ user_id: userId, character_id: dad.id })
        .ignore();
    }

    // Refetch
    const { data } = await supabase
      .from('user_characters')
      .select('*, characters(*)')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (data) setCharacters(data as any);
  };

  const renderItem = ({ item }: { item: UserCharacter }) => (
    <TouchableOpacity
      className="flex-row items-center p-4 border-b border-gray-200 bg-white dark:bg-black dark:border-gray-800"
      onPress={() => router.push(`/chat/${item.character_id}`)}
    >
      <View className="w-12 h-12 rounded-full bg-gray-300 items-center justify-center overflow-hidden mr-4">
        {item.characters.avatar_url ? (
          <Image
            source={{ uri: item.characters.avatar_url }}
            className="w-full h-full"
          />
        ) : (
          <Text className="text-xl">{item.characters.name[0]}</Text>
        )}
      </View>
      <View className="flex-1">
        <View className="flex-row justify-between mb-1">
          <Text className="font-bold text-lg">{item.characters.name}</Text>
          <Text className="text-gray-500 text-xs">Now</Text>
        </View>
        <Text className="text-gray-500 truncate" numberOfLines={1}>
          {item.memory_summary || 'Start chatting...'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <FlatList
        data={characters}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}
