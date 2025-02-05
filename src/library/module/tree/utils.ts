import * as preact from "preact";
import {
  ModuleContext,
  ModuleDispatchers,
  ModuleState,
  ModuleQueue,
  ModuleMutations,
  ModuleProps,
} from "./types";
import {
  MutableRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
} from "preact/hooks";
import {
  Actions,
  Data,
  Lifecycle,
  Model,
  Name,
  Routes,
  State,
} from "../../types/index.ts";
import { enablePatches, Immer } from "immer";
import EventEmitter from "eventemitter3";
import { Validation } from "../../view/types.ts";
import validate from "../validate/index.ts";

const immer = new Immer();
immer.setAutoFreeze(false);
enablePatches();

/**
 * Render the module tree with the given options.
 *
 * @param moduleOptions {ModuleOptions<M, A, R> & { elementName: ElementName }}
 * @returns {ComponentChildren}
 */
export default function render<
  M extends Model,
  A extends Actions,
  R extends Routes,
>({ moduleOptions }: ModuleProps<M, A, R>): preact.ComponentChildren {
  const bootstrapped = useRef<boolean>(false);
  const shadowed = useRef<boolean>(false);
  const dispatchers = useModuleDispatchers();
  const model = useRef<M>(moduleOptions.model);
  const element = useRef<null | HTMLElement>(null);
  const scene = useRef<number>(1_000);
  const mutations = useRef<ModuleMutations>({});
  const queue = useRef<ModuleQueue>(new Set<Promise<void>>());
  const [index, update] = useReducer<number, void>((index) => index + 1, 0);
  const state = useRef<ModuleState<M, A, R>>(
    getModuleState<M, A, R>(model, element, dispatchers, mutations),
  );

  if (!bootstrapped.current) {
    bootstrapped.current = true;

    const controller = moduleOptions.controller(state.current.controller);
    const context = [
      model,
      controller,
      update,
      scene,
      queue,
      mutations,
    ] as ModuleContext<M, A>;

    bindActions(state, dispatchers, context);

    dispatchUpdate(
      <A>[Lifecycle.Mount, { props: moduleOptions.elementProps }],
      state,
      context,
    );
  }

  useEffect(() => {
    dispatchers.module.emit(Lifecycle.DOM, []);
    return () => dispatchers.module.emit(Lifecycle.Unmount, []);
  }, []);

  useLayoutEffect(() => {
    const busy = element.current?.querySelectorAll("*[aria-busy]") ?? [];

    for (const element of busy) {
      if (
        element.getAttribute("aria-busy") === "true" &&
        element.getAttribute("aria-hidden") !== "true"
      ) {
        element.classList.add("busy");
        continue;
      }

      element.classList.remove("busy");
    }
  }, [index]);

  function attachShadowRoot(root: null | HTMLDivElement) {
    if (root && !root.shadowRoot) {
      element.current = root;
      const shadow = root.attachShadow({ mode: "open" });
      preact.render(moduleOptions.view(state.current.view), shadow);
    }
  }

  useLayoutEffect(() => {
    if (!shadowed.current) {
      shadowed.current = true;
      return;
    }

    preact.render(
      moduleOptions.view(state.current.view),
      element.current?.shadowRoot as ShadowRoot,
    );
  }, [index]);

  return useMemo(
    () =>
      preact.h(moduleOptions.elementName, {
        ref: attachShadowRoot,
      }),
    [index],
  );
}

/**
 * Get both the app dispatch from the app context and the module dispatcher.
 *
 * @returns {ModuleDispatchers<A>}
 */
function useModuleDispatchers() {
  const moduleDispatcher = useRef(new EventEmitter());

  return useMemo(
    () => ({
      app: {},
      module: moduleDispatcher.current,
    }),
    [],
  );
}

/**
 * Get the initial state of the module.
 *
 * @param model {MutableRef<M>}
 * @param element {MutableRef<null | HTMLElement>}
 * @param dispatches {ModuleDispatchers<A>}
 * @returns {ModuleState<M, A, R>}
 */
