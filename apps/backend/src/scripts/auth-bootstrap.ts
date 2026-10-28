import { PrismaClient, UserRole } from '@prisma/client';
import * as readline from 'readline';
import { PasswordService } from '../modules/auth/services/password.service';

const prisma = new PrismaClient();
const passwordService = new PasswordService();

function askQuestion(query: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

function parseCliArgs(): {
  email?: string;
  name?: string;
  password?: string;
  force?: boolean;
} {
  const args = process.argv.slice(2);
  const result: Record<string, string | boolean> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.substring(2);
      if (key === 'force') {
        result[key] = true;
      } else if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        result[key] = args[++i];
      }
    }
  }

  return result as any;
}

async function main() {
  console.log('====================================================');
  console.log('🔐 TampilKit AC Booking — CLI Inisialisasi Akun OWNER');
  console.log('====================================================\n');

  const cliArgs = parseCliArgs();

  // 1. Check if an active OWNER already exists
  const existingOwner = await prisma.user.findFirst({
    where: { role: UserRole.OWNER },
  });

  if (existingOwner && !cliArgs.force) {
    console.error('❌ Akun OWNER sudah terdaftar dalam sistem:');
    console.error(`   Email: ${existingOwner.email} (${existingOwner.name})`);
    console.error(
      '\nUntuk alasan keamanan, inisialisasi ulang diblokir. Gunakan --force jika bermaksud menimpa secara sadar.',
    );
    process.exit(1);
  }

  // 2. Obtain inputs (either via CLI args or interactive prompt)
  let email = cliArgs.email;
  if (!email) {
    email = await askQuestion('Masukkan Email Akun Owner: ');
  }

  let name = cliArgs.name;
  if (!name) {
    name = await askQuestion('Masukkan Nama Lengkap Owner: ');
  }

  let password = cliArgs.password;
  if (!password) {
    password = await askQuestion('Masukkan Password (min 12 karakter): ');
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    console.error('❌ Format email tidak valid.');
    process.exit(1);
  }

  if (!name || name.trim().length < 2) {
    console.error('❌ Nama minimal 2 karakter.');
    process.exit(1);
  }

  // 3. Validate Password Policy
  try {
    passwordService.validatePasswordPolicy(password);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`❌ Validasi password gagal: ${msg}`);
    process.exit(1);
  }

  // 4. Hash password with Argon2id
  console.log('\n⏳ Melakukan enkripsi password dengan algoritma Argon2id...');
  const passwordHash = await passwordService.hashPassword(password);

  // 5. Upsert OWNER account
  const user = await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: {
      name: name.trim(),
      passwordHash,
      role: UserRole.OWNER,
      isActive: true,
      tokenVersion: { increment: 1 },
      passwordChangedAt: new Date(),
    },
    create: {
      email: normalizedEmail,
      name: name.trim(),
      passwordHash,
      role: UserRole.OWNER,
      isActive: true,
      tokenVersion: 1,
    },
  });

  console.log('✅ Akun OWNER berhasil dikonfigurasi!');
  console.log(`   ID:    ${user.id}`);
  console.log(`   Nama:  ${user.name}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Role:  ${user.role}`);
  console.log('\n🔒 Selesai. Password tidak pernah disimpan dalam bentuk plaintext.');
}

main()
  .catch((err) => {
    console.error('Fatal error during owner bootstrap:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
