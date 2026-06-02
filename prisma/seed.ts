import { prisma } from "../src/lib/prisma";
import { DEFAULT_RISK_LEVELS } from "../src/constants/defaultLayers";

async function main() {
  for (const item of DEFAULT_RISK_LEVELS) {
    await prisma.riskLevel.upsert({
      where: { code: item.code },
      update: item,
      create: item,
    });
  }
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
