import { useBroadcast } from "../../broadcast/index.tsx";
import { useOptimisedMemo } from "../../hooks/index.ts";
import { ModuleDefinition } from "../../types/index.ts";
import { hash } from "../../utils/index.ts";
import useActions from "./actions/index.ts";
import useController from "./controller/index.ts";
import useDispatchers from "./dispatchers/index.ts";
import useElements from "./elements/index.ts";
import useLifecycles from "./lifecycles/index.ts";
import useModel from "./model/index.ts";
import useQueue from "./queue/index.ts";
import { Props } from "./types.ts";
import useUpdate from "./update/index.ts";
import * as React from "react";
import { Context, config } from "./utils.ts";
import ErrorBoundary from "../../errors/index.tsx";
import useContext from "../../context/index.ts";
import usePassive from "./passive/index.ts";

export default function Renderer<M extends ModuleDefinition>({
  options,
}: Props<M>): React.ReactNode {
  const update = useUpdate();
  const queue = useQueue();
  const passive = usePassive();
  const elements = useElements();
  const broadcast = useBroadcast();
  const context = useContext();
  const model = useModel({ options });

  const dispatchers = useDispatchers({
    broadcast,
    options,
    update,
    model,
    queue,
  });

  const actions = useActions<M>({
    broadcast,
    options,
    model,
    dispatchers,
    context,
  });

  useController({ options, dispatchers, actions });
  useLifecycles({ options, dispatchers, elements, update });

  return useOptimisedMemo(() => {
    // eslint-disable-next-line react/no-children-prop
    return React.createElement(ErrorBoundary, {
      model,
      dispatchers,
      update,
      module: actions.view,
      children(): React.ReactNode {
        // eslint-disable-next-line react/no-children-prop
        return React.createElement(Context.Provider, {
          value: actions.view,
          // eslint-disable-next-line react/no-children-prop
          children: React.createElement(config.elementName, {
            ref: elements.customElement,
            style: { display: "contents" },
            children: options.children(actions.view),
          }),
        });
      },
    });
  }, [
    update.hash,
    hash(options.using.props),
    options.passive ? passive.current++ : 0,
  ]);
}
