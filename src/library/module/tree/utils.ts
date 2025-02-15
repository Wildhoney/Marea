// import {
//   ModuleContext,
//   ModuleDispatchers,
//   ModuleState,
//   ModuleQueue,
//   ModuleMutations,
//   ModuleProps,
// } from "./types.ts";
// import { Data, Lifecycle, State, Stitched } from "../../types/index.ts";
// import { enablePatches, Immer } from "immer";
// import EventEmitter from "eventemitter3";
// import { Validation } from "../../view/types.ts";
// import validate from "../validate/index.ts";
// import * as React from "react";
// import { useApp } from "../../app/index.tsx";
// import * as ReactDOM from "react-dom";

// const immer = new Immer();
// immer.setAutoFreeze(false);
// enablePatches();

// /**
//  * Render the module tree with the given options.
//  *
//  * @param Options {Options<M, A, R> & { elementName: ElementName }}
//  * @returns {ComponentChildren}
//  */
// export default function render<S extends Stitched>({
//   Options,
// }: ModuleProps<S>): React.ReactNode {
//   const appOptions = useApp();
//   const bootstrapped = React.useRef<boolean>(false);
//   const dispatchers = useModuleDispatchers();
//   const model = React.useRef<S["Model"]>(Options.model);
//   const element = React.useRef<null | HTMLElement>(null);
//   const scene = React.useRef<number>(1_000);
//   const mutations = React.useRef<ModuleMutations>({});
//   const attributes = React.useRef<S["Props"]>(Options.elementProps);
//   const queue = React.useRef<ModuleQueue>(new Set<Promise<void>>());
//   const rendered = React.useRef<boolean>(false);
//   const [index, update] = React.useReducer((index) => index + 1, 0);
//   const state = React.useRef<ModuleState<S>>(
//     getModuleState<S>(
//       model,
//       dispatchers,
//       mutations,
//       appOptions.distributedEvents,
//     ),
//   );
//   const hash = React.useMemo(
//     () => `${index}.${JSON.stringify(attributes.current)}`,
//     [index, JSON.stringify(attributes.current)],
//   );

//   const shadowHostRef = React.useRef<null | HTMLElement>(null);
//   const shadowRootRef = React.useRef<null | ShadowRoot>(null);

//   const context = React.useMemo(() => {
//     const controller = Options.controller(state.current.controller);
//     const context = [
//       Options.elementName,
//       model,
//       controller,
//       update,
//       scene,
//       queue,
//       mutations,
//       element,
//     ] as ModuleContext<S>;

//     return context;
//   }, []);

//   if (!bootstrapped.current) {
//     bootstrapped.current = true;

//     dispatchUpdate<S>([Lifecycle.Mount], state, context);

//     dispatchUpdate<S>([Lifecycle.Derive, Options.elementProps], state, context);

//     bindActions(state, dispatchers, context);
//   }

//   React.useEffect(() => {
//     dispatchers.module.emit(Lifecycle.Tree, []);
//     return () => void dispatchers.module.emit(Lifecycle.Unmount, []);
//   }, []);

//   React.useLayoutEffect(() => {
//     if (shadowHostRef.current && !shadowRootRef.current) {
//       shadowRootRef.current = shadowHostRef.current.attachShadow({
//         mode: "open",
//       });
//       update();
//     }
//   }, []);

//   React.useEffect((): void => {
//     if (!rendered.current) {
//       rendered.current = true;
//       return;
//     }

//     attributes.current = Options.elementProps;
//     dispatchers.module.emit(Lifecycle.Derive, [Options.elementProps]);
//   }, [JSON.stringify(Options.elementProps)]);

//   return React.useMemo(
//     () =>
//       React.createElement(Options.elementName, {
//         ref: shadowHostRef,
//         children:
//           shadowRootRef.current &&
//           ReactDOM.createPortal(
//             Options.view(state.current.view),
//             shadowRootRef.current,
//           ),
//       }),
//     [hash],
//   );
// }

// /**
//  * Get both the app dispatch from the app context and the module dispatcher.
//  *
//  * @returns {ModuleDispatchers<S>}
//  */
// function useModuleDispatchers() {
//   const moduleEmitter = React.useRef(new EventEmitter());
//   const appEmitter = useApp().appEmitter;

//   return React.useMemo(
//     () => ({
//       app: appEmitter,
//       module: moduleEmitter.current,
//     }),
//     [],
//   );
// }

// /**
//  * Get the initial state of the module.
//  *
//  * @param model {RefObject<M>}
//  * @param element {RefObject<null | HTMLElement>}
//  * @param dispatches {ModuleDispatchers<A>}
//  * @returns {ModuleState<M, A, R>}
//  */
// function getModuleState<S extends Stitched>(
//   model: React.RefObject<S["Model"]>,
//   dispatches: ModuleDispatchers<S>,
//   mutations: React.RefObject<ModuleMutations>,
//   distributedEvents: any,
// ): ModuleState<S> {
//   return {
//     controller: {
//       get model() {
//         return model.current;
//       },
//       actions: {
//         io: <T>(ƒ: () => T): (() => T) => ƒ,
//         produce: (ƒ) => immer.produceWithPatches(model.current, ƒ),
//         dispatch([action, ...data]: S["Actions"]) {
//           dispatches.module.emit(action, data);
//         },
//         navigate() {},
//       },
//     },
//     view: {
//       get model() {
//         return model.current;
//       },
//       actions: {
//         validate: <T>(ƒ: (model: Validation<S["Model"]>) => T): T =>
//           ƒ(validate<S["Model"]>(model.current, mutations.current)),
//         pending: (ƒ: (model: Validation<S["Model"]>) => State): boolean => {
//           const state = ƒ(
//             validate<S["Model"]>(model.current, mutations.current),
//           );
//           return Boolean(state & State.Pending);
//         },
//         dispatch([action, ...data]: S["Actions"]) {
//           const eventEmitter = Object.values(distributedEvents).includes(action)
//             ? dispatches.app
//             : dispatches.module;

