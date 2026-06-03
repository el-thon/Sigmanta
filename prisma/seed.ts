import { prisma } from "../src/lib/prisma";
import { DEFAULT_RISK_LEVELS } from "../src/constants/defaultLayers";
import bcrypt from "bcryptjs";

async function main() {
  const demoPassword = await bcrypt.hash("password123", 10);

  for (const item of DEFAULT_RISK_LEVELS) {
    await prisma.riskLevel.upsert({
      where: { code: item.code },
      update: item,
      create: item,
    });
  }

  await prisma.user.upsert({
    where: { email: "admin@sigmanta.test" },
    update: {
      name: "Admin SIGMANTA",
      password: demoPassword,
      role: "admin",
    },
    create: {
      name: "Admin SIGMANTA",
      email: "admin@sigmanta.test",
      password: demoPassword,
      role: "admin",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
