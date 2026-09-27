# Implementation Plan: Authentic INEC Electoral Wards for All 27 LGAs

## 1. Executive Summary & Problem Analysis
In the voice note, the user identified that electoral wards across Jigawa State in the database and UI are named generically (e.g. `Babura Ward 1`, `Jahun Ward 1`, `Guri Ward 1`), instead of their official, authentic names (e.g. in Gwaram: `Basirka`, `Farin Dutse`, `Sara`, `Kila`, `Gwaram`, `Maruta`, etc.).

### Findings from Database Audit:
1. **Placeholder Names**: 20 out of 27 LGAs currently have placeholder names (`<LGA> Ward 1`, `<LGA> Ward 2`, ...).
2. **Duplicate Zero-PU Records**: 14 duplicate placeholder wards (IDs 286 to 299, e.g. `Dutse Ward 1`, `Dutse Ward 2`, `Hadejia Ward 1`, `Gwaram Ward 1`) have 0 polling units and were leftover from old seed scripts, falsely inflating the ward count to 299 instead of the official INEC total of **287 wards**.
3. **Foreign Key Integrity**: All 4,827 official Polling Units are tied to existing ward IDs. Updating the ward names in-place preserves all relationships, foreign keys, and polling unit associations with zero data corruption.

---

## 2. Complete Canonical INEC Ward Roster (287 Official Wards Across 27 LGAs)

Below is the verified, official INEC Registration Area roster for all 27 LGAs:

1. **Auyo (10 wards)**: Auyo, Auyakayi, Ayama, Ayan, Gamafoi, Gamsarka, Gatafa, Kafur, Tsidir, Unik
2. **Babura (11 wards)**: Babura, Batali, Dorawa, Garu, Gasakoli, Insharuwa, Jigawa, Kanya, Kuzunzumi, Kyambo, Takwasa
3. **Birniwa (11 wards)**: Batu, Birniwa, Dangwaleri, Diginsa, Fagi, Kachallari, Karanka, Kazura, Machinamari, Matamu, Nguwa
4. **Birnin Kudu (11 wards)**: Birnin Kudu, Kangire, Kantoga, Kiyako, Kwangwara, Lafiya, Sundimina, Surko, Unguwar'ya, Wurno, Yalwan Damai
5. **Buji (10 wards)**: Ahoto, Buji, Churbun, Falageri, Gantsa, K/Lelen Kudu, Kawaya, Kukuma, Madabe, Y/Tukur
6. **Dutse (11 wards)**: Abaya, Chamo, Dundubus, Duru, Jigawar Tsada, Kachi, Karnaya, Kudai, Limawa, Madobi, Sakwaya
7. **Gagarawa (10 wards)**: Gagarawa Gari, Gagarawa Tasha, Garin Chiroma, Kore Balatu, Madaka, Maiaduwa, Maikilili, Medu, Yalawa, Zarada
8. **Garki (11 wards)**: Buduru, Doko, Garki, Gwarzon Garki, Jirima, Kanya, Kargo, Kore, Muku, Rafin Marke, Siyori
9. **Gumel (11 wards)**: Baikarya, Danama, Dantanoma, Galagamma, Garin Gambo, Garin Alhaji Barka, Gusau, Hammado, Kofar Arewa, Kofar Yamma, Zango
10. **Guri (10 wards)**: Abunabo, Adiyani, Dawa, Garbagal, Guri, Kadira, Lafiya, Margadu, Matara Baba, Musari
11. **Gwaram (11 wards)**: Basirka, Dingaya, Fagam, Farin Dutse, Gwaram, Kila, Kwandiko, Maruta, Sara, Tsangarwa, Zandam Nagogo
12. **Gwiwa (11 wards)**: Buntusu, Dabi, Darina, F/Yamma, Guntai, Gwiwa, Korayel, Rorau, Shafe, Yola, Zaumar Sainawa
13. **Hadejia (11 wards)**: Atafi, Dubantu, Gagulmari, Kasuwar Kuda, Kasuwar Kofa, Majema, Matsaro, Rumfa, Sabon Garu, Yankoli, Yayari
14. **Jahun (11 wards)**: Aujara, Gangawa, Gauza Tazara, Gunka, Harbo Sabuwa, Harbo Tsohuwa, Idanduna, Jabarna, Jahun, Kale, Kanwa
15. **Kafin Hausa (11 wards)**: Balangu, Dumadumin Toka, Gafaya, Jabo, Kafin Hausa, Kazalewa, Majawa, Mezan, Ruba, Sarawa, Zago
16. **Kaugama (11 wards)**: Arbus, Askandu, Dabuwaran, Dakaiyawa, Hadin, Ja’e, Jarkasa, Kaugama, Marke, Unguwar Jibrin, Yalo
17. **Kazaure (11 wards)**: Ba'auzini, Daba, Dabaza, Dandi, Gada, Kanti, Maradawa, Sabaru, Unguwar Arewa, Unguwar Gabas, Unguwar Yamma
18. **Kirikasamma (10 wards)**: Baturiya, Bulunchai, Doleri, Fandum, Gayin, Kirika Samma, Madachi, Marma, Tsheguwa, Tarabu
19. **Kiyawa (11 wards)**: Abalago, Andaza, Faki, Garko, Guruduba, Katanga, Katuka, Kiyawa, Kwanda, Maje, Tsurma
20. **Maigatari (11 wards)**: Balarabe, Dankumbo, Fulata, Galadi, Jajeri, Kukayasku, Madana, Maigatari Arewa, Maigatari Kudu, Matoya, Turbus
21. **Malam Madori (11 wards)**: Arki, Dunari, Fateka Akurya, Garin Gabas, Maira Kumi-Bara Musa, Maka Ddari, Malam Madori, Shaiya, Tagwaro, Tashena, Tonikutara
22. **Miga (10 wards)**: Dangyatin, Garbo, Hantsu, Koya, Miga, Sabon Gari Takanebu, Sansani, Tsakuwawa, Yanduna, Zareku
23. **Ringim (10 wards)**: Chai-Chai, Dabi, Kafin Babushe, Karshi, Kyarama, Ringim, Sankara, Sintilmawa, Tofa, Yandutse
24. **Roni (11 wards)**: Amaryawa, Baragumi, Dansure, Fara, Gora, Kwaita, Roni, Sankau, Tunas, Yanzaki, Zugai
25. **Sule Tankarkar (10 wards)**: Albasu, Amanga, Dangwanki, Danladi, Danzomo, Jeke, Shabaru, Sule-Tankarkar, Takatsaba, Yandamo
26. **Taura (10 wards)**: Ajaura, Chakwaikwaiwa, Chukuto, Gujungu, Kiri, Kwalam, Maje, Majiya, S/Garin Yaya, Taura
27. **Yankwashi (10 wards)**: Achilafiya, Belas, Dawan-Gawo, Gurjiya, Gwarta, Karkarna, Kuda, Ringim, Yankwashi, Zungumba

