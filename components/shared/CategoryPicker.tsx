import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Category } from '../../types';
import { Colors } from '../../constants/colors';
import { Radius, Spacing } from '../../constants/theme';
import AppIcon from './AppIcon';

interface Props {
  categories: Category[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  onCategoryCreated: (category: Category) => void;
  error?: string;
}

export default function CategoryPicker({
  categories,
  selected,
  onSelect,
  onCategoryCreated,
  error,
}: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedCategory = categories.find(c => c.id === selected);

  const closeModal = () => {
    setModalVisible(false);
    setShowAddInput(false);
    setNewName('');
  };

  const handleSelect = (id: string) => {
    onSelect(id);
    closeModal();
  };

  const handleSaveNew = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const { data, error: insertError } = await supabase
        .from('categories')
        .insert({ name: newName.trim() })
        .select()
        .single();

      if (insertError) throw insertError;

      onCategoryCreated(data);
      onSelect(data.id);
      closeModal();
    } catch (e: any) {
      Alert.alert(
        'Gagal Menyimpan Kategori',
        e.message || 'Terjadi kesalahan tidak diketahui'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Kategori <Text style={styles.required}>*</Text>
      </Text>

      <TouchableOpacity
        style={[styles.dropdownBtn, error && styles.dropdownBtnError]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={selectedCategory ? styles.dropdownText : styles.dropdownPlaceholder}>
          {selectedCategory ? selectedCategory.name : 'Pilih kategori'}
        </Text>
        <AppIcon name="chevronDown" size={16} color={Colors.textSecondary} />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={closeModal}>
            <View style={styles.overlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.sheet}>
                  <View style={styles.handle} />
                  <Text style={styles.sheetTitle}>Pilih Kategori</Text>

                  <FlatList
                    data={categories}
                    keyExtractor={item => item.id}
                    style={{ maxHeight: 300 }}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.optionRow}
                        onPress={() => handleSelect(item.id)}
                      >
                        <Text style={[
                          styles.optionText,
                          selected === item.id && styles.optionTextActive,
                        ]}>
                          {item.name}
                        </Text>
                        {selected === item.id && (
                          <AppIcon name="check" size={16} color={Colors.primary} />
                        )}
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                      <Text style={styles.emptyText}>Belum ada kategori, buat dulu di bawah</Text>
                    }
                  />

                  {!showAddInput ? (
                    <TouchableOpacity
                      style={styles.addRow}
                      onPress={() => setShowAddInput(true)}
                    >
                      <Text style={styles.addRowText}>+ Tambah Kategori Baru</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.addInputRow}>
                      <TextInput
                        style={styles.addInput}
                        placeholder="Nama kategori baru..."
                        placeholderTextColor={Colors.gray[400]}
                        value={newName}
                        onChangeText={setNewName}
                        autoFocus
                      />
                      <TouchableOpacity
                        style={styles.addSaveBtn}
                        onPress={handleSaveNew}
                        disabled={saving || !newName.trim()}
                      >
                        {saving ? (
                          <ActivityIndicator color={Colors.white} size="small" />
                        ) : (
                          <Text style={styles.addSaveText}>Simpan</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: Colors.textPrimary, marginBottom: 6 },
  required: { color: Colors.danger },
  dropdownBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.gray[50], borderWidth: 1.5, borderColor: Colors.gray[200],
    borderRadius: Radius.button, paddingHorizontal: Spacing.md, paddingVertical: 12,
  },
  dropdownBtnError: { borderColor: Colors.danger },
  dropdownText: { fontFamily: 'Poppins_400Regular', fontSize: 15, color: Colors.textPrimary },
  dropdownPlaceholder: { fontFamily: 'Poppins_400Regular', fontSize: 15, color: Colors.gray[400] },
  chevron: { fontSize: 16, color: Colors.textSecondary },
  errorText: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: Colors.danger, marginTop: 4 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: Radius.card, borderTopRightRadius: Radius.card,
    padding: Spacing.lg, paddingBottom: 32,
  },
  handle: { width: 40, height: 4, backgroundColor: Colors.gray[300], borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  sheetTitle: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: Colors.textPrimary, marginBottom: Spacing.md },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: Colors.gray[100],
  },
  optionText: { fontFamily: 'Poppins_400Regular', fontSize: 15, color: Colors.textPrimary },
  optionTextActive: { color: Colors.primary, fontFamily: 'Poppins_700Bold' },
  optionCheck: { color: Colors.primary, fontFamily: 'Poppins_700Bold', fontSize: 16 },
  emptyText: { fontFamily: 'Poppins_400Regular', textAlign: 'center', color: Colors.gray[400], paddingVertical: 20 },
  addRow: { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  addRowText: { color: Colors.primary, fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  addInputRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  addInput: {
    flex: 1, backgroundColor: Colors.gray[50], borderWidth: 1.5, borderColor: Colors.primary,
    borderRadius: Radius.button, paddingHorizontal: 14, paddingVertical: 10,
    fontFamily: 'Poppins_400Regular', fontSize: 14, color: Colors.textPrimary,
  },
  addSaveBtn: { backgroundColor: Colors.primary, borderRadius: Radius.button, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center' },
  addSaveText: { color: Colors.white, fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
});
