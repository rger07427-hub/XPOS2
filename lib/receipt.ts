import { Transaction, TransactionItem } from '../types';
import { connectPrinter } from './printer';
import { usePrinterStore } from '../store/usePrinterStore';
import { useStoreSettingsStore } from '../store/useStoreSettingsStore';

const LINE_WIDTH = 32;
const ESC = '\x1B';

function center(text: string): string {
  const padding = Math.max(0, Math.floor((LINE_WIDTH - text.length) / 2));
  return ' '.repeat(padding) + text;
}

function line(char: string = '-'): string {
  return char.repeat(LINE_WIDTH) + '\n';
}

function twoColumns(left: string, right: string): string {
  const space = LINE_WIDTH - left.length - right.length;
  if (space < 1) {
    // Kalau kepanjangan, potong kiri
    const trimmedLeft = left.slice(0, LINE_WIDTH - right.length - 1);
    return trimmedLeft + ' '.repeat(LINE_WIDTH - trimmedLeft.length - right.length) + right + '\n';
  }
  return left + ' '.repeat(space) + right + '\n';
}

function formatRupiah(value: number): string {
  return 'Rp' + value.toLocaleString('id-ID');
}

export function buildReceiptText(
  transaction: Transaction,
  items: TransactionItem[]
): string {
  const storeInfo = useStoreSettingsStore.getState().settings;
  let text = '';

  text += center(storeInfo.name) + '\n';
  if (storeInfo.address) text += center(storeInfo.address) + '\n';
  if (storeInfo.phone) text += center(storeInfo.phone) + '\n';
  text += line('=');

  const date = new Date(transaction.created_at);
  text += `${date.toLocaleDateString('id-ID')} ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}\n`;
  text += `No: ${transaction.id.slice(-8).toUpperCase()}\n`;
  text += `Kasir: ${transaction.cashier?.full_name ?? '-'}\n`;
  text += line('-');

  items.forEach((item) => {
    text += item.product_name.slice(0, LINE_WIDTH) + '\n';
    const qtyPrice = `${item.quantity} x ${formatRupiah(item.price_at_sale)}`;
    const subtotal = formatRupiah(item.price_at_sale * item.quantity);
    text += twoColumns(qtyPrice, subtotal);
  });

  text += line('-');
  text += twoColumns('TOTAL', formatRupiah(transaction.total));

  const methodLabel =
    transaction.payment_method === 'cash' ? 'Tunai' :
    transaction.payment_method === 'qris' ? 'QRIS' : 'Transfer';
  text += twoColumns('Metode', methodLabel);

  if (transaction.payment_method === 'cash') {
    text += twoColumns('Dibayar', formatRupiah(transaction.paid_amount ?? 0));
    text += twoColumns('Kembali', formatRupiah(transaction.change_amount ?? 0));
  }

  text += line('=');
  text += center('Terima Kasih') + '\n';
  text += center('Barang yang sudah dibeli') + '\n';
  text += center('tidak dapat dikembalikan') + '\n';
  text += '\n\n\n';

  return text;
}

export async function printTransactionReceipt(
  transaction: Transaction,
  items: TransactionItem[]
): Promise<{ success: boolean; message: string }> {
  const { deviceAddress } = usePrinterStore.getState();

  if (!deviceAddress) {
    return {
      success: false,
      message: 'Printer belum diatur. Atur dulu di halaman Profil.',
    };
  }

  try {
    const device = await connectPrinter(deviceAddress);
    const receiptText = buildReceiptText(transaction, items);
    await device.write(receiptText, 'ascii');
    usePrinterStore.getState().setConnected(true);
    return { success: true, message: 'Struk berhasil dicetak' };
  } catch (error: any) {
    usePrinterStore.getState().setConnected(false);
    return {
      success: false,
      message: error.message || 'Gagal mencetak, cek koneksi printer',
    };
  }
}

export async function printPlainText(text: string): Promise<{ success: boolean; message: string }> {
  const { deviceAddress } = usePrinterStore.getState();
  if (!deviceAddress) {
    return { success: false, message: 'Printer belum diatur. Atur dulu di halaman Profil.' };
  }
  try {
    const device = await connectPrinter(deviceAddress);
    await device.write(text, 'ascii');
    usePrinterStore.getState().setConnected(true);
    return { success: true, message: 'Laporan berhasil dicetak' };
  } catch (error: any) {
    usePrinterStore.getState().setConnected(false);
    return { success: false, message: error.message || 'Gagal mencetak' };
  }
}

export function buildDailyReportText(summary: any, dateLabel: string): string {
  const storeInfo = useStoreSettingsStore.getState().settings;
  let text = '';
  text += center(storeInfo.name) + '\n';
  text += line('=');
  text += center('LAPORAN HARIAN') + '\n';
  text += center(dateLabel) + '\n';
  text += line('-');
  text += twoColumns('Total Transaksi', String(summary.totalTransactions)) ;
  text += twoColumns('Total Omzet', formatRupiah(summary.totalRevenue));
  text += line('-');
  text += twoColumns('Tunai', formatRupiah(summary.cashTotal));
  text += twoColumns('QRIS', formatRupiah(summary.qrisTotal));
  text += twoColumns('Transfer', formatRupiah(summary.transferTotal));
  text += line('-');
  text += 'PRODUK TERLARIS:\n';
  summary.topProducts.forEach((p: any, i: number) => {
    text += `${i + 1}. ${p.name}\n`;
    text += twoColumns(`   ${p.qty} terjual`, formatRupiah(p.total));
  });
  text += line('=');
  text += '\n\n\n';
  return text;
}

export function buildMonthlyReportText(summary: any, monthLabel: string): string {
  const storeInfo = useStoreSettingsStore.getState().settings;
  let text = '';
  text += center(storeInfo.name) + '\n';
  text += line('=');
  text += center('REKAP BULANAN') + '\n';
  text += center(monthLabel) + '\n';
  text += line('-');
  text += twoColumns('Total Transaksi', String(summary.totalTransactions));
  text += twoColumns('Total Omzet', formatRupiah(summary.totalRevenue));
  text += twoColumns('Rata-rata/hari', formatRupiah(summary.avgPerDay));
  if (summary.bestDay) {
    text += twoColumns('Hari Terbaik', new Date(summary.bestDay.date).toLocaleDateString('id-ID'));
    text += twoColumns('  Omzet Hari Itu', formatRupiah(summary.bestDay.total));
  }
  text += line('-');
  text += 'PRODUK TERLARIS BULAN INI:\n';
  summary.topProducts.forEach((p: any, i: number) => {
    text += `${i + 1}. ${p.name}\n`;
    text += twoColumns(`   ${p.qty} terjual`, formatRupiah(p.total));
  });
  text += line('=');
  text += '\n\n\n';
  return text;
}