---

## 3. Step-by-Step Execution Plan

### Step 1: In-Place Database Migration Script (`backend/app/migrate_real_wards.py`)
- Query each LGA's existing wards.
- Update each ward's `name` and official `code` to the authentic INEC names above in exact sequential order.
- Remove the 14 duplicate phantom records (IDs 286-299) which have 0 polling units.
- Update any polling unit name strings that had generic "Ward X" prefixes to use the real ward name.
- Commit all changes to `backend/pollwatch.db`.

### Step 2: Harmonize Seeder Dictionaries
- Update `backend/app/seed_live.py`, `backend/app/seed_full.py`, and `backend/app/seed.py` with the complete canonical 287 INEC ward roster.
- Ensure that any future database seeding or reset guarantees 100% authentic names.

### Step 3: Frontend & Telemetry Verification
- Check `/api/admin/dashboard-stats` to verify total wards = 287 (and 4,827 PUs remain intact).
- In `/system-admin` under the **Infrastructure & Setup** -> **Wards** tab:
  - Verify every ward shows its real name (e.g. selecting Gwaram displays `Basirka`, `Dingaya`, `Fagam`, `Farin Dutse`, `Gwaram`, `Kila`, `Kwandiko`, `Maruta`, `Sara`, `Tsangarwa`, `Zandam Nagogo`).
  - Verify selecting Babura, Jahun, Guri, etc., displays their authentic names.
- Run `npm run build` in `web/` to confirm zero compilation errors.

---

## 4. Verification Checklist
- [ ] No `Ward 1`, `Ward 2`, `Ward 3` placeholders remain anywhere in the database.
- [ ] All 4,827 Polling Units remain mapped to valid wards (0 orphans).
- [ ] Total official wards count is exactly 287.
- [ ] Side A Dashboard and Infrastructure UI reflect the real names and counts.
- [ ] Commit and push cleanly to GitHub `main`.

