import { describe, expect, it } from "vitest";
import {
  Cl,
  ClarityType,
  type SomeCV,
  type TupleCV,
  type TupleData,
  type UIntCV,
} from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

const SAMPLE = "Built my first Stacks dApp.";

function submit(content: string, sender: string) {
  return simnet.callPublicFn(
    "stackproof",
    "submit-proof",
    [Cl.stringUtf8(content)],
    sender,
  );
}

function totalProofs() {
  return simnet.callReadOnlyFn("stackproof", "get-total-proofs", [], deployer).result;
}

function proofTuple(id: number | bigint): TupleData {
  const { result } = simnet.callReadOnlyFn("stackproof", "get-proof", [Cl.uint(id)], deployer);
  expect(result).toHaveClarityType(ClarityType.OptionalSome);
  return (result as SomeCV<TupleCV>).value.value;
}

describe("stackproof", () => {
  it("initial total is 0", () => {
    expect(totalProofs()).toBeUint(0);
  });

  it("a valid proof submission succeeds", () => {
    const { result } = submit(SAMPLE, deployer);
    expect(result).toBeOk(Cl.uint(1));
  });

  it("the first proof receives ID u1", () => {
    const { result } = submit(SAMPLE, deployer);
    expect(result).toBeOk(Cl.uint(1));
  });

  it("the second proof receives ID u2", () => {
    submit("First proof", deployer);
    const { result } = submit("Second proof", deployer);
    expect(result).toBeOk(Cl.uint(2));
  });

  it("tx-sender is stored as the author", () => {
    submit(SAMPLE, wallet1);
    expect(proofTuple(1).author).toBePrincipal(wallet1);
  });

  it("submitted content is stored correctly", () => {
    submit(SAMPLE, deployer);
    expect(proofTuple(1).content).toBeUtf8(SAMPLE);
  });

  it("block height is stored as the timestamp", () => {
    submit(SAMPLE, deployer);
    const first = proofTuple(1).timestamp as UIntCV;
    expect(first).toBeUint(simnet.stacksBlockHeight);

    submit("A second proof", deployer);
    const second = proofTuple(2).timestamp as UIntCV;
    expect(second).toBeUint(simnet.stacksBlockHeight);
    expect(second.value).toBeGreaterThan(first.value);
  });

  it("get-proof retrieves the stored proof", () => {
    submit(SAMPLE, wallet1);
    const proof = proofTuple(1);
    expect(proof.author).toBePrincipal(wallet1);
    expect(proof.content).toBeUtf8(SAMPLE);
  });

  it("get-proof returns none for a nonexistent proof", () => {
    const { result } = simnet.callReadOnlyFn(
      "stackproof",
      "get-proof",
      [Cl.uint(999)],
      deployer,
    );
    expect(result).toBeNone();
  });

  it("get-total-proofs increases correctly", () => {
    expect(totalProofs()).toBeUint(0);
    submit("one", deployer);
    expect(totalProofs()).toBeUint(1);
    submit("two", deployer);
    expect(totalProofs()).toBeUint(2);
  });

  it("empty content is rejected with ERR-EMPTY-CONTENT", () => {
    const { result } = submit("", deployer);
    expect(result).toBeErr(Cl.uint(100));
  });

  it("multiple proofs can be submitted successfully", () => {
    for (let i = 1; i <= 7; i++) {
      const { result } = submit(`Proof number ${i}`, deployer);
      expect(result).toBeOk(Cl.uint(i));
    }
    expect(totalProofs()).toBeUint(7);
  });

  it("accepts content at the 280 character limit", () => {
    const { result } = submit("a".repeat(280), deployer);
    expect(result).toBeOk(Cl.uint(1));
    expect(proofTuple(1).content).toBeUtf8("a".repeat(280));
  });
});
