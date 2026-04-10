import { spawn } from 'node:child_process';
import process from 'node:process';

function runCommand(command) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      cwd: process.cwd(),
      env: process.env,
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

async function main() {
  await runCommand('npm run build:runtime-packages');
  const webPort = process.env.WEB_PORT ?? '3100';
  const child = spawn(
    `npm run dev:e2e --workspace=@apps/web -- --hostname 127.0.0.1 --port ${webPort}`,
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PORT: webPort,
        HOSTNAME: '127.0.0.1'
      },
      shell: true,
      stdio: 'inherit'
    }
  );

  const forwardSignal = (signal) => {
    child.kill(signal);
  };

  process.on('SIGINT', forwardSignal);
  process.on('SIGTERM', forwardSignal);

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
