import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from 'react-native';
import { useAuth } from '../auth/useAuth';

const REFRESH_DISTANCE = 86;

export function usePullToRefresh() {
  const { isRefreshingData, refreshAppData } = useAuth();
  const [pullDistance, setPullDistance] = useState(0);

  const progress = isRefreshingData ? 1 : Math.min(pullDistance / REFRESH_DISTANCE, 1);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isRefreshingData) {
        return;
      }

      setPullDistance(Math.max(0, -event.nativeEvent.contentOffset.y));
    },
    [isRefreshingData]
  );

  const onScrollEndDrag = useCallback(
    async (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isRefreshingData) {
        return;
      }

      const releaseDistance = Math.max(0, -event.nativeEvent.contentOffset.y);

      if (releaseDistance >= REFRESH_DISTANCE) {
        setPullDistance(REFRESH_DISTANCE);
        await refreshAppData();
      }

      setPullDistance(0);
    },
    [isRefreshingData, refreshAppData]
  );

  return {
    indicator: <PullToRefreshIndicator progress={progress} refreshing={isRefreshingData} />,
    onScroll,
    onScrollEndDrag,
    scrollEventThrottle: 16,
  };
}

function PullToRefreshIndicator({ progress, refreshing }: { progress: number; refreshing: boolean }) {
  if (!refreshing && progress <= 0.02) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.indicatorWrap}>
      <View style={styles.indicator}>
        {refreshing ? (
          <ActivityIndicator size="small" color="#8A8F98" />
        ) : (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { height: `${Math.round(progress * 100)}%` }]} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  indicatorWrap: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    zIndex: 50,
    alignItems: 'center',
  },
  indicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  progressTrack: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A8ADB5',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  progressFill: {
    width: '100%',
    backgroundColor: '#A8ADB5',
  },
});
