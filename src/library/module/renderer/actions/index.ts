import { Events, ModuleDefinition } from "../../../types/index.ts";
import * as utils from "../../../utils/index.ts";
import { Validator } from "../../../view/types.ts";
import { Props, UseActions } from "./types.ts";
import { Immer } from "immer";
import * as React from "react";

const immer = new Immer();
immer.setAutoFreeze(false);

export default function useActions<M extends ModuleDefinition>(props: Props<M>): UseActions<M> {
  return React.useMemo(
    () => ({
      controller: {
        get model() {
          return props.model.current;
        },
        events: Object.entries(props.options.attributes)
          .filter(([_, value]) => typeof value === "function")
          .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {} as Events<M["Attributes"]>),
        actions: {
          io<T>(ƒ: () => T): T {
            return ƒ as T;
          },
          produce(ƒ) {
            return (model) => immer.produce(model, ƒ);
          },
          dispatch([action, ...data]) {
            return props.dispatchers.dispatch(action, data);
          },
        },
      },
      view: {
        get model() {
          return props.model.current;
        },
        actions: {
          validate(ƒ) {
            const validator: Validator<M["Model"]> = utils.validate(props.model.current, props.mutations.current);
            return ƒ(validator);
          },
          dispatch([action, ...data]) {
            return props.dispatchers.dispatch(action, data);
          },
          // navigate() {},
        },
      },
    }),
    [],
  );
}
