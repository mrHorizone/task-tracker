import {PrismaClient, Status} from '@prisma/client';

const prisma = new PrismaClient();

export const initialTasks = [
    {
        title: 'Postgres integration',
        text: 'Understand controllers and services',
        status: Status.TODO,
    },
    {
        title: 'Statuses',
        text: 'Implement statuses for task. Most likely TODO, IN_PROGRESS, DONE',
        status: Status.TODO,
    },
    {
        title: 'Implement authentication',
        text: 'User entity | Login form | JWT',
        status: Status.TODO,
    },
    {
        title: 'Task creator/assignee',
        text: 'Add creators field for task and assignee managing',
        status: Status.TODO,
    },
    {
        title: 'Notification service',
        text: 'Implement a notification service for task changes',
        status: Status.TODO,
    },
    {
        title: 'Use messages broker',
        text: 'Use any message broker to implement some high load task',
        status: Status.TODO,
    },
];

async function main() {
    await prisma.task.deleteMany();
    try {
        await prisma.$executeRawUnsafe(
            `ALTER SEQUENCE "Task_id_seq" RESTART WITH 1;`,
        );
    } catch (err) {
        // If sequence name is different or not supported, ignore
    }
    await prisma.task.createMany({
        data: initialTasks,
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
