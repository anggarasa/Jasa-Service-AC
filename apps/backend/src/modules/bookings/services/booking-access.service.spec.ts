import { BookingAccessService } from './booking-access.service';

describe('BookingAccessService', () => {
  let service: BookingAccessService;

  beforeEach(() => {
    service = new BookingAccessService();
  });

  it('harus menghasilkan token acak 64 karakter heksadesimal dan hash sha256 valid', () => {
    const { token, hash } = service.generateToken();
    expect(token).toHaveLength(64);
    expect(hash).toHaveLength(64);
    expect(service.hashToken(token)).toBe(hash);
  });

  it('harus menghasilkan hash yang berbeda untuk token yang berbeda', () => {
    const t1 = service.generateToken();
    const t2 = service.generateToken();
    expect(t1.token).not.toBe(t2.token);
    expect(t1.hash).not.toBe(t2.hash);
  });
});