//           eventEmitter.emit(action, data);
//         },
//         navigate() {},
//       },
//     },
//   };
// }

// /**
//  * Dispatch the update to the controller and synchronise the view.
//  *
//  * @param action {A}
//  * @param state {RefObject<ModuleState<M, A, R>>}
//  * @param context {ModuleContext<M, A>}
//  * @returns {void}
//  */
// async function dispatchUpdate<S extends Stitched>(
//   action: S["Actions"],
//   _state: React.RefObject<ModuleState<S>>,
//   [
//     elementName,
//     model,
//     controller,
//     update,
//     scene,
//     queue,
//     mutations,
//     element,
//   ]: ModuleContext<S>,
// ) {
//   function flush(result: any, log: boolean): void {
//     if (result.done && result.value != null && result.value?.[0] != null) {
//       model.current = result.value[0];
//       update();

//       if (log) {
//         console.groupCollapsed(
//           `Marea / %c ${elementName} - ${name} (2nd pass) `,
//           `background: #${colour}; color: white; border-radius: 2px`,
//         );
//         console.log("Node", element.current);
//         console.log("Event", event);
//         console.log("Time", `${performance.now() - now}ms`);
//         console.log("Model", model.current);
//         console.groupEnd();
//       }

//       task.resolve();
//       queue.current.delete(task.promise);
//       delete mutations.current[name];
//     }
//   }

//   const now = performance.now();
//   const colour = [...Array(6)]
//     .map(() => Math.floor(Math.random() * 14).toString(16))
//     .join("");

//   const task = Promise.withResolvers<void>();
//   queue.current.add(task.promise);

//   const name = scene.current.toString(16);
//   scene.current += 50;

//   const [event, ...data] = action;
//   const io = new Set();

//   const passes = {
//     first: controller[<Name<S["Actions"]>>event]?.(...data),
//     second: controller[<Name<S["Actions"]>>event]?.(...data),
//   };

//   // We don't continue if the first pass is not defined.
//   if (passes.first == null) return;

//   while (true) {
//     const result = passes.first.next();

//     if (result.done) {
//       const records =
//         result.value?.[1].flatMap((value) => ({
//           path: value.path,
//           state: State.Pending,
//         })) ?? [];

//       mutations.current[name] = records;

//       console.groupCollapsed(
//         `Marea / %c ${elementName} - ${name} (${io.size > 0 ? "1st" : "single"} pass) `,
//         `background: #${colour}; color: white; border-radius: 2px`,
//       );
//       console.log("Node", element.current);
//       console.log("Event", event);
//       console.log("Time", `${performance.now() - now}ms`);
//       console.log("Actions", [...io]);
//       console.log("Mutations", result.value?.[1]);
//       console.groupEnd();

//       if (io.size === 0) {
//         flush(result, false);
//       }

//       break;
//     }

//     io.add(result.value());
//   }

//   if (io.size === 0) return;

//   update();

//   // We don't continue if the second pass is not defined.
//   if (passes.second == null) return;

//   // It's important we don't await if we don't need to, so that actions like
//   // the `Lifecycle.Mount` can run synchronously.
//   const results = io.size > 0 ? await Promise.allSettled(io) : [];

//   const result = passes.second.next();

//   if (result.done) return void flush(result, true);

//   results.forEach((io) => {
//     const result =
//       io.status === "fulfilled"
//         ? passes.second.next(io.value)
//         : passes.second.next(null);

//     if (result.done && result.value != null && result.value?.[0] != null) {
//       return void flush(result, true);
//     }
//   });
// }

// /**
//  * Bind the actions to the module.
//  *
//  * @param state {RefObject<ModuleState<M, A, R>>}
//  * @param dispatches {ModuleDispatchers<A>}
//  * @param context {ModuleContext<M, A>}
//  * @returns {void}
//  */
// function bindActions<S extends Stitched>(
//   state: React.RefObject<ModuleState<S>>,
//   dispatches: ModuleDispatchers<S>,
//   [
//     elementName,
//     model,
//     controller,
//     update,
//     scene,
//     queue,
//     mutations,
//     element,
//   ]: ModuleContext<S>,
// ) {
//   Object.keys(controller)
//     .filter((action) => action !== Lifecycle.Mount)
//     .forEach((action) => {
//       dispatches.module.on(action, (data: Data) => {
//         dispatchUpdate<S>([action, ...data], state, [
//           elementName,
//           model,
//           controller,
//           update,
//           scene,
//           queue,
//           mutations,
//           element,
//         ]);
//       });

//       dispatches.app.on(action, (data: Data) => {
//         dispatchUpdate<S>([action, ...data], state, [
//           elementName,
//           model,
//           controller,
//           update,
//           scene,
//           queue,
//           mutations,
//           element,
//         ]);
//       });
//     });
// }
