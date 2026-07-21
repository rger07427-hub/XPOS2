import { Tabs } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useCartStore } from '../../store/useCartStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon, { IconName } from '../../components/shared/AppIcon';

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return <AppIcon name={name} size={22} color={focused ? Colors.primary : Colors.gray[400]} />;
}

export default function KasirLayout() {
  const totalItems = useCartStore((s) => s.getTotalItems());
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray[400],
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopWidth: 1,
          borderTopColor: Colors.gray[100],
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="pos"
        options={{
          title: totalItems > 0 ? `POS (${totalItems})` : 'POS',
          tabBarIcon: ({ focused }) => <TabIcon name="pos" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Riwayat',
          tabBarIcon: ({ focused }) => <TabIcon name="riwayat" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="printer-settings"
        options={{
          title: 'Printer',
          tabBarIcon: ({ focused }) => <TabIcon name="printer" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => <TabIcon name="profil" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