function getModuleState<M extends Model, A extends Actions, R extends Routes>(
  model: MutableRef<M>,
  element: MutableRef<null | HTMLElement>,
  dispatches: ModuleDispatchers<A>,
  mutations: MutableRef<ModuleMutations>,
): ModuleState<M, A, R> {
  return {
    controller: {
      get model() {
        return model.current;
      },
      get element() {
        return element.current;
      },
      actions: {
        io: <T>(ƒ: () => T): (() => T) => ƒ,
        produce: (ƒ) => immer.produceWithPatches(model.current, ƒ),
        dispatch([action, ...data]: A) {
          dispatches.module.emit(action, data);
        },
        navigate() {},
      },
    },
    view: {
      get model() {
        return model.current;
      },
      get element() {
        return element.current;
      },
      actions: {
        validate: <T>(ƒ: (model: Validation<M>) => T): T =>
          ƒ(validate<M>(model.current, mutations.current)),
        pending: <T>(ƒ: (model: Validation<M>) => T): boolean =>
          Boolean(
            ƒ(validate<M>(model.current, mutations.current)) & State.Pending,
          ),
        dispatch([action, ...data]: A) {
          dispatches.module.emit(action, data);
        },
        navigate() {},
      },
    },
  };
}

/**
 * Dispatch the update to the controller and synchronise the view.
 *
 * @param action {A}
 * @param state {MutableRef<ModuleState<M, A, R>>}
 * @param context {ModuleContext<M, A>}
 * @returns {void}
 */
async function dispatchUpdate<
  M extends Model,
  A extends Actions,
  R extends Routes,
>(
  action: A,
  _state: MutableRef<ModuleState<M, A, R>>,
  [model, controller, update, scene, queue, mutations]: ModuleContext<M, A>,
) {
  const now = performance.now();
  const colour = [...Array(6)]
    .map(() => Math.floor(Math.random() * 14).toString(16))
    .join("");

  const task = Promise.withResolvers<void>();
  queue.current.add(task.promise);

  const name = scene.current.toString(16);
  scene.current += 50;

  const [event, ...data] = action;
  const io = new Set();

  const passes = {
    first: controller[<Name<A>>event]?.(...data),
    second: controller[<Name<A>>event]?.(...data),
  };

  // We don't continue if the first pass is not defined.
  if (passes.first == null) return;

  while (true) {
    const result = passes.first.next();

    if (result.done) {
      const records =
        result.value?.[1].flatMap((value) => ({
          path: value.path,
          state: State.Pending,
        })) ?? [];

      mutations.current[name] = records;

      console.groupCollapsed(
        `Marea / %c ${name} (1st pass) `,
        `background: #${colour}; color: white; border-radius: 2px`,
      );
      console.log("Event", event);
      console.log("Time", `${performance.now() - now}ms`);
      console.log("Mutations", records);
      console.groupEnd();
      break;
    }

    io.add(result.value());
  }

  if (io.size > 0) {
    update();
  }

  // We don't continue if the second pass is not defined.
  if (passes.second == null) return;

  // It's important we don't await if we don't need to, so that actions like
  // the `Lifecycle.Mount` can run synchronously.
  const results = io.size > 0 ? await Promise.allSettled(io) : [];

  const result = passes.second.next();

  function flush() {
    if (result.done && result.value != null && result.value?.[0] != null) {
      model.current = result.value[0];
      update();

      console.groupCollapsed(
        `Marea / %c ${name} (2nd pass) `,
        `background: #${colour}; color: white; border-radius: 2px`,
      );
      console.log("Event", event);
      console.log("Time", `${performance.now() - now}ms`);
      console.log("Model", model.current);
      console.groupEnd();
    }
  }

  if (result.done) return void flush();

  results.forEach((io) => {
    const result =
      io.status === "fulfilled"
        ? passes.second.next(io.value)
        : passes.second.next(null);

    if (result.done && result.value != null && result.value?.[0] != null) {
      return void flush();
    }
  });

  task.resolve();
  queue.current.delete(task.promise);
  delete mutations.current[name];
}

/**
 * Bind the actions to the module.
 *
 * @param state {MutableRef<ModuleState<M, A, R>>}
 * @param dispatches {ModuleDispatchers<A>}
 * @param context {ModuleContext<M, A>}
 * @returns {void}
 */
function bindActions<M extends Model, A extends Actions, R extends Routes>(
  state: MutableRef<ModuleState<M, A, R>>,
  dispatches: ModuleDispatchers<A>,
  [model, controller, update, scene, queue, mutations]: ModuleContext<M, A>,
) {
  Object.keys(controller)
    .filter((action) => action !== Lifecycle.Mount)
    .forEach((action) => {
      dispatches.module.on(<Name<A>>action, (data: Data) => {
        dispatchUpdate(<A>[action, ...data], state, [
          model,
          controller,
          update,
          scene,
          queue,
          mutations,
        ]);
      });
    });
}
