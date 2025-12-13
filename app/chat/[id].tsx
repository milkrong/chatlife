import { View, Text, TextInput, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

type Message = Database['public']['Tables']['messages']['Row'];
type Character = Database['public']['Tables']['characters']['Row'];

export default function ChatRoom() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [character, setCharacter] = useState<Character | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!id) return;
    fetchCharacter();
    fetchMessages();

    const channel = supabase
      .channel('chat_room')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `character_id=eq.${id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [newMessage, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const fetchCharacter = async () => {
    const { data } = await supabase.from('characters').select('*').eq('id', id).single();
    if (data) setCharacter(data);
  };

  const fetchMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('character_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) setMessages(data);
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !id) return;

    const text = inputText.trim();
    setInputText('');

    // Optimistic update? Maybe not needed with realtime, but feels faster.
    // Let's rely on realtime for simplicity or add local generic message.

    const { error } = await supabase.from('messages').insert({
      user_id: user.id,
      character_id: id,
      sender: 'user',
      content: text,
    });

    if (error) console.error(error);
    
    // Trigger AI response (this should be done by Database Webhook or Edge Function)
    // For now, we will assume the Edge Function is triggered by the INSERT
    // But since I haven't set up the trigger yet, I might call it manually here for the prototype 
    // IF I can't set up Database Webhooks easily via Migration.
    // Actually, I'll set up the Edge Function to be called directly or via Database Webhook.
    // Calling it directly from client is insecure/bad pattern but easier for this prototype without full webhook setup.
    // Better: Client calls RPC or Edge Function "chat" which inserts message AND generates reply.
    
    // Let's go with: Client inserts User Message -> Edge Function (Webhook) -> AI Reply.
    // But since I cannot easily configure Supabase Database Webhooks via SQL (requires pg_net or dashboard UI usually),
    // I will call the Edge Function explicitly here.
    
    await supabase.functions.invoke('chat-completion', {
      body: { 
        message_content: text, 
        character_id: id, 
        user_id: user.id 
      }
    });
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View className={`flex-row ${isUser ? 'justify-end' : 'justify-start'} mb-4 px-4`}>
        <View 
          className={`max-w-[80%] p-3 rounded-2xl ${
            isUser ? 'bg-blue-500 rounded-tr-none' : 'bg-gray-200 dark:bg-gray-700 rounded-tl-none'
          }`}
        >
          <Text className={`${isUser ? 'text-white' : 'text-black dark:text-white'}`}>
            {item.content}
          </Text>
          {/* Debug: Show thought process if available and needed */}
          {/* {item.thinking_process && <Text className="text-xs text-gray-400 mt-1">{item.thinking_process}</Text>} */}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={['bottom']}>
      <Stack.Screen options={{ title: character?.name || 'Chat' }} />
      
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        inverted
        className="flex-1"
        contentContainerStyle={{ paddingVertical: 16 }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        className="border-t border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-black"
      >
        <View className="flex-row items-center">
          <TextInput
            className="flex-1 bg-gray-100 dark:bg-gray-800 text-black dark:text-white rounded-full px-4 py-2 mr-2"
            placeholder="Type a message..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity onPress={sendMessage} className="bg-blue-500 rounded-full p-2 w-10 h-10 items-center justify-center">
            <Text className="text-white font-bold">→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

