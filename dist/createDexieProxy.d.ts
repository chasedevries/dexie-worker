import Dexie from 'dexie';
import { ChainItem, DexieWorkerOptions } from './types/common';
/**
 * Creates a proxy that intercepts property accesses and method calls.
 * @param dbInstance The Dexie instance used to extract the schema.
 * @returns A proxy that represents the Dexie database.
 */
export default function createDexieProxy<T extends Dexie>(dbInstance: T, options?: DexieWorkerOptions): T;
/**
 * Creates a proxy that builds a chain of property accesses and method calls.
 * @param chain The current chain of operations.
 * @param tableAccessCallback Optional callback to track table accesses.
 * @returns A proxy that allows for method chaining.
 */
declare function createProxy<T>(chain?: ChainItem[], tableAccessCallback?: (tableName: string) => void): T;
/**
 * Adds a listener to be notified when database changes occur.
 * @param listener The function to call when changes occur.
 */
declare function addChangeListener(listener: (changedTables: Set<string>) => void): void;
/**
 * Removes a previously added change listener.
 * @param listener The listener function to remove.
 */
declare function removeChangeListener(listener: (changedTables: Set<string>) => void): void;
export { createProxy, addChangeListener, removeChangeListener };
//# sourceMappingURL=createDexieProxy.d.ts.map