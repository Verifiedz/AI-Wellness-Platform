import React from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { Card } from "./Card";
import { Button } from "./Button";
import { Banner } from "./Banner";

const HOTLINES = [
  {
    id: "988",
    name: "988 Suicide & Crisis Lifeline",
    region: "United States",
    number: "988",
    uri: "tel:988",
    icon: "call-outline",
  },
  {
    id: "samaritans",
    name: "Samaritans",
    region: "United Kingdom",
    number: "116 123",
    uri: "tel:116123",
    icon: "call-outline",
  },
  {
    id: "112",
    name: "Emergency Services",
    region: "European Union",
    number: "112",
    uri: "tel:112",
    icon: "call-outline",
  },
  {
    id: "crisis-text",
    name: "Crisis Text Line",
    region: "United States",
    number: "Text HOME to 741741",
    uri: "sms:741741&body=HOME",
    icon: "chatbox-outline",
  },
  {
    id: "iasp",
    name: "International Crisis Centres",
    region: "Worldwide",
    number: "Find local support",
    uri: "https://www.iasp.info/resources/Crisis_Centres/",
    icon: "globe-outline",
  },
];

export function CrisisResourceModal({ visible, onClose }) {
  const { colors, fonts } = useTheme();

  const handleContact = (uri) => {
    Linking.openURL(uri).catch(() => {});
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.background },
          ]}
        >
          <View style={styles.header}>
            <Text style={[fonts.heading2, { color: colors.text, flex: 1 }]}>
              Crisis Resources
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Banner
            variant="info"
            message="Sakina is not a substitute for emergency services. If you are in immediate danger, please call your local emergency number."
            style={{ marginBottom: 16 }}
          />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
          >
            {HOTLINES.map((hotline) => (
              <Card key={hotline.id} style={styles.hotlineCard}>
                <View style={styles.hotlineHeader}>
                  <View
                    style={[
                      styles.hotlineIcon,
                      { backgroundColor: `${colors.error}12` },
                    ]}
                  >
                    <Ionicons
                      name={hotline.icon}
                      size={20}
                      color={colors.error}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[fonts.body, { color: colors.text, fontWeight: "600" }]}>
                      {hotline.name}
                    </Text>
                    <Text style={[fonts.caption, { color: colors.textSecondary }]}>
                      {hotline.region}
                    </Text>
                  </View>
                </View>
                <View style={styles.hotlineFooter}>
                  <Text
                    style={[
                      fonts.heading3,
                      { color: colors.text, flex: 1 },
                    ]}
                  >
                    {hotline.number}
                  </Text>
                  <Button
                    variant="secondary"
                    title={hotline.uri.startsWith("http") ? "Visit" : "Contact"}
                    onPress={() => handleContact(hotline.uri)}
                    style={styles.contactBtn}
                    icon={
                      <Ionicons
                        name={
                          hotline.uri.startsWith("http")
                            ? "open-outline"
                            : "call-outline"
                        }
                        size={16}
                        color={colors.primary}
                      />
                    }
                  />
                </View>
              </Card>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  list: {
    gap: 12,
    paddingBottom: 16,
  },
  hotlineCard: {
    padding: 16,
  },
  hotlineHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  hotlineIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  hotlineFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  contactBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});
