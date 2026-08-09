import connectDB from "../db/connect.js";
import User from "../models/User.js";
import { config } from "dotenv";

config();

const DEMO_USERS = [
  {
    username: "admin",
    email: "admin@gapistan.local",
    password: "password123",
    firstName: "Admin",
    lastName: "User",
    bio: "Platform administrator",
    isAdmin: true,
  },
  {
    username: "alice",
    email: "alice@gapistan.local",
    password: "password123",
    firstName: "Alice",
    lastName: "Johnson",
    bio: "Hey, I'm Alice!",
  },
  {
    username: "bob",
    email: "bob@gapistan.local",
    password: "password123",
    firstName: "Bob",
    lastName: "Smith",
    bio: "Coffee and code.",
  },
  {
    username: "charlie",
    email: "charlie@gapistan.local",
    password: "password123",
    firstName: "Charlie",
    lastName: "Brown",
    bio: "Good grief!",
  },
  {
    username: "diana",
    email: "diana@gapistan.local",
    password: "password123",
    firstName: "Diana",
    lastName: "Prince",
    bio: "Wonder Woman vibes.",
  },
];

async function seedUsers() {
  await connectDB(process.env.MONGO_URI);

  let created = 0;
  let skipped = 0;

  for (const userData of DEMO_USERS) {
    const existing = await User.findOne({
      $or: [{ email: userData.email }, { username: userData.username }],
    });

    if (existing) {
      console.log(`Skip: ${userData.username} (already exists)`);
      skipped++;
      continue;
    }

    await User.create({
      ...userData,
      verifiedAt: new Date(),
      isOnline: false,
    });

    console.log(`Created: ${userData.username} <${userData.email}>`);
    created++;
  }

  console.log(`\nDone — ${created} created, ${skipped} skipped.`);
  console.log("All demo users use password: password123\n");
  process.exit(0);
}

seedUsers().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
