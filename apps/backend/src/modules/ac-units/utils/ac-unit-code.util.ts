import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

export async function generateAcUnitCode(prisma: PrismaService): Promise<string> {
  const latest = await prisma.acUnit.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { unitCode: true },
  });

  let nextNum = 1;
  if (latest?.unitCode?.startsWith('AC-')) {
    const numPart = parseInt(latest.unitCode.replace('AC-', ''), 10);
    if (!isNaN(numPart)) {
      nextNum = numPart + 1;
    }
  }

  let code = `AC-${String(nextNum).padStart(6, '0')}`;
  let exists = await prisma.acUnit.findUnique({
    where: { unitCode: code },
  });

  while (exists) {
    nextNum++;
    code = `AC-${String(nextNum).padStart(6, '0')}`;
    exists = await prisma.acUnit.findUnique({
      where: { unitCode: code },
    });
  }

  return code;
}
