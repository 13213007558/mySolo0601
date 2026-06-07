export function nanoid(size = 10): string {
  const alphabet = 'useandom26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';
  let out = '';
  const cryptoObj = (globalThis as unknown as { crypto?: Crypto }).crypto;
  const bytes = cryptoObj?.getRandomValues(new Uint8Array(size));
  for (let i = 0; i < size; i++) {
    out += alphabet[(bytes ? bytes[i] : (Math.random() * 64) | 0) & 63];
  }
  return out;
}
