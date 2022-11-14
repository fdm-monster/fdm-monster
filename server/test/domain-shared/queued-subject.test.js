const QueueingSubject = require("../../handlers/queued-subject");

describe("QueuedSubject", () => {
  it("should construct by default", () => {
    const subject = new QueueingSubject();

    expect(subject).toBeTruthy();
  });
});
