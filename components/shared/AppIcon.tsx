import {
  IconHome, IconShoppingCart, IconPackage, IconClipboardList,
  IconChartBar, IconUser, IconCalendar, IconTag, IconUsers,
  IconPrinter, IconBuildingStore, IconMenu2, IconCash,
  IconQrcode, IconBuildingBank, IconPencil, IconTrash,
  IconX, IconChevronDown, IconCheck,
} from '@tabler/icons-react-native';

export const ICONS = {
  dashboard: IconHome,
  pos: IconShoppingCart,
  stok: IconPackage,
  riwayat: IconClipboardList,
  laporan: IconChartBar,
  profil: IconUser,
  rekapBulanan: IconCalendar,
  kategori: IconTag,
  kasir: IconUsers,
  printer: IconPrinter,
  infoToko: IconBuildingStore,
  menu: IconMenu2,
  cash: IconCash,
  qris: IconQrcode,
  transfer: IconBuildingBank,
  edit: IconPencil,
  hapus: IconTrash,
  tutup: IconX,
  chevronDown: IconChevronDown,
  check: IconCheck,
};

export type IconName = keyof typeof ICONS;

interface Props {
  name: IconName;
  size?: number;
  color?: string;
}

export default function AppIcon({ name, size = 22, color = '#1A1D1E' }: Props) {
  const Icon = ICONS[name];
  return <Icon size={size} color={color} />;
}
