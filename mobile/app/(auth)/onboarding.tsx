import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  FlatList, ViewToken,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedScrollHandler, useSharedValue,
  useAnimatedStyle, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Welcome to\nROVER',
    subtitle: 'Ride • Relocate • Earn',
    description: 'The premium biker community where trust meets the open road.',
    icon: 'bicycle' as const,
    gradient: ['#FF6B00', '#CC4400'],
  },
  {
    id: '2',
    title: 'Find Trusted\nRiders',
    subtitle: 'Like-Hinge for bike transport',
    description: 'Browse detailed rider profiles, check trust scores, and pick the perfect person for your bike.',
    icon: 'search' as const,
    gradient: ['#7C3AED', '#4C1D95'],
  },
  {
    id: '3',
    title: 'Earn Through\nRiding',
    subtitle: 'Turn passion into income',
    description: 'Get paid to ride bikes between cities. Build your reputation, earn badges, grow your income.',
    icon: 'wallet' as const,
    gradient: ['#059669', '#065F46'],
  },
  {
    id: '4',
    title: 'Join the\nCommunity',
    subtitle: 'Find your tribe',
    description: 'Connect with bikers, plan group trips, share ride stories, and build lasting friendships on the road.',
    icon: 'people' as const,
    gradient: ['#DC2626', '#991B1B'],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]) setCurrentIndex(viewableItems[0].index || 0);
    },
  ).current;

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      router.push('/(auth)/login');
    }
  };

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatListRef as unknown as React.RefObject<Animated.FlatList<typeof SLIDES[0]>>}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        renderItem={({ item, index }) => (
          <SlideItem item={item} index={index} scrollX={scrollX} />
        )}
      />

      {/* Dots */}
      <View style={styles.dotsContainer}>
        {SLIDES.map((_, i) => (
          <DotIndicator key={i} index={i} scrollX={scrollX} />
        ))}
      </View>

      {/* Bottom CTAs */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.nextButton} onPress={goNext} activeOpacity={0.8}>
          <LinearGradient colors={['#FF6B00', '#CC4400']} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.nextText}>
              {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        {currentIndex < SLIDES.length - 1 && (
          <TouchableOpacity style={styles.skipButton} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function SlideItem({ item, index, scrollX }: {
  item: typeof SLIDES[0]; index: number; scrollX: Animated.SharedValue<number>;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const scale = interpolate(scrollX.value, inputRange, [0.8, 1, 0.8], Extrapolation.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0.4, 1, 0.4], Extrapolation.CLAMP);
    return { transform: [{ scale }], opacity };
  });

  return (
    <View style={styles.slide}>
      <Animated.View style={[styles.slideContent, animatedStyle]}>
        {/* Icon card */}
        <LinearGradient
          colors={item.gradient as [string, string]}
          style={styles.iconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={item.icon} size={80} color="#fff" />
        </LinearGradient>

        <View style={styles.textContainer}>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

function DotIndicator({ index, scrollX }: { index: number; scrollX: Animated.SharedValue<number> }) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const dotWidth = interpolate(scrollX.value, inputRange, [8, 24, 8], Extrapolation.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0.4, 1, 0.4], Extrapolation.CLAMP);
    return { width: dotWidth, opacity };
  });

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  slide: { width, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl },
  slideContent: { alignItems: 'center', width: '100%' },
  iconContainer: {
    width: 180, height: 180, borderRadius: 90,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING['2xl'],
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  textContainer: { alignItems: 'center', width: '100%' },
  subtitle: { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 2, marginBottom: SPACING.sm },
  title: { color: COLORS.text, fontSize: FONTS.sizes['3xl'], fontWeight: '800', textAlign: 'center', marginBottom: SPACING.md, lineHeight: 42 },
  description: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md, textAlign: 'center', lineHeight: 26 },
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', paddingVertical: SPACING.md, gap: 8 },
  dot: { height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  bottomContainer: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING['2xl'], gap: SPACING.md },
  nextButton: { borderRadius: RADIUS.lg, overflow: 'hidden' },
  gradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, gap: SPACING.sm },
  nextText: { color: COLORS.text, fontSize: FONTS.sizes.md, fontWeight: '700' },
  skipButton: { alignItems: 'center' },
  skipText: { color: COLORS.textMuted, fontSize: FONTS.sizes.base },
});
