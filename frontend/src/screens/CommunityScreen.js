import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { Card } from "../components/Card";
import { AnimatedCard } from "../components/AnimatedCard";
import { Banner } from "../components/Banner";
import { SectionHeader } from "../components/SectionHeader";
import { communityApi } from "../services/communityApi";

/**
 * Community hub showing support group topics.
 */
export function CommunityScreen({ navigation }) {
  const { colors, fonts } = useTheme();
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadGroups = useCallback(async (soft = false) => {
    if (soft) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const result = await communityApi.getGroups();
      if (!result.error && result.data) {
        setGroups(Array.isArray(result.data) ? result.data : []);
      }
    } catch {
      // Load failed
    } finally {
      if (soft) setIsRefreshing(false);
      else setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => { loadGroups(false); }, [loadGroups])
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={() => loadGroups(true)} />
      }
    >
      <Banner
        type="info"
        message="All posts are anonymous. Be kind and supportive. If you need immediate help, use the crisis button."
        icon="shield-checkmark-outline"
      />

      <SectionHeader title="Support Groups" />

      {groups.length === 0 && !isLoading && (
        <Card>
          <View style={{ alignItems: "center", paddingVertical: 20 }}>
            <Ionicons name="people-outline" size={40} color={colors.textLight} />
            <Text style={[fonts.body, { color: colors.textSecondary, marginTop: 8, textAlign: "center" }]}>
              Community groups are being set up. Check back soon!
            </Text>
          </View>
        </Card>
      )}

      <View style={styles.groupGrid}>
        {groups.map((group, idx) => (
          <AnimatedCard key={group.id || group.slug} index={idx}>
            <TouchableOpacity
              style={[styles.groupCard, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate("GroupFeed", { slug: group.slug, name: group.name })}
              activeOpacity={0.7}
            >
              <View style={[styles.groupIcon, { backgroundColor: `${colors.primary}12` }]}>
                <Ionicons name={group.icon || "people-outline"} size={28} color={colors.primary} />
              </View>
              <Text style={[fonts.heading3, { color: colors.text, marginTop: 10 }]}>
                {group.name}
              </Text>
              <Text
                style={[fonts.caption, { color: colors.textSecondary, marginTop: 4, textAlign: "center" }]}
                numberOfLines={2}
              >
                {group.description}
              </Text>
              {(group.memberCount > 0 || group.postCount > 0) && (
                <Text style={[fonts.caption, { color: colors.textLight, marginTop: 6 }]}>
                  {group.postCount || 0} posts
                </Text>
              )}
            </TouchableOpacity>
          </AnimatedCard>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  groupGrid: { gap: 12 },
  groupCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  groupIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
});
