import { ModuleDefinition } from "../../../types/index.ts";
import { UseElements } from "../elements/types.ts";
import { UseOptions } from "../types.ts";
import useLogger from "./index.ts";

export type Props<M extends ModuleDefinition> = {
  options: UseOptions<M>;
  elements: UseElements;
};

export type UseLogger = ReturnType<typeof useLogger>;

export type Metrics = {};
