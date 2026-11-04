declare module "heic-decode" {
  type Decoded = { width: number; height: number; data: Uint8ClampedArray };
  type Candidate = { width: number; height: number; decode(): Promise<Decoded> };
  type Candidates = Candidate[] & { dispose(): void };
  const decode: { all(options: { buffer: Uint8Array }): Promise<Candidates> };
  export default decode;
}
