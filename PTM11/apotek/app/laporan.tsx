import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { db } from "../config/firebase";

type Obat = {
  id: string;
  kode_obat: string;
  nama_obat: string;
  jenis_obat: string;
  stok: number;
  harga: number;
  keterangan: string;
  gambar_url: string;
};

export default function Laporan() {
  const [dataObat, setDataObat] = useState<Obat[]>([]);
  const [totalData, setTotalData] = useState(0);
  const [totalStok, setTotalStok] = useState(0);
  const [totalNilaiStok, setTotalNilaiStok] = useState(0);

  useEffect(() => {
    getDataObat();
  }, []);

  async function getDataObat() {
    try {
      const snapshot = await getDocs(collection(db, "tbobat"));
      const data: Obat[] = snapshot.docs.map((document) => {
        const item = document.data();
        return {
          id: document.id,
          kode_obat: item.kode_obat || "",
          nama_obat: item.nama_obat || "",
          jenis_obat: item.jenis_obat || "",
          stok: Number(item.stok || 0),
          harga: Number(item.harga || 0),
          keterangan: item.keterangan || "",
          gambar_url: item.gambar_url || "",
        };
      });

      data.sort((a, b) => a.kode_obat.localeCompare(b.kode_obat));
      const hitungStok = data.reduce((total, item) => total + item.stok, 0);
      const hitungNilaiStok = data.reduce(
        (total, item) => total + item.stok * item.harga,
        0
      );

      setDataObat(data);
      setTotalData(data.length);
      setTotalStok(hitungStok);
      setTotalNilaiStok(hitungNilaiStok);
    } catch (error) {
      console.log("Gagal mengambil laporan obat:", error);
      Alert.alert("Error", "Gagal mengambil data laporan obat.");
    }
  }

  function buatHtmlLaporan() {
    const tanggalCetak = new Date().toLocaleDateString("id-ID");
    const jamCetak = new Date().toLocaleTimeString("id-ID");
    const rows = dataObat
      .map(
        (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>
            ${
              item.gambar_url
                ? `<img src="${item.gambar_url}" style="width:55px;height:55px;object-fit:cover;border-radius:6px;" />`
                : "-"
            }
          </td>
          <td>${item.kode_obat}</td>
          <td>${item.nama_obat}</td>
          <td>${item.jenis_obat}</td>
          <td>${item.stok}</td>
          <td>Rp ${item.harga.toLocaleString("id-ID")}</td>
          <td>Rp ${(item.stok * item.harga).toLocaleString("id-ID")}</td>
          <td>${item.keterangan || "-"}</td>
        </tr>
      `
      )
      .join("");

    return `
      <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
          .kop { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #111827; padding-bottom: 12px; }
          .kop h1 { margin: 0; font-size: 22px; }
          .kop p { margin: 4px 0; font-size: 13px; }
          .info { margin-bottom: 14px; font-size: 13px; }
          .summary { display: flex; gap: 10px; margin-bottom: 18px; }
          .box { border: 1px solid #333; padding: 10px; flex: 1; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; }
          th { background-color: #0284c7; color: white; border: 1px solid #333; padding: 7px; text-align: center; }
          td { border: 1px solid #333; padding: 6px; text-align: center; vertical-align: middle; }
          .footer { margin-top: 35px; display: flex; justify-content: flex-end; font-size: 13px; }
          .ttd { text-align: center; width: 220px; }
          .space { height: 60px; }
        </style>
      </head>
      <body>
        <div class="kop">
          <h1>LAPORAN DATA OBAT</h1>
          <p>APOTEK / SISTEM DATA OBAT</p>
          <p>Dicetak dari Aplikasi React Native Firebase</p>
        </div>
        <div class="info">
          <p><strong>Tanggal Cetak:</strong> ${tanggalCetak}</p>
          <p><strong>Jam Cetak:</strong> ${jamCetak}</p>
        </div>
        <div class="summary">
          <div class="box"><strong>Total Data Obat</strong><br />${totalData} Data</div>
          <div class="box"><strong>Total Stok</strong><br />${totalStok} Item</div>
          <div class="box"><strong>Total Nilai Stok</strong><br />Rp ${totalNilaiStok.toLocaleString("id-ID")}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Gambar</th>
              <th>Kode Obat</th>
              <th>Nama Obat</th>
              <th>Jenis</th>
              <th>Stok</th>
              <th>Harga</th>
              <th>Nilai Stok</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            ${dataObat.length === 0 ? `<tr><td colspan="9">Belum ada data obat</td></tr>` : rows}
          </tbody>
        </table>
        <div class="footer">
          <div class="ttd">
            <p>Mengetahui,</p>
            <div class="space"></div>
            <p><strong>Admin Apotek</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async function cetakPrintout() {
    try {
      const html = buatHtmlLaporan();
      await Print.printAsync({ html });
    } catch (error) {
      console.log("Gagal mencetak laporan:", error);
      Alert.alert("Error", "Gagal mencetak laporan.");
    }
  }

  async function cetakPdf() {
    try {
      const html = buatHtmlLaporan();
      const file = await Print.printToFileAsync({ html, base64: false });
      const tersedia = await Sharing.isAvailableAsync();
      if (tersedia) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "application/pdf",
          dialogTitle: "Bagikan Laporan Data Obat",
        });
      } else {
        Alert.alert("PDF Berhasil Dibuat", file.uri);
      }
    } catch (error) {
      console.log("Gagal membuat PDF:", error);
      Alert.alert("Error", "Gagal membuat PDF laporan.");
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Kembali</Text>
        </TouchableOpacity>

        <Text style={styles.header}>Laporan Data Obat</Text>
        <Text style={styles.subHeader}>Printout dan PDF dari Firebase Firestore</Text>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Total Nilai Stok Obat</Text>
          <Text style={styles.summaryValue}>Rp {totalNilaiStok.toLocaleString("id-ID")}</Text>
          
          {/* PERBAIKAN: Mengganti <div> menjadi <View> bawaan React Native */}
          <View style={styles.summaryRow}>
            <View style={styles.smallBox}>
              <Text style={styles.smallLabel}>Data Obat</Text>
              <Text style={styles.smallValue}>{totalData}</Text>
            </View>
            <View style={styles.smallBox}>
              <Text style={styles.smallLabel}>Total Stok</Text>
              <Text style={styles.smallValue}>{totalStok}</Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.printButton} onPress={cetakPrintout}>
            <Text style={styles.buttonText}>Cetak Printout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pdfButton} onPress={cetakPdf}>
            <Text style={styles.buttonText}>Simpan PDF</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={getDataObat}>
          <Text style={styles.buttonText}>Refresh Data</Text>
        </TouchableOpacity>

        <Text style={styles.listTitle}>Tabel Laporan Obat</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.colNo]}>No</Text>
              <Text style={[styles.th, styles.colGambar]}>Gambar</Text>
              <Text style={[styles.th, styles.colKode]}>Kode</Text>
              <Text style={[styles.th, styles.colNama]}>Nama Obat</Text>
              <Text style={[styles.th, styles.colJenis]}>Jenis</Text>
              <Text style={[styles.th, styles.colStok]}>Stok</Text>
              <Text style={[styles.th, styles.colHarga]}>Harga</Text>
              <Text style={[styles.th, styles.colNilai]}>Nilai Stok</Text>
            </View>

            {dataObat.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>Belum ada data obat.</Text>
              </View>
            ) : (
              dataObat.map((item, index) => (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={[styles.td, styles.colNo]}>{index + 1}</Text>
                  <View style={styles.colGambar}>
                    {item.gambar_url ? (
                      <Image 
                        source={{ uri: item.gambar_url }} 
                        style={styles.tableImage} 
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.td}>-</Text>
                    )}
                  </View>
                  <Text style={[styles.td, styles.colKode]}>{item.kode_obat}</Text>
                  <Text style={[styles.td, styles.colNama]}>{item.nama_obat}</Text>
                  <Text style={[styles.td, styles.colJenis]}>{item.jenis_obat}</Text>
                  <Text style={[styles.td, styles.colStok]}>{item.stok}</Text>
                  <Text style={[styles.td, styles.colHarga]}>Rp {item.harga.toLocaleString("id-ID")}</Text>
                  <Text style={[styles.td, styles.colNilai]}>Rp {(item.stok * item.harga).toLocaleString("id-ID")}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", padding: 20 },
  backButton: { marginTop: 35, marginBottom: 10 },
  backText: { color: "#38bdf8", fontWeight: "bold", fontSize: 16 },
  header: { color: "#ffffff", fontSize: 30, fontWeight: "bold" },
  subHeader: { color: "#cbd5e1", marginTop: 5, marginBottom: 18 },
  summaryBox: { backgroundColor: "#075985", borderRadius: 18, padding: 18, marginBottom: 16 },
  summaryLabel: { color: "#bae6fd", fontSize: 15 },
  summaryValue: { color: "#ffffff", fontSize: 28, fontWeight: "bold", marginTop: 6 },
  summaryRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  smallBox: { flex: 1, backgroundColor: "#0369a1", borderRadius: 14, padding: 12 },
  smallLabel: { color: "#bae6fd", fontSize: 13 },
  smallValue: { color: "#ffffff", fontSize: 22, fontWeight: "bold", marginTop: 4 },
  buttonRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  printButton: { flex: 1, backgroundColor: "#0284c7", padding: 14, borderRadius: 12, alignItems: "center" },
  pdfButton: { flex: 1, backgroundColor: "#16a34a", padding: 14, borderRadius: 12, alignItems: "center" },
  refreshButton: { backgroundColor: "#475569", padding: 14, borderRadius: 12, alignItems: "center", marginBottom: 20 },
  buttonText: { color: "#ffffff", fontWeight: "bold" },
  listTitle: { color: "#ffffff", fontSize: 22, fontWeight: "bold", marginBottom: 12 },
  table: { minWidth: 900, borderWidth: 1, borderColor: "#334155", borderRadius: 12, overflow: "hidden", marginBottom: 35 },
  tableHeader: { flexDirection: "row", backgroundColor: "#0284c7", paddingVertical: 12, alignItems: "center" },
  tableRow: { flexDirection: "row", backgroundColor: "#1e293b", borderBottomWidth: 1, borderBottomColor: "#334155", paddingVertical: 12, alignItems: "center" },
  th: { color: "#ffffff", fontWeight: "bold", fontSize: 12, textAlign: "center", paddingHorizontal: 6 },
  td: { color: "#e2e8f0", fontSize: 12, textAlign: "center", paddingHorizontal: 6 },
  colNo: { width: 45 },
  colGambar: { width: 90, alignItems: "center", justifyContent: "center" },
  colKode: { width: 100 },
  colNama: { width: 170 },
  colJenis: { width: 130 },
  colStok: { width: 70 },
  colHarga: { width: 130 },
  colNilai: { width: 150 },
  tableImage: { width: 58, height: 58, borderRadius: 10, backgroundColor: "#334155" }, // Ukuran gambar wajib terdefinisi di sini
  emptyRow: { backgroundColor: "#1e293b", padding: 18 },
  emptyText: { color: "#cbd5e1", textAlign: "center" },
});