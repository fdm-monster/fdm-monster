describe("load-controllers test", () => {
  it("load-controllers", async () => {
    // @ts-ignore
    const result = await import.meta.glob("@/controllers/*.controller.*")
    expect(Object.keys(result), "API Controllers loaded should match").toMatchObject([
      '/src/controllers/auth.controller.ts',
      '/src/controllers/batch-call.controller.ts',
      '/src/controllers/camera-stream.controller.ts',
      '/src/controllers/file-storage.controller.ts',
      '/src/controllers/first-time-setup.controller.ts',
      '/src/controllers/floor.controller.ts',
      '/src/controllers/metrics.controller.ts',
      '/src/controllers/print-job.controller.ts',
      '/src/controllers/print-queue.controller.ts',
      '/src/controllers/printer-files.controller.ts',
      '/src/controllers/printer-maintenance-log.controller.ts',
      '/src/controllers/printer-settings.controller.ts',
      '/src/controllers/printer-tag.controller.ts',
      '/src/controllers/printer.controller.ts',
      '/src/controllers/server-private.controller.ts',
      '/src/controllers/server-public.controller.ts',
      '/src/controllers/settings.controller.ts',
      '/src/controllers/slicer-compat.controller.ts',
      '/src/controllers/user.controller.ts'
    ])
  })
})
