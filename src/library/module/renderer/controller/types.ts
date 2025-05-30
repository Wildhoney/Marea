import { ModuleDefinition } from "../../../types/index.ts";
import { UseOptions } from "../../types.ts";
import { UseActions } from "../actions/types.ts";
import { UseDispatchers } from "../dispatchers/types.ts";
import useController from "./index.ts";

export type Props<M extends ModuleDefinition> = {
  actions: UseActions<M>;
  options: UseOptions<M>;
  dispatchers: UseDispatchers;
};

export type UseController = ReturnType<typeof useController>;
