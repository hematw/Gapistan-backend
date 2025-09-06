import connectDB from "../db/connect.js";
import User from "../models/User.js";
import { config } from "dotenv";
config();

await connectDB(process.env.MONGO_URI);

async function seedUser() {
  try {
    const existing = await User.findOne({ email: "admin@example.com" });
    if (existing) {
      console.log("Admin user already exists");
      process.exit(0);
    }

    const user = new User({
      username: "admin",
      email: "admin@example.com",
      password: "$2b$10$9zXRPQmQ.ypyeZsL4f1TDewWEbObVFCPlnHJSxkSOMEw27xMQx88y",
      createdAt: new Date("2025-04-21T20:17:20.203Z"),
      updatedAt: new Date("2025-06-27T20:28:25.592Z"),
      lastSeen: null,
      isOnline: true,
      bio: "It is not finish, until you try.",
      firstName: "admin",
      lastName: "admin",
      phone: "",
      profile: "/uploads/1746391883056-black-boy-inspired-by-the-boondocks.jpg",
      verifiedAt: new Date("2025-05-17T16:35:45.043Z"),
      publicKey: {
        crv: "P-256",
        ext: true,
        key_ops: [],
        kty: "EC",
        x: "qQDmCSlHnugI_a4mgdJ-NSh4ynQNEcMM2EmR7AY-BIw",
        y: "zBuUTrt6WTydGtX-JDkziD-UNVcE0XLLM9tNK1pzsc0",
      },
      rsaPublicKey: {
        alg: "RSA-OAEP-256",
        e: "AQAB",
        ext: true,
        key_ops: ["encrypt"],
        kty: "RSA",
        n: "oYG1HMOLIliCOIBtOMo1QvlIs8CRXPnQrxQkXX9fVk3Gfrp_8Vq692rKg9IzAucDpkSmLNZtDgTnAKhO6iMtLJQTZg5wuPa08VXrg4EtLPI7HMvbiZQiEHs117PeuqvuSHwIC4eM0_1lTCMSPOECxSySUzCsPai6KBIkeb4gU4cP7GeMIuvKSNE64TqqDvjFiZsLpPgwpF6kzTeOa5xqMK_7H76OYFwrJgWWmylQ0bFy8u8HMHsd4f4Zo4mfyXEni9M4quQsMB0hCjWMZAzvSLZb-KadtBQso4OHmXmvS86vFEG76dP3wG7EZgFFhCIevcLsamqy8WjYb4hjippifw",
      },
    });

    await user.save();
    console.log("Admin user seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding user:", err);
    process.exit(1);
  }
}

seedUser();
