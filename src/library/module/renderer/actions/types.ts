import { UseBroadcast } from "../../../broadcast/types.ts";
import { UseContext } from "../../../context/types.ts";
import { ControllerArgs } from "../../../controller/types.ts";
import { ModuleDefinition } from "../../../types/index.ts";
import { ViewArgs } from "../../../view/types.ts";
import { UseOptions } from "../../types.ts";
import { UseDispatchers } from "../dispatchers/types.ts";
import { UseModel } from "../model/types.ts";

export type Props<M extends ModuleDefinition> = {
  broadcast: UseBroadcast;
  options: UseOptions<M>;
  model: UseModel;
  dispatchers: UseDispatchers;
  context: UseContext;
};

export type UseActions<M extends ModuleDefinition> = {
  controller: ControllerArgs<M>;
  view: ViewArgs<M>;
};
