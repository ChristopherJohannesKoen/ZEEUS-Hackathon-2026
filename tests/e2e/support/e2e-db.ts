import { PrismaClient, Role } from '@prisma/client';
import { spawn } from 'node:child_process';
import process from 'node:process';
import {
  getAdminDatabaseUrl,
  getE2EDatabaseName,
  getE2EDatabaseUrl,
  getE2EEnv,
  loadE2EEnv
} from './e2e-env';

type ResetMode = 'baseline' | 'empty';

type SeedUser = {
  email: string;
  password: string;
  name: string;
  role: Role;
};

loadE2EEnv();

const seedUsers: Record<'owner' | 'admin' | 'member', SeedUser> = {
  owner: {
    email: process.env.SEED_OWNER_EMAIL ?? 'owner@example.com',
    password: process.env.SEED_OWNER_PASSWORD ?? 'ChangeMe123!',
    name: 'Template Owner',
    role: Role.owner
  },
  admin: {
    email: 'admin@example.com',
    password: 'ChangeMe123!',
    name: 'Template Admin',
    role: Role.admin
  },
  member: {
    email: 'member@example.com',
    password: 'ChangeMe123!',
    name: 'Template Member',
    role: Role.member
  }
};

function createPrismaClient(url = getE2EDatabaseUrl()) {
  return new PrismaClient({
    datasources: {
      db: {
        url
      }
    }
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function clearTemplateData(prisma: PrismaClient) {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
  `;

  if (tables.length === 0) {
    return;
  }

  const quotedTables = tables
    .map(({ tablename }) => `"public"."${tablename.replaceAll('"', '""')}"`)
    .join(', ');

  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quotedTables} RESTART IDENTITY CASCADE`);
}

async function seedBaselineData(prisma: PrismaClient) {
  const seedResult = await runSeed();

  if (seedResult.exitCode !== 0) {
    throw new Error(
      `Full seed failed during E2E baseline reset.\nSTDOUT:\n${seedResult.stdout}\nSTDERR:\n${seedResult.stderr}`
    );
  }
}

export async function waitForPostgres(timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;

  while (Date.now() < deadline) {
    const prisma = createPrismaClient(getAdminDatabaseUrl());

    try {
      await prisma.$queryRaw`SELECT 1`;
      return;
    } catch (error) {
      lastError = error;
      await sleep(1_000);
    } finally {
      await prisma.$disconnect();
    }
  }

  throw new Error(`Timed out waiting for PostgreSQL. Last error: ${String(lastError)}`);
}

export async function ensureE2EDatabaseExists() {
  const databaseName = getE2EDatabaseName();
  const prisma = createPrismaClient(getAdminDatabaseUrl());

  try {
    const existing = await prisma.$queryRaw<Array<{ datname: string }>>`
      SELECT datname
      FROM pg_database
      WHERE datname = ${databaseName}
    `;

    if (existing.length > 0) {
      return;
    }

    const escapedName = databaseName.replaceAll('"', '""');
    await prisma.$executeRawUnsafe(`CREATE DATABASE "${escapedName}"`);
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('already exists')) {
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

function runCommand(command: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, {
      cwd: process.cwd(),
      env: getE2EEnv(),
      shell: true,
      stdio: 'inherit'
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Command failed with exit code ${code}: ${command}`));
    });
  });
}

export async function runMigrations() {
  await runCommand('npm run prisma:migrate:deploy --workspace=@packages/db');
}

export async function runSeed(envOverrides: Record<string, string> = {}) {
  return new Promise<{ exitCode: number; stderr: string; stdout: string }>((resolve, reject) => {
    const child = spawn('npm run seed --workspace=@packages/db', {
      cwd: process.cwd(),
      env: {
        ...getE2EEnv(),
        ...envOverrides
      },
      shell: true
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      resolve({
        exitCode: code ?? 0,
        stderr,
        stdout
      });
    });
  });
}

export async function resetDatabase(mode: ResetMode) {
  const prisma = createPrismaClient();

  try {
    await clearTemplateData(prisma);

    if (mode === 'baseline') {
      await seedBaselineData(prisma);
    }
  } finally {
    await prisma.$disconnect();
  }
}

export function getSeedUser(role: keyof typeof seedUsers) {
  return seedUsers[role];
}

export async function getBootstrapState() {
  const prisma = createPrismaClient();

  try {
    return prisma.bootstrapState.findUnique({
      where: { id: 1 },
      include: {
        bootstrapOwner: true
      }
    });
  } finally {
    await prisma.$disconnect();
  }
}

export async function countOwners() {
  const prisma = createPrismaClient();

  try {
    return prisma.user.count({
      where: {
        role: Role.owner
      }
    });
  } finally {
    await prisma.$disconnect();
  }
}

export async function countBootstrapStates() {
  const prisma = createPrismaClient();

  try {
    return prisma.bootstrapState.count();
  } finally {
    await prisma.$disconnect();
  }
}
