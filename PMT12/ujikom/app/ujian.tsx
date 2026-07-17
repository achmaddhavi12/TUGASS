import React, { useEffect, useState } from "react";
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

import {
  addDoc,
  collection,
  getDocs,
} from "firebase/firestore";

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
  const [kategoriList, setKategoriList] =
    useState<Kategori[]>([]);

  const [soalList, setSoalList] =
    useState<Soal[]>([]);

  const [nama, setNama] = useState("");
  const [nim, setNim] = useState("");

  const [kategori, setKategori] = useState("");
  const [durasi, setDurasi] = useState(90);

  const [mulai, setMulai] = useState(false);

  const [nomorSoal, setNomorSoal] = useState(0);

  const [jawaban, setJawaban] =
    useState<Record<string, string>>({});

  const [timeLeft, setTimeLeft] =
    useState(90 * 60);

  const [hasil, setHasil] =
    useState<Hasil | null>(null);

  useEffect(() => {
    loadKategori();
  }, []);

 useEffect(() => {
  let interval: any;

  if (mulai) {
    interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          submitUjian();
          return 0;
        }

        return prev - 1;
      });
    }, 1000);
  }

  return () => {
    if (interval) {
      clearInterval(interval);
    }
  };
}, [mulai]);

  const loadKategori = async () => {
    const snapshot = await getDocs(
      collection(db, "kategori_uji")
    );

    const data: Kategori[] = [];

    snapshot.forEach((doc) => {
      data.push({
        id: doc.id,
        ...(doc.data() as Omit<Kategori, "id">),
      });
    });

    setKategoriList(data);
  };

  const mulaiUjian = async () => {
    if (
      nama === "" ||
      nim === "" ||
      kategori === ""
    ) {
      Alert.alert(
        "Lengkapi data peserta"
      );
      return;
    }

    const pilihKategori =
      kategoriList.find(
        (x) =>
          x.kode_kategori === kategori
      );

    if (pilihKategori) {
      setDurasi(
        Number(pilihKategori.durasi)
      );

      setTimeLeft(
        Number(pilihKategori.durasi) * 60
      );
    }

    const snapshot = await getDocs(
      collection(db, "bank_soal")
    );

    const data: Soal[] = [];

    snapshot.forEach((doc) => {
      const item =
        doc.data() as Omit<Soal, "id">;

      if (
        item.kode_kategori === kategori
      ) {
        data.push({
          id: doc.id,
          ...item,
        });
      }
    });

    setSoalList(data);
    setMulai(true);
  };

  const pilihJawaban = (
    soalId: string,
    value: string
  ) => {
    setJawaban({
      ...jawaban,
      [soalId]: value,
    });
  };

  const submitUjian = async () => {
    let benar = 0;

    soalList.forEach((item) => {
      if (
        jawaban[item.id] ===
        item.jawaban_benar
      ) {
        benar++;
      }
    });

    const salah =
      soalList.length - benar;

    const nilai =
      soalList.length === 0
        ? 0
        : Math.round(
            (benar /
              soalList.length) *
              100
          );

    const hasilData: Hasil = {
      nama,
      nim,
      kategori,
      benar,
      salah,
      nilai,
      tanggal:
        new Date().toLocaleDateString(
          "id-ID"
        ),
    };

    await addDoc(
      collection(db, "hasil_uji"),
      hasilData
    );

    setHasil(hasilData);

    setMulai(false);

    Alert.alert(
      "Ujian Selesai",
      `Nilai Anda ${nilai}`
    );
  };

  const cetakPDF = async () => {
    if (!hasil) return;

    const status =
      hasil.nilai >= 75
        ? "LULUS"
        : "TIDAK LULUS";

    const html = `
      <html>
      <body>
        <h1>HASIL UJIAN</h1>

        <p>Nama : ${hasil.nama}</p>
        <p>NIM : ${hasil.nim}</p>
        <p>Kategori : ${hasil.kategori}</p>
        <p>Tanggal : ${hasil.tanggal}</p>

        <hr>

        <p>Benar : ${hasil.benar}</p>
        <p>Salah : ${hasil.salah}</p>
        <p>Nilai : ${hasil.nilai}</p>

        <h2>${status}</h2>
      </body>
      </html>
    `;

    const file =
      await Print.printToFileAsync({
        html,
      });

    await Sharing.shareAsync(
      file.uri
    );
  };

  if (!mulai && !hasil) {
    return (
      <ScrollView
        style={styles.container}
      >
        <Text style={styles.title}>
          UJIAN ONLINE
        </Text>

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

        <Picker
          selectedValue={kategori}
          onValueChange={(value) =>
            setKategori(value)
          }
        >
          <Picker.Item
            label="Pilih Kategori"
            value=""
          />

          {kategoriList.map(
            (item) => (
              <Picker.Item
                key={item.id}
                label={
                  item.nama_kategori
                }
                value={
                  item.kode_kategori
                }
              />
            )
          )}
        </Picker>

        <TouchableOpacity
          style={styles.button}
          onPress={mulaiUjian}
        >
          <Text
            style={styles.buttonText}
          >
            MULAI UJIAN
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (hasil) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          HASIL UJIAN
        </Text>

        <Text>
          Nama : {hasil.nama}
        </Text>

        <Text>
          NIM : {hasil.nim}
        </Text>

        <Text>
          Nilai : {hasil.nilai}
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={cetakPDF}
        >
          <Text
            style={styles.buttonText}
          >
            CETAK HASIL
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const soal =
    soalList[nomorSoal];

  if (!soal) {
    return (
      <View style={styles.container}>
        <Text>
          Soal tidak ditemukan.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.timer}>
        Sisa Waktu :
        {" "}
        {Math.floor(
          timeLeft / 60
        )}
        :
        {(timeLeft % 60)
          .toString()
          .padStart(2, "0")}
      </Text>

      <Text style={styles.soal}>
        {nomorSoal + 1}.{" "}
        {soal.pertanyaan}
      </Text>

     {["A", "B", "C", "D"].map((huruf) => {
  let pilihan = "";

  if (huruf === "A")
    pilihan = soal.pilihan_a;

  if (huruf === "B")
    pilihan = soal.pilihan_b;

  if (huruf === "C")
    pilihan = soal.pilihan_c;

  if (huruf === "D")
    pilihan = soal.pilihan_d;

  return (
    <TouchableOpacity
      key={huruf}
      style={styles.option}
      onPress={() =>
        pilihJawaban(
          soal.id,
          huruf
        )
      }
    >
      <Text>
        {huruf}. {pilihan}
      </Text>
    </TouchableOpacity>
  );
})}

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          if (
            nomorSoal <
            soalList.length - 1
          ) {
            setNomorSoal(
              nomorSoal + 1
            );
          } else {
            submitUjian();
          }
        }}
      >
        <Text
          style={styles.buttonText}
        >
          {nomorSoal ===
          soalList.length - 1
            ? "SUBMIT"
            : "BERIKUTNYA"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#1826eb",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#fff",
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  timer: {
    fontSize: 22,
    color: "red",
    fontWeight: "bold",
    marginBottom: 20,
  },
  soal: {
    fontSize: 18,
    marginBottom: 20,
    color: "#fff",
  },
  option: {
    borderWidth: 1,
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
});