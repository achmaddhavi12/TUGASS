import { router } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function Splash() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/dashboard");
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <Text style={styles.title}>Restoran Firebase</Text>
      <Text style={styles.subtitle}>Aplikasi Pemesanan Makanan & Minuman</Text>

      <ActivityIndicator size="large" color="#f97316" style={styles.loader} />
      <Text style={styles.loading}>Memuat aplikasi...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    color: "#d1d5db",
    textAlign: "center",
    marginTop: 8,
  },
  loader: {
    marginTop: 30,
  },
  loading: {
    color: "#d1d5db",
    marginTop: 12,
  },
});