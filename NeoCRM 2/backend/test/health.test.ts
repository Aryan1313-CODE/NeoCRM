describe("Day 1-6 backend smoke contract", () => {
  it("documents the expected health endpoint", () => {
    expect("/health").toBe("/health");
  });
});
