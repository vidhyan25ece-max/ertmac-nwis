"""
eRTMAC-NWIS (Nearby Wells Intelligence System)
SIH Problem Statement: SIH26121
Drilling Decision-Support System for Oil & Gas Operations
Run locally via: streamlit run app.py
"""

import streamlit as st
import pandas as pd
import numpy as np

# Set page configuration
st.set_page_config(
    page_title="eRTMAC-NWIS — Nearby Wells Intelligence",
    page_icon="🛢️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom Industrial Dark Navy CSS
st.markdown(
    """
<style>
    .stApp {
        background-color: #060a14;
        color: #f1f5f9;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .metric-card {
        background-color: #0c1427;
        border: 1px solid #1e293b;
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 10px;
    }
    .hazard-critical {
        background-color: rgba(127, 29, 29, 0.4);
        border: 1px solid #ef4444;
        border-radius: 6px;
        padding: 14px;
        margin-bottom: 12px;
    }
    .hazard-title {
        color: #f87171;
        font-weight: 700;
        font-size: 14px;
        font-family: monospace;
    }
</style>
""",
    unsafe_allow_html=True,
)

# Synthetic Data for 12 Offset Wells
OFFSET_WELLS = [
    {
        "Well ID": "OFF-A01",
        "Name": "Kaveri-Deep-01",
        "Distance (km)": 1.8,
        "Azimuth (°)": 42,
        "Lat": 19.3540,
        "Lon": 71.8670,
        "Max Depth (m)": 3520,
        "Formation": "Panna Formation",
        "Mud Weight (SG)": 1.38,
        "Incident": "Stuck Pipe",
        "Incident Depth (m)": 2415,
        "NPT (hrs)": 64,
        "Report": "WCR-OFF-A01-Ch4.pdf",
        "Summary": "Differential sticking while reaming across depleted sand stringer with 1.38 SG mud.",
        "Mitigation": "Cap mud weight at 1.34 SG. Add lubricant beads. Limit stationary time < 120s.",
    },
    {
        "Well ID": "OFF-B04",
        "Name": "D-33-East-02",
        "Distance (km)": 2.4,
        "Azimuth (°)": 118,
        "Lat": 19.3320,
        "Lon": 71.8745,
        "Max Depth (m)": 3280,
        "Formation": "Bassein Limestone",
        "Mud Weight (SG)": 1.22,
        "Incident": "Mud Loss",
        "Incident Depth (m)": 1985,
        "NPT (hrs)": 18,
        "Report": "DDR-B04-032.pdf",
        "Summary": "Partial mud loss (35 bbl/hr) escalating to 65 bbl/hr in vuggy coral reef facies.",
        "Mitigation": "Pre-treat active system with 15 ppb medium calcium carbonate prior to 1,950m.",
    },
    {
        "Well ID": "OFF-C02",
        "Name": "Neelam-North-05",
        "Distance (km)": 3.1,
        "Azimuth (°)": 285,
        "Lat": 19.3490,
        "Lon": 71.8260,
        "Max Depth (m)": 3600,
        "Formation": "Panna Formation",
        "Mud Weight (SG)": 1.44,
        "Incident": "Mud Loss",
        "Incident Depth (m)": 2442,
        "NPT (hrs)": 92,
        "Report": "WCR-NL05-Final.pdf",
        "Summary": "Catastrophic total circulation loss due to high mud weight (1.44 SG) exceeding fracture gradient.",
        "Mitigation": "Mandate strict ECD control (< 0.05 SG over static mud weight). Do NOT exceed 1.36 SG.",
    },
    {
        "Well ID": "OFF-D09",
        "Name": "Heera-Deep-09",
        "Distance (km)": 4.6,
        "Azimuth (°)": 195,
        "Lat": 19.3020,
        "Lon": 71.8420,
        "Max Depth (m)": 3350,
        "Formation": "Panna Formation",
        "Mud Weight (SG)": 1.32,
        "Incident": "Gas Influx / Kick",
        "Incident Depth (m)": 2395,
        "NPT (hrs)": 36,
        "Report": "DDR-HD09-Day41.pdf",
        "Summary": "Gas kick after drilling break. Pit gain 22 bbls. SIDPP 380 psi, SICP 460 psi.",
        "Mitigation": "Mandate immediate 10-minute flow check upon any ROP doubling. Keep degasser on standby.",
    },
    {
        "Well ID": "OFF-E03",
        "Name": "Ratna-Step-01",
        "Distance (km)": 5.2,
        "Azimuth (°)": 15,
        "Lat": 19.3880,
        "Lon": 71.8680,
        "Max Depth (m)": 3110,
        "Formation": "Middle Miocene Claystone",
        "Mud Weight (SG)": 1.16,
        "Incident": "Stuck Pipe",
        "Incident Depth (m)": 1220,
        "NPT (hrs)": 28,
        "Report": "DDR-RS01-Day19.pdf",
        "Summary": "Mechanical pipe pack-off due to reactive gumbo shale swelling during tripping out.",
        "Mitigation": "Maintain KCl concentration > 6% wt and run viscous sweeps every 45m.",
    },
    {
        "Well ID": "OFF-F07",
        "Name": "Sagar-Kiran-07",
        "Distance (km)": 6.8,
        "Azimuth (°)": 145,
        "Lat": 19.2910,
        "Lon": 71.8920,
        "Max Depth (m)": 3740,
        "Formation": "Lower Carbonate",
        "Mud Weight (SG)": 1.26,
        "Incident": "Mud Loss",
        "Incident Depth (m)": 2915,
        "NPT (hrs)": 44,
        "Report": "WCR-SK07-Ch6.pdf",
        "Summary": "Severe lost circulation (120 bbl/hr) in karstified fracture zone adjacent to fault line.",
        "Mitigation": "Reduce pump rate to 450 GPM and reduce mud weight to 1.21 SG prior to 2,900m.",
    },
    {
        "Well ID": "OFF-G11",
        "Name": "D-33-South-04",
        "Distance (km)": 7.5,
        "Azimuth (°)": 172,
        "Lat": 19.2750,
        "Lon": 71.8650,
        "Max Depth (m)": 3420,
        "Formation": "Panna Formation",
        "Mud Weight (SG)": 1.36,
        "Incident": "Stuck Pipe",
        "Incident Depth (m)": 2420,
        "NPT (hrs)": 16,
        "Report": "DDR-DS04-Day50.pdf",
        "Summary": "High torque (29 kft-lb) and 70 klbs overpull on every stand during back-reaming.",
        "Mitigation": "Increase hole cleaning flow rate to 600 GPM; run reamer with bi-directional cutting structure.",
    },
    {
        "Well ID": "OFF-H05",
        "Name": "Bassein-Depleted-03",
        "Distance (km)": 8.9,
        "Azimuth (°)": 320,
        "Lat": 19.4030,
        "Lon": 71.7980,
        "Max Depth (m)": 2850,
        "Formation": "Bassein Limestone",
        "Mud Weight (SG)": 1.18,
        "Incident": "Stuck Pipe",
        "Incident Depth (m)": 1910,
        "NPT (hrs)": 52,
        "Report": "DDR-BD03-Day28.pdf",
        "Summary": "Differential sticking in depleted reservoir pocket (overbalance 2,200 psi).",
        "Mitigation": "Update pore pressure model using RDT/MDT pre-drill data. Limit stationary pipe time.",
    },
    {
        "Well ID": "OFF-I14",
        "Name": "Western-Flank-14",
        "Distance (km)": 10.3,
        "Azimuth (°)": 250,
        "Lat": 19.3110,
        "Lon": 71.7610,
        "Max Depth (m)": 3900,
        "Formation": "Deccan Trap Basalt",
        "Mud Weight (SG)": 1.25,
        "Incident": "Equipment Failure",
        "Incident Depth (m)": 3180,
        "NPT (hrs)": 34,
        "Report": "WCR-WF14-Bits.pdf",
        "Summary": "PDC bit delaminated upon encountering basalt stringers with 32,000 psi compressive strength.",
        "Mitigation": "Switch to hybrid roller-cone / impregnated diamond bit at 3,120m.",
    },
    {
        "Well ID": "OFF-J06",
        "Name": "Alcock-Shelf-06",
        "Distance (km)": 11.5,
        "Azimuth (°)": 65,
        "Lat": 19.3850,
        "Lon": 71.9510,
        "Max Depth (m)": 3050,
        "Formation": "Panna Formation",
        "Mud Weight (SG)": 1.35,
        "Incident": "Stuck Pipe",
        "Incident Depth (m)": 2408,
        "NPT (hrs)": 40,
        "Report": "WCR-AS06-Casing.pdf",
        "Summary": "9-5/8 inch casing stuck 14m off bottom at 2,408m due to swelling shale bridge.",
        "Mitigation": "Condition hole thoroughly with tandem polymer sweep before casing run.",
    },
    {
        "Well ID": "OFF-K08",
        "Name": "Panna-Horizon-08",
        "Distance (km)": 12.8,
        "Azimuth (°)": 210,
        "Lat": 19.2420,
        "Lon": 71.7920,
        "Max Depth (m)": 3480,
        "Formation": "Panna Formation",
        "Mud Weight (SG)": 1.40,
        "Incident": "Mud Loss",
        "Incident Depth (m)": 2430,
        "NPT (hrs)": 22,
        "Report": "DDR-PH08-Day46.pdf",
        "Summary": "Sloughing shale prompted mud weight increase to 1.40 SG, inducing micro-fracturing and 45 bbl/hr losses.",
        "Mitigation": "Maintain mud weight 1.33 - 1.36 SG; rely on chemical inhibition rather than excess density.",
    },
    {
        "Well ID": "OFF-L12",
        "Name": "Eastern-Trough-12",
        "Distance (km)": 14.2,
        "Azimuth (°)": 95,
        "Lat": 19.3300,
        "Lon": 71.9880,
        "Max Depth (m)": 3310,
        "Formation": "Bassein Limestone",
        "Mud Weight (SG)": 1.20,
        "Incident": "Gas Influx / Kick",
        "Incident Depth (m)": 2010,
        "NPT (hrs)": 30,
        "Report": "DDR-ET12-Day33.pdf",
        "Summary": "H2S gas influx (15 ppm) encountered in upper carbonate member.",
        "Mitigation": "Maintain scavenger pill on deck; continuous H2S sensor calibration prior to 1,950m.",
    },
]

df_wells = pd.DataFrame(OFFSET_WELLS)

# Active Well Specifications
ACTIVE_WELL = {
    "Name": "ACT-RIG-07 (D-33 Prospect)",
    "Rig": "Sagar Jyoti Jack-Up",
    "Lat": 19.3421,
    "Lon": 71.8542,
    "Target Depth": 3450,
}

# SIDEBAR NAVIGATION
st.sidebar.markdown("## **eRTMAC-NWIS**")
st.sidebar.caption("Nearby Wells Intelligence System | SIH26121")
st.sidebar.markdown("`● PROTOTYPE ONLINE`")

nav_choice = st.sidebar.radio(
    "Navigation",
    ["Dashboard", "Nearby Wells GIS", "Historical Intelligence", "Risk Prediction", "Alerts & Evidence"],
)

st.sidebar.markdown("---")
st.sidebar.subheader("Active Bit Telemetry")
active_depth = st.sidebar.slider("Active Depth MD (m)", 500, 3450, 2360, step=5)
mud_weight = st.sidebar.slider("Mud Weight (SG)", 1.10, 1.60, 1.37, step=0.01)
torque = st.sidebar.slider("Rotary Torque (kft-lb)", 5.0, 35.0, 18.2, step=0.5)
rop = st.sidebar.slider("Rate of Penetration (m/hr)", 2.0, 45.0, 14.5, step=0.5)

# Calculate ML Risk Scores
stuck_pipe_risk = int(min(96, max(8, 20 + (mud_weight - 1.30) * 120 + (torque > 18) * 20 + (abs(active_depth - 2415) < 70) * 35)))
mud_loss_risk = int(min(98, max(5, 15 + (mud_weight - 1.35) * 150 + (abs(active_depth - 2442) < 60) * 40 + (abs(active_depth - 1985) < 60) * 35)))

st.sidebar.markdown("---")
st.sidebar.markdown(f"**Stuck Pipe Risk:** `{stuck_pipe_risk}%`")
st.sidebar.markdown(f"**Mud Loss Risk:** `{mud_loss_risk}%`")
st.sidebar.caption("Prototype using synthetic demonstration data — not for real drilling decisions.")

# HEADER
col_h1, col_h2 = st.columns([3, 1])
with col_h1:
    st.title("eRTMAC-NWIS")
    st.subheader("Nearby Wells Intelligence System")
with col_h2:
    st.markdown("### `● PROTOTYPE ONLINE`")
    st.caption("Western Offshore Basin • Rig: Sagar Jyoti")

st.info("Prototype using synthetic demonstration data — not for real drilling decisions.")

# 1. DASHBOARD
if nav_choice == "Dashboard":
    # Proximity alerts calculation
    imminent_alerts = [w for w in OFFSET_WELLS if abs(active_depth - w["Incident Depth (m)"]) <= 80]
    
    if imminent_alerts:
        alert = imminent_alerts[0]
        delta = active_depth - alert["Incident Depth (m)"]
        st.error(
            f"⚠️ **CRITICAL LOOK-AHEAD WARNING**: Bit at {active_depth}m is {abs(delta)}m from historical {alert['Incident']} "
            f"in offset well {alert['Name']} ({alert['Distance (km)']} km away, {alert['Incident Depth (m)']}m). "
            f"Historical NPT: {alert['NPT (hrs)']} hours!\n\n"
            f"**Mitigation Protocol:** {alert['Mitigation']}"
        )

    # Metric Row
    m1, m2, m3, m4, m5 = st.columns(5)
    m1.metric("Current Depth (MD)", f"{active_depth} m", f"{active_depth - 2415}m to Panna Sticking")
    m2.metric("Stuck Pipe Risk", f"{stuck_pipe_risk}%", "Differential margin")
    m3.metric("Mud Loss Risk", f"{mud_loss_risk}%", "Fracture margin")
    m4.metric("Mud Weight", f"{mud_weight} SG", "Static density")
    m5.metric("Monitored Offsets", f"{len(OFFSET_WELLS)} wells", "15 km radius")

    st.markdown("---")
    c_left, c_right = st.columns([1, 1])

    with c_left:
        st.subheader("Subsurface Look-Ahead Stratigraphy")
        formations = [
            ("Recent Alluvium", 0, 650, "#334155"),
            ("Miocene Claystone", 650, 1420, "#1e293b"),
            ("Bassein Limestone", 1420, 2150, "#0f3a53"),
            ("Panna Marine Shale (HAZARD)", 2150, 2680, "#7f1d1d"),
            ("Lower Carbonate", 2680, 3120, "#134e4a"),
            ("Deccan Trap Basalt", 3120, 3600, "#262626"),
        ]
        for name, top, btm, color in formations:
            is_in = top <= active_depth <= btm
            prefix = "👉 **CURRENT:** " if is_in else ""
            st.markdown(f"{prefix}**{name}** ({top}m – {btm}m)")

    with c_right:
        st.subheader("Historical Offset Proximity Matrix")
        df_proximity = df_wells.copy()
        df_proximity["Depth Delta (m)"] = active_depth - df_proximity["Incident Depth (m)"]
        df_proximity["Abs Delta"] = df_proximity["Depth Delta (m)"].abs()
        df_sorted = df_proximity.sort_values(by="Abs Delta")[
            ["Name", "Distance (km)", "Incident", "Incident Depth (m)", "Depth Delta (m)", "NPT (hrs)"]
        ]
        st.dataframe(df_sorted, use_container_width=True)

# 2. NEARBY WELLS GIS
elif nav_choice == "Nearby Wells GIS":
    st.subheader("GIS Offset Wells Spatial Layout")
    st.caption("Active Well: ACT-RIG-07 (0,0) with 12 offset wellheads")

    st.dataframe(
        df_wells[["Well ID", "Name", "Distance (km)", "Azimuth (°)", "Max Depth (m)", "Formation", "Incident", "Incident Depth (m)"]],
        use_container_width=True,
    )

# 3. HISTORICAL INTELLIGENCE
elif nav_choice == "Historical Intelligence":
    st.subheader("WCR & DDR Drilling Report Intelligence Search")
    q = st.text_input("Search reports by keyword (e.g. 'stuck pipe', 'mud loss', 'Panna', 'overbalance'):")

    if q:
        filtered = df_wells[
            df_wells["Name"].str.contains(q, case=False)
            | df_wells["Incident"].str.contains(q, case=False)
            | df_wells["Formation"].str.contains(q, case=False)
            | df_wells["Summary"].str.contains(q, case=False)
        ]
    else:
        filtered = df_wells

    st.markdown(f"**Found {len(filtered)} matching offset records (Total NPT: {filtered['NPT (hrs)'].sum()} hrs)**")
    for _, row in filtered.iterrows():
        with st.expander(f"{row['Well ID']} - {row['Name']} ({row['Incident']} at {row['Incident Depth (m)']}m)"):
            st.write(f"**Report Source:** {row['Report']}")
            st.write(f"**Formation:** {row['Formation']} | **Mud Weight:** {row['Mud Weight (SG)']} SG")
            st.write(f"**Incident Summary:** {row['Summary']}")
            st.write(f"**Lessons Learned / Mitigation:** {row['Mitigation']}")
            st.write(f"**Non-Productive Time:** {row['NPT (hrs)']} hours")

# 4. RISK PREDICTION
elif nav_choice == "Risk Prediction":
    st.subheader("ML Hazard Prediction Simulator & SHAP Feature Drivers")
    p1, p2, p3 = st.columns(3)
    p1.metric("Predicted Stuck Pipe Risk", f"{stuck_pipe_risk}%")
    p2.metric("Predicted Mud Loss Risk", f"{mud_loss_risk}%")
    p3.metric("Composite Hazard Level", "CRITICAL" if max(stuck_pipe_risk, mud_loss_risk) > 60 else "MODERATE")

    st.markdown("#### SHAP Feature Contributions:")
    st.write(f"- **Hydrostatic Overbalance:** +{int(abs(mud_weight - 1.30) * 100)}% risk driver")
    st.write(f"- **Offset Proximity Correlation:** +{35 if abs(active_depth - 2415) < 70 else 10}% correlation")
    st.write(f"- **Rotary Torque Stress:** +{20 if torque > 18 else 5}% mechanical load")

# 5. ALERTS & EVIDENCE
elif nav_choice == "Alerts & Evidence":
    st.subheader("Real-Time Proximity Alerts & Evidence Audit Trail")
    for w in OFFSET_WELLS:
        delta = active_depth - w["Incident Depth (m)"]
        if abs(delta) <= 120:
            st.warning(
                f"**ALERT**: Bit at {active_depth}m is within {abs(delta)}m of {w['Name']} {w['Incident']} at {w['Incident Depth (m)']}m.\n\n"
                f"- **Historical NPT:** {w['NPT (hrs)']} hrs\n"
                f"- **DDR Source:** {w['Report']}\n"
                f"- **Mitigation Action:** {w['Mitigation']}"
            )
