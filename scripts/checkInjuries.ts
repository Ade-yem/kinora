import "dotenv/config";
import { prisma } from "../lib/db";

const main = async () => {
    const user = await prisma.user.findUnique({
        where: {
            email: "adejumoadeyemi32@gmail.com"
        },
        include: {
            profile: true
        }
    })
    console.log(JSON.stringify(user, null, 2));
}

main()