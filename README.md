# eRTMAC-NWIS: Nearby Wells Intelligence System

**Smart India Hackathon 2026 | Problem Statement ID: SIH26121 | Team: OJAS**
Theme: Energy, Utilities & Smart Automation | Category: Software

An intelligent drilling decision-support prototype with GIS offset-well mapping, historical DDR/WCR intelligence, and ML hazard prediction.

---

## Live Demo

**Prototype:** https://remix-remix-ertmac-nwis-7602.ai.studio

> **Note for judges:** If a login page appears, simply click **"Skip for now"** to view the demo. No account or sign-up is needed.

---

## The Problem

Drilling engineers often spend hours searching through old PDF reports (WCR and DDR) to learn what went wrong in nearby wells, such as mud loss, stuck pipe, or pressure problems. This delay can lead to repeated mistakes, costly downtime, and safety risks.

## Our Solution

eRTMAC-NWIS brings nearby-well knowledge into one place. Engineers can view offset wells on an interactive map, explore historical drilling report intelligence, and see hazard predictions such as stuck pipe and mud loss risk.

## Features in this Prototype

- **GIS offset-well mapping:** view nearby wells relative to the active well.
- **Historical DDR/WCR intelligence:** insights drawn from past drilling and well completion reports.
- **ML hazard prediction:** risk indication for drilling hazards such as stuck pipe and mud loss.

## Tech Stack (this prototype)

- React / TypeScript web app built with Vite
- Hosted and developed on Google AI Studio

## Planned Full Architecture (future work)

The complete system we designed for real deployment is described in our SIH idea submission:

- Agentic RAG search over legacy reports with exact page citations
- OCR and depth-based chunking of legacy PDFs
- XGBoost hazard probability scoring on real-time rig data
- Real-time, depth-triggered alerts
- Air-gapped deployment on the operator's own infrastructure

## Run Locally

```bash
git clone https://github.com/vidhyan25ece-max/ertmac-nwis.git
cd ertmac-nwis
npm install
cp .env.example .env    # add your own API key in .env if required
npm run dev
```

## Impact

- Faster decisions and fewer drilling delays
- Lower non-productive time (NPT) costs
- Better safety for rig floor crews
- Reduced environmental risk from mud spills

## Team OJAS

Built for Smart India Hackathon 2026.

## Note on Data

This repository uses sample or dummy data only. No real or confidential well data is included.
