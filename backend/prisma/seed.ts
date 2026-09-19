import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const initialTasks = [
  {
    title: 'Postgres integration',
    text: 'Understand controllers and services',
  },
  {
    title: 'Statuses',
    text: 'Implement statuses for task. Most likely TODO, IN_PROGRESS, DONE',
  },
  {
    title: 'Implement authentication',
    text: 'User entity | Login form | JWT',
  },
  {
    title: 'Task creator/assignee',
    text: 'Add creators field for task and assignee managing',
  },
  {
    title: 'Notification service',
    text: 'Implement a notification service for task changes',
  },
  {
    title: 'Use messages broker',
    text: 'Use any message broker to implement some high load task',
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
