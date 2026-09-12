import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import csv from "csv-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory cache for CSV data
let medicinesCache = null;
let loadPromise = null;

/**
 * Get medicine data from CSV with in-memory caching
 * @returns {Promise<Array>}
 */
export async function getMedicines() {
  if (medicinesCache) {
    return medicinesCache;
  }
  if (loadPromise) {
    return loadPromise;
  }

  const csvPath = path.join(__dirname, "..", "data", "A_Z_medicines_dataset_of_India.csv");

  loadPromise = new Promise((resolve, reject) => {
    const medicines = [];

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (data) => {
        medicines.push({
          id: data.id,
          name: data.name,
          price: data["price(₹)"],
          manufacturer: data.manufacturer_name,
          type: data.type,
          packSize: data.pack_size_label,
          composition1: data.short_composition1,
          composition2: data.short_composition2,
        });
      })
      .on("end", () => {
        medicinesCache = medicines;
        loadPromise = null;
        resolve(medicines);
      })
      .on("error", (err) => {
        loadPromise = null;
        reject(err);
      });
  });

  return loadPromise;
}

/**
 * Express handler for GET /api/medicines
 */
export async function getMedicinesHandler(req, res) {
  try {
    const medicines = await getMedicines();

    const { search } = req.query;
    if (search) {
      const query = search.toLowerCase();
      const filtered = medicines.filter((med) =>
        med.name?.toLowerCase().includes(query)
      );
      return res.json(filtered);
    }

    return res.json(medicines);
  } catch (err) {
    console.error("Error getting medicine data:", err);
    res.status(500).json({ message: "Failed to retrieve medicine data" });
  }
}
