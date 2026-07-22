import "dotenv/config";
import { prisma } from "../lib/db";

const main = async () => {
    const user = await prisma.user.findUnique({
        where: {
            email: "ayodejiadeyemi17@gmail.com"
        }
    })
    
    // updating the user to be veifieiid
    await prisma.user.update({
        where: {
            id: user?.id
    },
        data: {
            emailVerified: new Date()
        }
    })


}

main()