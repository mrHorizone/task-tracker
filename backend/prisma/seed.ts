import {PrismaClient, Status} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
    await prisma.task.deleteMany();
    await prisma.user.deleteMany();

    try {
        await prisma.$executeRawUnsafe(
            `ALTER SEQUENCE "Task_id_seq" RESTART WITH 1;`,
        );
    } catch (err) {
        // If sequence name is different or not supported, ignore
    }

    try {
        await prisma.$executeRawUnsafe(
            `ALTER SEQUENCE "User_id_seq" RESTART WITH 1;`,
        );
    } catch (err) {
        // If sequence name is different or not supported, ignore
    }

    const hashedPassword = await bcrypt.hash('123', SALT_ROUNDS);

    const tommy = await prisma.user.create({
        data: {
            login: 'Tommy',
            password: hashedPassword,
        },
    });

    const jerry = await prisma.user.create({
        data: {
            login: 'Jerry',
            password: hashedPassword,
        },
    });

    const tasks = [
        {
            title: 'Postgres integration',
            text: 'Understand controllers and services',
            status: Status.DONE,
            authorId: tommy.id,
            updatedById: jerry.id,
        },
        {
            title: 'Statuses',
            text: 'Implement statuses for task. Most likely TODO, IN_PROGRESS, DONE',
            status: Status.DONE,
            authorId: tommy.id,
            updatedById: tommy.id,
        },
        {
            title: 'Implement authentication',
            text: 'User entity | Login form | JWT',
            status: Status.DONE,
            authorId: jerry.id,
            updatedById: tommy.id,
        },
        {
            title: 'Task creator/assignee',
            text: 'Add creators field for task and assignee managing',
            status: Status.IN_PROGRESS,
            authorId: tommy.id,
            updatedById: null,
        },
        {
            title: 'Notification service',
            text: 'Implement a notification service for task changes',
            status: Status.IN_PROGRESS,
            authorId: jerry.id,
            updatedById: null,
        },
        {
            title: 'Use messages broker',
            text: 'Use any message broker to implement some high load task',
            status: Status.TODO,
            authorId: tommy.id,
            updatedById: null,
        },
    ];

    await prisma.task.createMany({
        data: tasks,
    });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
