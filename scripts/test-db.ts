import "dotenv/config";
import { prisma } from "../lib/db";

const main = async () => {
    const user = await prisma.workoutRoutine.deleteMany({
        where: {
            programId: undefined
        }
    })
    
    console.log(user)


}

main()