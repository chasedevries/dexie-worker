import { liveQuery } from "./liveQuery";
import { useObservable } from "dexie-react-hooks";

export default function useLiveQuery<TDatabase = any, T = any, TDefault = any>(
  queryCallback: (db: TDatabase) => Promise<T> | T,
  deps: any[] = [],
  initialValue?: TDefault,
) {
  return useObservable<T, TDefault>(
    () => {
      console.log("Executing useLiveQuery with deps:", deps);
      return liveQuery(queryCallback);
    },
    deps,
    initialValue as TDefault,
  );
}
