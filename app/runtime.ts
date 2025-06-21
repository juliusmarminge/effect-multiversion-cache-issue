import { ManagedRuntime } from "effect";
import { ImaginaryDbClient } from "./db";

export const runtime = ManagedRuntime.make(ImaginaryDbClient.Live)