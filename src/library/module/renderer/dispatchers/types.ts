import { Produce } from "../../../controller/types.ts";
import { ModuleDefinition } from "../../../types/index.ts";
import { UseElements } from "../elements/types.ts";
import { UseLogger } from "../logger/types.ts";
import { UseModel } from "../model/types.ts";
import { UseMutations } from "../mutations/types.ts";
import { UseProcess } from "../process/types.ts";
import { UseQueue } from "../queue/types.ts";
import { Tail, UseOptions } from "../types.ts";
import { UseUpdate } from "../update/types.ts";
import useDispatchers from "./index.ts";

export type Props<M extends ModuleDefinition> = {
  options: UseOptions<M>;
  update: UseUpdate;
  model: UseModel;
  elements: UseElements;
  logger: UseLogger;
  queue: UseQueue;
  mutations: UseMutations;
  process: UseProcess;
};

export type UseDispatchers = ReturnType<typeof useDispatchers>;

export type UseDispatchHandlerProps<M extends ModuleDefinition> = Props<M>;

export type Fn = (...args: any[]) => void;

export type GeneratorFn<M extends ModuleDefinition> = (
  ...args: any[]
) => Generator<any, Produce<M>, any>;

export type Context<M extends ModuleDefinition> = {
  task: PromiseWithResolvers<void>;
  process: Symbol;
  ƒ: GeneratorFn<M>;
  abortController: AbortController;
  payload: Tail<M["Actions"]>;
  props: UseDispatchHandlerProps<M>;
};
