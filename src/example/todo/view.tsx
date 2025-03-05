import { Operation, State, Target, create } from "../../library/index.ts";
import { Events, Module } from "./types.ts";

export default create.view<Module>((self) => {
  return (
    <section>
      <h1>Todo app</h1>

      <input
        type="text"
        value={self.model.task ?? ""}
        onChange={(event) => self.actions.dispatch([Events.Task, event.currentTarget.value])}
      />

      <button
        disabled={
          !self.model.task || self.actions.validate((model) => model.tasks.is(Operation.Adding | Target.Indirect))
        }
        onClick={() => self.actions.dispatch([Events.Add])}
      >
        {self.actions.validate((model) => model.tasks.is(Operation.Adding | Target.Indirect)) ? (
          <>Adding task&hellip;</>
        ) : (
          "Add task"
        )}
      </button>

      {self.model.tasks.length === 0 ? (
        <p>
          {self.actions.validate((model) => model.tasks.is(State.Pending)) ? (
            <>Please wait&hellip;</>
          ) : (
            "You have no tasks yet."
          )}
        </p>
      ) : (
        <ol>
          {self.model.tasks.map((task, index) => (
            <li key={task.id}>
              <input
                disabled={self.actions.validate((model) => model.tasks[index].is(State.Pending | Target.Indirect))}
                type="checkbox"
                checked={task.completed}
                onChange={() => self.actions.dispatch([Events.Completed, task.id])}
              />

              <span>
                {task.task} {task.completed ? "✅" : ""}
              </span>

              <button
                disabled={self.actions.validate((model) => model.tasks[index].is(State.Pending | Target.Indirect))}
                onClick={() => self.actions.dispatch([Events.Remove, task.id])}
              >
                {self.actions.validate((model) => model.tasks[index].is(Operation.Removing)) ? (
                  <>Removing&hellip;</>
                ) : (
                  "Remove"
                )}
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
});
