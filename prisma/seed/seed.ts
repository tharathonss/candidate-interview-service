import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
async function main() {
    const email = "admin@example.com";
    const passwordHash = await bcrypt.hash("Admin#1234", 10);
    await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email, passwordHash, role: "ADMIN" },
    });
    console.log("Seeded admin:", email, "password=Admin#1234");
}
main().finally(async () => prisma.$disconnect());
