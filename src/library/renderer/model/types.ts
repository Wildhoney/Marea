import useModel from ".";
import { Module } from "../../types/index.ts";
import { RendererOptions } from "../types.ts";

export type Props<M extends Module> = {
  options: RendererOptions<M>;
};

export type UseModel = ReturnType<typeof useModel>;
