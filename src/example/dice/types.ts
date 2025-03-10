import { Create } from "../../library/index.ts";
import { DistributedActions, Route, Routes } from "../types.ts";

export type Model = {
  kite: number;
};

export const enum Events {
  Roll,
}

export type Actions = DistributedActions | [Events.Roll];

export type Props = {
  initialKite: string;
  taskCount: string;
};

export type Module = Create.Module<
  Model,
  Actions,
  Props,
  [Routes, Route.Dashboard]
>;
