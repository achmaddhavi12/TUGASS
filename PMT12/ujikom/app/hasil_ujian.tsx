import React, { useEffect, useState, useRef } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Picker } from "@react-native-picker/picker";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

interface Kategori {
  id: string;
  kode_kategori: string;
  nama_kategori: string;
  durasi: number;
}

interface Soal {
  id: string;
  kode_kategori: string;
  pertanyaan: string;
  pilihan_a: string;
  pilihan_b: string;
  pilihan_c: string;
  pilihan_d: string;
  jawaban_benar: string;
}

interface Hasil {
  nama: string;
  nim: string;
  kategori: string;
  benar: number;
  salah: number;
  nilai: number;
  tanggal: string;
}

export default function Ujian() {
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [soalList, setSoalList] = useState<Soal[]>([]);
  const [nama, setNama] = useState("");
  const [nim, setNim] = useState("");
  const [kategori, setKategori] = useState("");
  const [mulai, setMulai] = useState(false);
  const [nomorSoal, setNomorSoal] = useState(0);
  const [jawaban, setJawaban] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(90 * 60);
  const [hasil, setHasil] = useState<Hasil | null>(null);

  // Menggunakan useRef untuk menghindari Stale Closure di dalam setInterval
  const stateRef = useRef({ jawaban, soalList, nama, nim, kategori });
  
  useEffect(() => {
    stateRef.current = { jawaban, soalList, nama, nim, kategori };
  }, [jawaban, soalList, nama, nim, kategori]);

  useEffect(() => {
    loadKategori();
  }, []);

  useEffect(() => {
    let interval: any;

    if (mulai) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            // Panggil submit otomatis dengan data ref terbaru
            submitUjianOtomatis();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mulai]);

  const loadKategori = async () => {
    try {
      const snapshot = await getDocs(collection(db, "kategori_uji"));
      const data: Kategori[] = [];
      snapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          ...(doc.data() as Omit<Kategori, "id">),
        });
      });
      setKategoriList(data);
    } catch (error) {
      Alert.alert("Error", "Gagal memuat kategori ujian.");
    }
  };

  const mulaiUjian = async () => {
    if (nama.trim() === "" || nim.trim() === "" || kategori === "") {
      Alert.alert("Peringatan", "Lengkapi data peserta");
      return;
    }

    const pilihKategori = kategoriList.find((x) => x.kode_kategori === kategori);

    if (pilihKategori) {
      const menit = Number(pilihKategori.durasi) || 90;
      setTimeLeft(menit * 60);
    }

    try {
      const snapshot = await getDocs(collection(db, "bank_soal"));
      const data: Soal[] = [];

      snapshot.forEach((doc) => {
        const item = doc.data() as Omit<Soal, "id">;
        if (item.kode_kategori === kategori) {
          data.push({
            id: doc.id,
            ...item,
          });
        }
      });

      if (data.length === 0) {
        Alert.alert("Informasi", "Tidak ada soal untuk kategori ini.");
        return;
      }

      setSoalList(data);
      setNomorSoal(0);
      setJawaban({});
      setMulai(true);
      setHasil(null);
    } catch (error) {
      Alert.alert("Error", "Gagal memuat soal.");
    }
  };

  const pilihJawaban = (soalId: string, value: string) => {
    setJawaban((prev) => ({
      ...prev,
      [soalId]: value,
    }));
  };

  // Fungsi submit manual / ditekan user
  const submitUjian = async () => {
    await prosesSubmit(jawaban, soalList, nama, nim, kategori);
  };

  // Fungsi submit otomatis saat timer habis (menggunakan data dari Ref)
  const submitUjianOtomatis = async () => {
    const { jawaban: jwb, soalList: soal, nama: nm, nim: nm_id, kategori: kt } = stateRef.current;
    await prosesSubmit(jwb, soal, nm, nm_id, kt);
  };

  const prosesSubmit = async (
    currentJawaban: Record<string, string>,
    currentSoalList: Soal[],
    currentNama: string,
    currentNim: string,
    currentKategori: string
  ) => {
    let benar = 0;

    currentSoalList.forEach((item) => {
      if (currentJawaban[item.id] === item.jawaban_benar) {
        benar++;
      }
    });

    const salah = currentSoalList.length - benar;
    const nilai = currentSoalList.length === 0 ? 0 : Math.round((benar / currentSoalList.length) * 100);

    const hasilData: Hasil = {
      nama: currentNama,
      nim: currentNim,
      kategori: currentKategori,
      benar,
      salah,
      nilai,
      tanggal: new Date().toLocaleDateString("id-ID"),
    };

    try {
      await addDoc(collection(db, "hasil_uji"), hasilData);
      setHasil(hasilData);
      setMulai(false);
      Alert.alert("Ujian Selesai", `Nilai Anda ${nilai}`);
    } catch (error) {
      Alert.alert("Error", "Gagal menyimpan hasil ujian ke database.");
    }
  };

  const cetakPDF = async () => {
    if (!hasil) return;

    const status = hasil.nilai >= 75 ? "LULUS" : "TIDAK LULUS";

    const html = `
      <html>
      <head>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          h1 { text-align: center; color: #2563eb; }
          .status { font-weight: bold; font-size: 24px; color: ${hasil.nilai >= 75 ? 'green' : 'red'}; }
        </style>
      </head>
      <body>
        <h1>HASIL UJIAN</h1>
        <p><b>Nama :</b> ${hasil.nama}</p>
        <p><b>NIM :</b> ${hasil.nim}</p>
        <p><b>Kategori :</b> ${hasil.kategori}</p>
        <p><b>Tanggal :</b> ${hasil.tanggal}</p>
        <hr>
        <p><b>Benar :</b> ${hasil.benar}</p>
        <p><b>Salah :</b> ${hasil.salah}</p>
        <p><b>Nilai :</b> ${hasil.nilai}</p>
        <h2 class="status">${status}</h2>
      </body>
      </html>
    `;

    try {
      const file = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(file.uri);
    } catch (error) {
      Alert.alert("Error", "Gagal mencetak PDF.");
    }
  };

  // TAMPILAN 1: FORM PENDAFTARAN / LOGIN UJIAN
  if (!mulai && !hasil) {
    return (
      <ScrollView 
        style={{ flex: 1, backgroundColor: "#1826eb" }}
        contentContainerStyle={styles.container}
      >
        <Text style={styles.title}>UJIAN ONLINE</Text>

        <TextInput
          style={styles.input}
          placeholder="Nama"
          value={nama}
          onChangeText={setNama}
        />

        <TextInput
          style={styles.input}
          placeholder="NIM"
          value={nim}
          onChangeText={setNim}
        />

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={kategori}
            onValueChange={(value) => setKategori(value)}
            dropdownIconColor="#000"
          >
            <Picker.Item label="Pilih Kategori" value="" />
            {kategoriList.map((item) => (
              <Picker.Item
                key={item.id}
                label={item.nama_kategori}
                value={item.kode_kategori}
              />
            ))}
          </Picker>
        </View>

        <TouchableOpacity style={styles.button} onPress={mulaiUjian}>
          <Text style={styles.buttonText}>MULAI UJIAN</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // TAMPILAN 2: HASIL UJIAN
  if (hasil) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <Text style={styles.title}>HASIL UJIAN</Text>
        <View style={styles.cardHasil}>
          <Text style={styles.textHasil}>Nama : {hasil.nama}</Text>
          <Text style={styles.textHasil}>NIM : {hasil.nim}</Text>
          <Text style={styles.textHasil}>Nilai : {hasil.nilai}</Text>
          <Text style={[styles.textHasil, {fontWeight: 'bold', color: hasil.nilai >= 75 ? '#22c55e' : '#ef4444'}]}>
            Status : {hasil.nilai >= 75 ? "LULUS" : "TIDAK LULUS"}
          </Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={cetakPDF}>
          <Text style={styles.buttonText}>CETAK HASIL</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, {backgroundColor: '#6b7280', marginTop: 10}]} 
          onPress={() => { setHasil(null); setMulai(false); }}
        >
          <Text style={styles.buttonText}>KEMBALI KE AWAL</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // TAMPILAN 3: LEMBAR SOAL UJIAN
  const soal = soalList[nomorSoal];

  if (!soal) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff' }}>Soal tidak ditemukan atau memuat...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.timer}>
        Sisa Waktu : {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
      </Text>

      <Text style={styles.soal}>
        {nomorSoal + 1}. {soal.pertanyaan}
      </Text>

      {["A", "B", "C", "D"].map((huruf) => {
        let pilihan = "";
        if (huruf === "A") pilihan = soal.pilihan_a;
        if (huruf === "B") pilihan = soal.pilihan_b;
        if (huruf === "C") pilihan = soal.pilihan_c;
        if (huruf === "D") pilihan = soal.pilihan_d;

        // Cek apakah opsi ini sedang dipilih oleh user
        const isSelected = jawaban[soal.id] === huruf;

        return (
          <TouchableOpacity
            key={huruf}
            style={[
              styles.option,
              isSelected && { backgroundColor: "#bbf7d0", borderColor: "#22c55e", borderWidth: 2 }
            ]}
            onPress={() => pilihJawaban(soal.id, huruf)}
          >
            <Text style={{ color: "#000", fontWeight: isSelected ? "bold" : "normal" }}>
              {huruf}. {pilihan}
            </Text>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={[styles.button, { marginTop: 30 }]}
        onPress={() => {
          if (nomorSoal < soalList.length - 1) {
            setNomorSoal(nomorSoal + 1);
          } else {
            Alert.alert(
              "Konfirmasi",
              "Apakah Anda yakin ingin mengakhiri ujian?",
              [
                { text: "Batal", style: "cancel" },
                { text: "Ya, Kirim", onPress: submitUjian }
              ]
            );
          }
        }}
      >
        <Text style={styles.buttonText}>
          {nomorSoal === soalList.length - 1 ? "SUBMIT" : "BERIKUTNYA"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#1826eb",
    paddingTop: 60,
    minHeight: '100%'
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#fff",
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: "#fff",
    color: '#000'
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden'
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#fff'
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  timer: {
    fontSize: 22,
    color: "#f87171",
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: 'center'
  },
  soal: {
    fontSize: 18,
    marginBottom: 20,
    color: "#fff",
    lineHeight: 24
  },
  option: {
    borderWidth: 1,
    padding: 15,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  cardHasil: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20
  },
  textHasil: {
    fontSize: 16,
    marginBottom: 10,
    color: '#000'
  }
});