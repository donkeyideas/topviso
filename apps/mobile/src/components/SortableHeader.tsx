import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useTheme } from '../lib/theme'
import type { SortConfig } from '../hooks/useSortable'

interface Column {
  label: string
  key: string
  width?: number
  flex?: number
  align?: 'left' | 'right'
}

interface Props {
  columns: Column[]
  sort: SortConfig
  onSort: (key: string) => void
}

export function SortableHeader({ columns, sort, onSort }: Props) {
  const { colors } = useTheme()

  return (
    <View style={[styles.header, { backgroundColor: colors.paper2 }]}>
      {columns.map((col) => {
        const isActive = sort?.key === col.key
        const arrow = isActive ? (sort.direction === 'desc' ? ' ↓' : ' ↑') : ''
        return (
          <Pressable
            key={col.key}
            onPress={() => onSort(col.key)}
            style={[
              col.flex ? { flex: col.flex } : { width: col.width },
            ]}
            hitSlop={4}
          >
            <Text
              style={[
                styles.th,
                { color: isActive ? colors.accent : colors.ink3 },
                (col.align === 'right') && { textAlign: 'right' },
              ]}
            >
              {col.label}{arrow}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8 },
  th: { fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'InterTight_500Medium' },
})
