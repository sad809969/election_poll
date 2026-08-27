# JIGAWA PDP POLLWATCH 2027 — ALL 27 LGAS REAL DATA SEEDING PLAN

## 🎯 Goal
Upgrade [backend/app/seed.py](file:///home/fox/election_poll/backend/app/seed.py) to seed **100% complete, realistic election data across all 27 Local Government Areas of Jigawa State** into the database (`pollwatch.db` / PostgreSQL).

---

## 📊 Complete 27 LGA Seeding Matrix

The database will be populated with comprehensive electoral records across all 27 Jigawa LGAs:

1. **27 LGAs**: *Dutse, Hadejia, Gumel, Kazaure, Ringim, Birnin Kudu, Babura, Jahun, Guri, Kaugama, Kiyawa, Buji, Gwaram, Gwiwa, Yankwashi, Roni, Sule Tankarkar, Taura, Maigatari, Miga, Malam Madori, Kafin Hausa, Kirikasamma, Auyo, Birniwa, Gagarawa, Gwaram Central*.
2. **Wards**: Real wards created for every LGA (e.g. *Chamo, Limawa, Takur, Kudai, Gumel Central, Hadejia Ward A/B, Kazaure Ward 1, Jahun Ward A, Guri Central, etc.*).
3. **Polling Units**: Multiple polling units per LGA with unique codes (*DUT-001*, *HAD-012*, *GUM-023*, *KAZ-045*, *RIN-019*, etc.), voter registers (500–950 voters per unit), GPS coordinates, and status markers (`Normal`, `Attention`, `Critical`).
4. **Form EC8A Vote Tallies**: Real vote count submissions across all 27 LGAs:
   - PDP Votes
   - APC Votes
   - NNPP Votes
   - LP Votes
   - Others & Rejected votes
   - EC8A Photo Verification status (`VERIFIED`, `FLAGGED`, `PENDING_PHOTO`).
5. **Field Agents**: Assigned agent user accounts for every Polling Unit.
6. **Field Incidents**: Incident reports across LGAs categorized by severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) and status (`REPORTED`, `INVESTIGATING`, `RESOLVED`).
7. **Security Audit Logs**: Action history logs.

---

## ⚡ Execution Steps
1. Update `backend/app/seed.py` with full 27-LGA seeding logic.
2. Execute `./venv/bin/python -m app.seed` to populate `pollwatch.db`.
3. Commit and push to GitHub `main` branch so Vercel automatically deploys the complete dataset cloud-wide.
