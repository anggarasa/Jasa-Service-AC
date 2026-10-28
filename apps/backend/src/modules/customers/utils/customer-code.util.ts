import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

export async function generateCustomerCode(
  prisma: Prisma.TransactionClient | PrismaService,
  businessId: string,
): Promise<string> {
  const latest = await prisma.customer.findFirst({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    select: { customerCode: true },
  });

  let nextNum = 1;
  if (latest?.customerCode?.startsWith('CUS-')) {
    const numPart = parseInt(latest.customerCode.replace('CUS-', '').slice(0, 4), 10);
    if (!isNaN(numPart)) {
      nextNum = numPart + 1;
    }
  }

  for (let attempt = 0; attempt < 10; attempt++) {
    const randomSuffix = Math.floor(10 + Math.random() * 90);
    const code = `CUS-${String(nextNum).padStart(4, '0')}${randomSuffix}`;
    const exists = await prisma.customer.findUnique({
      where: { businessId_customerCode: { businessId, customerCode: code } },
    });
    if (!exists) {
      return code;
    }
    nextNum++;
  }

  return `CUS-${Date.now().toString().slice(-6)}`;
}
