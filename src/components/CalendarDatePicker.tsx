import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors } from '../theme/colors';

type CalendarDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minimumDate?: string;
  maximumDate?: string;
  style?: StyleProp<ViewStyle>;
};

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthLabels = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function CalendarDatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  minimumDate,
  maximumDate,
  style,
}: CalendarDatePickerProps) {
  const [visible, setVisible] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => getInitialMonth(value, maximumDate));
  const selectedDate = parseDateString(value);
  const minDate = parseDateString(minimumDate);
  const maxDate = parseDateString(maximumDate);

  useEffect(() => {
    if (visible) {
      setVisibleMonth(getInitialMonth(value, maximumDate));
    }
  }, [maximumDate, value, visible]);

  const days = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);

  function selectDate(date: Date) {
    if (isDisabled(date, minDate, maxDate)) {
      return;
    }

    onChange(formatDate(date));
    setVisible(false);
  }

  return (
    <>
      <Pressable style={[styles.input, style]} onPress={() => setVisible(true)}>
        <Text style={[styles.inputText, !value && styles.placeholder]}>{value || placeholder}</Text>
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.backdrop}>
          <View style={styles.modal}>
            <View style={styles.header}>
              <Pressable style={styles.navButton} onPress={() => setVisibleMonth(addMonths(visibleMonth, -12))}>
                <Text style={styles.navText}>{'<<'}</Text>
              </Pressable>
              <Pressable style={styles.navButton} onPress={() => setVisibleMonth(addMonths(visibleMonth, -1))}>
                <Text style={styles.navText}>{'<'}</Text>
              </Pressable>
              <Text style={styles.monthTitle}>
                {monthLabels[visibleMonth.getUTCMonth()]} {visibleMonth.getUTCFullYear()}
              </Text>
              <Pressable style={styles.navButton} onPress={() => setVisibleMonth(addMonths(visibleMonth, 1))}>
                <Text style={styles.navText}>{'>'}</Text>
              </Pressable>
              <Pressable style={styles.navButton} onPress={() => setVisibleMonth(addMonths(visibleMonth, 12))}>
                <Text style={styles.navText}>{'>>'}</Text>
              </Pressable>
            </View>

            <View style={styles.weekdayRow}>
              {weekdayLabels.map((label) => (
                <Text key={label} style={styles.weekday}>{label}</Text>
              ))}
            </View>

            <View style={styles.grid}>
              {days.map((date, index) => {
                const inMonth = date.getUTCMonth() === visibleMonth.getUTCMonth();
                const selected = selectedDate ? isSameDay(date, selectedDate) : false;
                const disabled = isDisabled(date, minDate, maxDate);

                return (
                  <Pressable
                    key={`${formatDate(date)}-${index}`}
                    style={[
                      styles.day,
                      !inMonth && styles.dayMuted,
                      selected && styles.daySelected,
                      disabled && styles.dayDisabled,
                    ]}
                    onPress={() => selectDate(date)}
                    disabled={disabled}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        !inMonth && styles.dayTextMuted,
                        selected && styles.dayTextSelected,
                        disabled && styles.dayTextDisabled,
                      ]}
                    >
                      {date.getUTCDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.footer}>
              <Pressable style={styles.cancelButton} onPress={() => setVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.todayButton} onPress={() => setVisibleMonth(startOfMonth(clampDate(new Date(), minDate, maxDate)))}>
                <Text style={styles.todayText}>Today</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

export function todayDateString() {
  return formatDate(new Date());
}

function getInitialMonth(value: string, maximumDate?: string) {
  const parsedValue = parseDateString(value);
  if (parsedValue) return startOfMonth(parsedValue);

  const parsedMaximum = parseDateString(maximumDate);
  return startOfMonth(parsedMaximum ?? new Date());
}

function buildCalendarDays(month: Date) {
  const firstDay = startOfMonth(month);
  const gridStart = addDays(firstDay, -firstDay.getUTCDay());
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

function parseDateString(value?: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addMonths(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function addDays(date: Date, days: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
}

function formatDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isSameDay(left: Date, right: Date) {
  return formatDate(left) === formatDate(right);
}

function isDisabled(date: Date, minimumDate: Date | null, maximumDate: Date | null) {
  if (minimumDate && date < minimumDate) return true;
  if (maximumDate && date > maximumDate) return true;
  return false;
}

function clampDate(date: Date, minimumDate: Date | null, maximumDate: Date | null) {
  if (minimumDate && date < minimumDate) return minimumDate;
  if (maximumDate && date > maximumDate) return maximumDate;
  return date;
}

const styles = StyleSheet.create({
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  inputText: { color: '#111827', fontSize: 16, fontWeight: '600' },
  placeholder: { color: '#B8BCC5' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  modal: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  navButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: { color: Colors.blue, fontWeight: '900' },
  monthTitle: { flex: 1, textAlign: 'center', fontWeight: '900' },
  weekdayRow: { flexDirection: 'row', marginTop: 14 },
  weekday: { flex: 1, textAlign: 'center', color: Colors.muted, fontSize: 11, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  day: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  dayMuted: { opacity: 0.42 },
  daySelected: { backgroundColor: Colors.blue },
  dayDisabled: { opacity: 0.22 },
  dayText: { color: '#111827', fontWeight: '800' },
  dayTextMuted: { color: Colors.muted },
  dayTextSelected: { color: '#fff' },
  dayTextDisabled: { color: Colors.muted },
  footer: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { color: '#111827', fontWeight: '800' },
  todayButton: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 12,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayText: { color: '#fff', fontWeight: '800' },
});
