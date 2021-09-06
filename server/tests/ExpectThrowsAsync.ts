import { expect } from "chai";

export const ExpectThrowsAsync = async (method, message) => {
  let error = null;
  try {
    await method();
  } catch (err) {
    error = err;
  } finally {
    expect(error).to.be.instanceOf(Error);
    expect(error.message).to.contain(message);
  }
};
