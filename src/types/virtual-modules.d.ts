interface ImportMeta {
  glob(pattern: string): Record<string, () => Promise<unknown>>;
}
