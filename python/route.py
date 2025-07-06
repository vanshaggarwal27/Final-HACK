#!/usr/bin/env python3
"""
Route optimization script using OSRM and Folium with emissions.
"""

import pandas as pd
import numpy as np
import networkx as nx
import folium
import requests
from pathlib import Path

# CONFIG
MAPTILER_KEY = "2sYJ1vozDNyamVYRoWLM"
threshold = 10.0
N = 5
EMISSION_FACTOR_KG_PER_KM = 0.27

# Paths
base_dir = Path(__file__).parent.parent
data_dir = base_dir / "python" / "data" / "processed"
uploads_dir = base_dir / "uploads"

# Load predictions
preds_file = data_dir / "predictions.csv"
if not preds_file.exists():
    raise FileNotFoundError(f"{preds_file} not found")

preds = pd.read_csv(preds_file)
preds["date"] = pd.to_datetime(preds["date"])
preds["state_id"] = preds["store_id"].str[:2] if "store_id" in preds.columns else preds["id"].str.split("_").str[3]

# Aggregate demand
state_demand = preds.groupby("state_id")["prediction" if "prediction" in preds.columns else "predicted_demand"].sum().reset_index()
print("Aggregated predicted demand per state:\n", state_demand)

# Filter
selected_states = state_demand[state_demand.iloc[:,1] > threshold]
print("Selected states:\n", selected_states)

# Load stores
stores_file = uploads_dir / "store_locations.csv"
if not stores_file.exists():
    raise FileNotFoundError(f"{stores_file} not found")
stores = pd.read_csv(stores_file)

routes_df = stores[stores["state"].isin(selected_states["state_id"])]
routes_df = routes_df.head(N)

if routes_df.empty:
    raise ValueError("No stores selected for routing")

print("Selected stores:\n", routes_df[["name", "state", "latitude", "longitude"]])

# Distance matrix
def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    phi1 = np.radians(lat1)
    phi2 = np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlambda = np.radians(lon2 - lon1)
    a = np.sin(dphi/2)**2 + np.cos(phi1)*np.cos(phi2)*np.sin(dlambda/2)**2
    return R * 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))

dist_matrix = {}
store_names = routes_df["name"].tolist()
for i, s1 in routes_df.iterrows():
    for j, s2 in routes_df.iterrows():
        dist = haversine(s1["latitude"], s1["longitude"], s2["latitude"], s2["longitude"])
        dist_matrix[(s1["name"], s2["name"])] = dist

# TSP
G = nx.complete_graph(len(store_names))
mapping = dict(zip(range(len(store_names)), store_names))
G = nx.relabel_nodes(G, mapping)

for i in store_names:
    for j in store_names:
        if i != j:
            G[i][j]["weight"] = dist_matrix[(i, j)]

route = nx.approximation.traveling_salesman_problem(G, weight="weight", cycle=False)
print("\nOptimal visiting order:")
print(route)

# Folium map
start_lat = routes_df.iloc[0]["latitude"]
start_lon = routes_df.iloc[0]["longitude"]

m = folium.Map(
    location=[start_lat, start_lon],
    zoom_start=6,
    tiles=None
)
folium.TileLayer(
    tiles=f"https://api.maptiler.com/maps/streets/{{z}}/{{x}}/{{y}}.png?key={MAPTILER_KEY}",
    attr='MapTiler',
    name='MapTiler Streets',
    max_zoom=20,
).add_to(m)

# Markers
for _, row in routes_df.iterrows():
    folium.Marker(
        [row["latitude"], row["longitude"]],
        popup=f"{row['name']} ({row['state']})",
        icon=folium.Icon(color="blue", icon="shopping-cart", prefix="fa")
    ).add_to(m)

# OSRM routing
total_distance_km = 0
total_emissions_kg = 0

for i in range(len(route)-1):
    store_a = routes_df[routes_df["name"]==route[i]].iloc[0]
    store_b = routes_df[routes_df["name"]==route[i+1]].iloc[0]

    url = (
        f"https://router.project-osrm.org/route/v1/driving/"
        f"{store_a['longitude']},{store_a['latitude']};"
        f"{store_b['longitude']},{store_b['latitude']}"
        f"?overview=full&geometries=geojson"
    )
    response = requests.get(url)
    data = response.json()

    if "routes" not in data:
        print(f"Error retrieving route from {route[i]} to {route[i+1]}: {data}")
        continue

    distance_km = data["routes"][0]["distance"]/1000
    emission_kg = distance_km * EMISSION_FACTOR_KG_PER_KM
    total_distance_km += distance_km
    total_emissions_kg += emission_kg

    coords = data["routes"][0]["geometry"]["coordinates"]
    latlon_coords = [(lat, lon) for lon, lat in coords]

    folium.PolyLine(
        latlon_coords,
        color="red",
        weight=3,
        opacity=0.8,
        tooltip=f"{distance_km:.1f} km, {emission_kg:.1f} kg CO2"
    ).add_to(m)

# Summary
summary_html = f"""
<div style="
    position: fixed;
    bottom: 50px;
    left: 50px;
    width: 250px;
    padding: 15px;
    background-color: rgba(255,255,255,0.9);
    border: 2px solid #333;
    border-radius: 8px;
    box-shadow: 2px 2px 6px rgba(0,0,0,0.3);
    font-family: Arial, sans-serif;
    z-index: 9999;
">
<h4 style="margin:0 0 10px 0; font-size:16px; color:#333;">Total Route Summary</h4>
<p style="margin:0; font-size:14px;"><strong>Distance:</strong> {total_distance_km:.1f} km</p>
<p style="margin:0; font-size:14px;"><strong>CO₂ Emissions:</strong> {total_emissions_kg:.1f} kg</p>
</div>
"""
m.get_root().html.add_child(folium.Element(summary_html))

# Save map
output_map = data_dir / "delivery_route_maptiler_osrm_co2.html"
m.save(output_map)
print(f"\n✅ Saved interactive map to {output_map}")
