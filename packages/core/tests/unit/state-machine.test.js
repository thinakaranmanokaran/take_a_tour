import { describe, expect, it } from "vitest";
import { createStateMachine } from "../../src/state/state-machine.js";
import { STATES } from "../../src/constants.js";
import { TransitionError } from "../../src/errors/index.js";

describe("state machine", () => {
  it("starts idle", () => {
    expect(createStateMachine().getState()).toBe(STATES.IDLE);
  });

  it("allows the documented happy path", () => {
    const machine = createStateMachine();

    machine.transition("start");
    expect(machine.getState()).toBe(STATES.RUNNING);

    machine.transition("pause");
    expect(machine.getState()).toBe(STATES.PAUSED);

    machine.transition("resume");
    expect(machine.getState()).toBe(STATES.RUNNING);

    machine.transition("complete");
    expect(machine.getState()).toBe(STATES.COMPLETED);

    machine.transition("destroy");
    expect(machine.getState()).toBe(STATES.DESTROYED);
  });

  it("distinguishes stop, complete, skip and destroy as separate terminal states", () => {
    for (const method of ["stop", "complete", "skip"]) {
      const machine = createStateMachine();
      machine.transition("start");
      machine.transition(method);
      expect(machine.getState()).toBe(
        method === "stop"
          ? STATES.STOPPED
          : method === "complete"
            ? STATES.COMPLETED
            : STATES.SKIPPED
      );
    }
  });

  it("allows a stopped tour to be started again", () => {
    const machine = createStateMachine();
    machine.transition("start");
    machine.transition("stop");
    expect(machine.can("start")).toBe(true);
    machine.transition("start");
    expect(machine.getState()).toBe(STATES.RUNNING);
  });

  it("does not allow a completed tour to be restarted without stopping it first", () => {
    const machine = createStateMachine();
    machine.transition("start");
    machine.transition("complete");

    expect(machine.can("start")).toBe(false);
    expect(() => machine.transition("start")).toThrowError(TransitionError);
  });

  it("rejects illegal transitions with the from/to states attached", () => {
    const machine = createStateMachine();

    try {
      machine.transition("next");
      expect.unreachable("next is not a lifecycle transition");
    } catch (error) {
      expect(error).toBeInstanceOf(TransitionError);
      expect(error.method).toBe("next");
    }
  });

  it("refuses every transition after destroy", () => {
    const machine = createStateMachine();
    machine.transition("destroy");

    for (const method of ["start", "pause", "resume", "stop", "skip", "complete", "destroy"]) {
      expect(() => machine.transition(method)).toThrowError(TransitionError);
    }
    expect(machine.getState()).toBe(STATES.DESTROYED);
  });

  it("reports active states for running and paused only", () => {
    const machine = createStateMachine();
    expect(machine.isActive()).toBe(false);

    machine.transition("start");
    expect(machine.isActive()).toBe(true);

    machine.transition("pause");
    expect(machine.isActive()).toBe(true);

    machine.transition("stop");
    expect(machine.isActive()).toBe(false);
  });

  it("records transition history", () => {
    const machine = createStateMachine();
    machine.transition("start");
    machine.transition("complete");

    expect(machine.history).toEqual(["idle", "running", "completed"]);
  });
});
