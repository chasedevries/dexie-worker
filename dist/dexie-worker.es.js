import M from "dexie";
import { Observable as E } from "rxjs";
import { shareReplay as D } from "rxjs/operators";
import { useObservable as P } from "dexie-react-hooks";
const _ = () => `
importScripts('https://cdn.jsdelivr.net/npm/dexie@3.2.2/dist/dexie.min.js');
  var db = null;
var dbReadyPromise = null;
var dbInitializing = false;
var connectedClients = /* @__PURE__ */ new Set();
var getMessageListener = (options) => {
  return async (event) => {
    const { id, chain, schema, type } = event.data;
    try {
      if (type === "init") {
        if (dbInitializing) {
          postMessage({ id, result: "Database is initializing", type: "initializing" });
        } else if (db) {
          postMessage({ id, result: "Database already initialized", type: "init" });
        } else {
          dbInitializing = true;
          connectedClients.add(id);
          dbReadyPromise = initializeDatabase(schema).then(() => {
            dbInitializing = false;
          }).catch((error) => {
            dbInitializing = false;
            db = null;
            throw error;
          });
          await dbReadyPromise;
          postMessage({ id, result: "Database initialized", type: "init" });
        }
      } else if (type === "execute") {
        if (dbReadyPromise) {
          await dbReadyPromise;
        }
        if (!db) {
          throw new Error("Database is not initialized.");
        }
        const result = await executeChain(chain, options == null ? void 0 : options.operations);
        postMessage({ id, result, type: "result" });
      } else if (type === "disconnect") {
        connectedClients.delete(id);
      }
    } catch (error) {
      postMessage({ id, error: error.message, type: "error" });
    }
  };
};
function initializeDatabase(schema) {
  return new Promise((resolve, reject) => {
    try {
      db = new Dexie(schema.name);
      db.version(schema.version).stores(schema.stores);
      db.use({
        stack: "dbcore",
        name: "ChangeTrackingMiddleware",
        create(downlevelDatabase) {
          return {
            ...downlevelDatabase,
            table(tableName) {
              const downlevelTable = downlevelDatabase.table(tableName);
              return {
                ...downlevelTable,
                mutate(req) {
                  return downlevelTable.mutate(req).then((res) => {
                    const changedTables = /* @__PURE__ */ new Set();
                    changedTables.add(tableName);
                    notifyChanges(changedTables);
                    return res;
                  });
                }
              };
            }
          };
        }
      });
      db.open().then(() => {
        resolve();
      }).catch((error) => {
        db = null;
        reject(error);
      });
    } catch (error) {
      db = null;
      reject(error);
    }
  });
}
function notifyChanges(changedTables) {
  connectedClients.forEach((clientId) => {
    postMessage({ id: clientId, type: "changes", changedTables: Array.from(changedTables) });
  });
}
function getConfig(key) {
  if (typeof configModule !== "undefined") {
    return configModule[key];
  }
  return null;
}
async function executeChain(chain, _operations) {
  let context = db;
  for (const item of chain) {
    if (item.type === "get") {
      if (context[item.prop] !== void 0) {
        context = context[item.prop];
      } else if (context instanceof Dexie && context.tables.map((t) => t.name).includes(item.prop)) {
        context = context.table(item.prop);
      } else {
        throw new Error("Property or table" + item.prop + "does not exist.");
      }
    } else if (item.type === "call") {
      if (item.method === "operation") {
        const operations = _operations || getConfig("operations");
        if (operations && typeof operations[item.args[0]] === "function") {
          context = operations[item.args[0]](context, ...item.args.slice(1));
          if (context && typeof context.then === "function") {
            context = await context;
          }
        } else {
          const errorText = typeof operations === "undefined" ? "Operations is not defined. Please generate the worker file by supplying a valid 'operations' file." : "The function name " + item.args[0] + " is not defined in the operations file. Have you generated a new worker after updating your operations file?";
          throw new Error(errorText);
        }
      } else if (typeof context[item.method] === "function") {
        context = context[item.method](...item.args);
        if (context && context.then) {
          context = await context;
        }
      } else {
        throw new Error("Method " + item.method + " does not exist.");
      }
    }
  }
  if (!isSerializable(context)) {
    throw new Error("Result is not serializable. Chain: " + JSON.stringify(chain), context);
  }
  return context;
}
function isSerializable(value) {
  try {
    structuredClone(value);
    return true;
  } catch (e) {
    return false;
  }
}


self.onmessage = getMessageListener();
  `, R = [
  "hook",
  "use",
  "each",
  "transaction"
];
function L() {
  if (!("BroadcastChannel" in globalThis)) return !1;
  try {
    return new BroadcastChannel("__bc_test__").close(), !0;
  } catch {
    return !1;
  }
}
let h = null, u, b, k = 0;
const x = /* @__PURE__ */ new Map(), d = [];
function O(n, e) {
  return u || (u = new Promise((t) => {
    let r = "";
    if (!(e != null && e.worker))
      if (e != null && e.workerUrl)
        r = e.workerUrl;
      else {
        let o = _();
        e != null && e.dexieVersion && (o = o.replace("3.2.2", e.dexieVersion));
        const c = new Blob([o], { type: "text/javascript" });
        r = URL.createObjectURL(c);
      }
    const i = (o) => {
      const { id: c, result: l, error: T, type: z, changedTables: S } = o.data;
      if (z === "init")
        t(h);
      else {
        o.data.error && console.error(o.data.error);
        const p = x.get(c);
        if (p) {
          const { resolve: w, reject: C } = p;
          x.delete(c), T ? C(new Error(T)) : w(l);
        }
      }
      if (z === "changes" && S) {
        const p = new Set(S);
        d.forEach((w) => w(p));
      }
    };
    h = (e == null ? void 0 : e.worker) ?? new Worker(r, { type: "classic" }), h.onmessage = i;
    const s = N(n);
    b = n, I(b);
    const a = k++;
    h.postMessage({ id: a, type: "init", schema: s });
  })), u;
}
function j(n, e) {
  return typeof URL > "u" || typeof URL.createObjectURL != "function" ? (e != null && e.silenceWarning || console.warn("Dexie worker cannot be run in a non-browser environment."), n) : (O(n, e), m());
}
function m(n = [], e) {
  const t = function() {
  };
  return new Proxy(t, {
    get(i, s) {
      if (s.toString() === "then") {
        const a = n[n.length - 1];
        if (R.includes(a.method))
          return U(n);
        const o = K(n);
        return o.then.bind(o);
      }
      return e && n.length === 0 && e(s.toString()), m(n.concat({ type: "get", prop: s.toString() }), e);
    },
    apply(i, s, a) {
      const o = n[n.length - 1];
      if (o.prop === "operation" && a[0] === "watch") {
        const l = a[1];
        if (typeof l == "string") {
          e == null || e(l);
          return;
        }
      }
      let c;
      if (o && o.type === "get") {
        const l = o.prop;
        c = n.slice(0, -1).concat({ type: "call", method: l, args: a });
      } else
        c = n.concat({ type: "call", method: "<anonymous>", args: a });
      return m(c, e);
    }
  });
}
async function K(n) {
  if (u === void 0)
    throw new Error("You cannot call `useLiveQuery` before web worker initialization (call `getWebWorkerDB` first)");
  const e = await u;
  return new Promise((t, r) => {
    const i = k++;
    x.set(i, { resolve: t, reject: r }), e.postMessage({ id: i, type: "execute", chain: n });
  });
}
async function U(n) {
  let e = b;
  for (const t of n)
    if (e && typeof e.then == "function" && (e = await e), t.type === "get")
      e = e[t.prop];
    else if (t.type === "call") {
      const r = e[t.method];
      if (typeof r != "function")
        throw new Error(`Property '${t.method}' is not a function`);
      e = r.apply(e, t.args || []), e && typeof e.then == "function" && (e = await e);
    } else
      throw new Error(`Unknown chain item type: ${t.type}`);
  return e && typeof e.then == "function" && (e = await e), e;
}
function I(n) {
  if (L())
    try {
      M.on("storagemutated", (e) => {
        const t = /* @__PURE__ */ new Set();
        Object.keys(e || {}).forEach((r) => {
          const i = r.split("/"), s = i[3];
          i[2] === n.name && t.add(s);
        }), t.size > 0 && d.forEach((r) => r(t));
      });
      return;
    } catch {
    }
  n.use({
    stack: "dbcore",
    name: "ChangeTrackingMiddleware",
    create(e) {
      return {
        ...e,
        table(t) {
          const r = e.table(t);
          return {
            ...r,
            mutate(i) {
              return r.mutate(i).then((s) => {
                const a = /* @__PURE__ */ new Set();
                return a.add(t), d.forEach((o) => o(a)), s;
              });
            }
          };
        }
      };
    }
  });
}
function N(n) {
  const e = {
    name: n.name,
    version: n.verno,
    stores: {}
  }, t = n._dbSchema;
  for (const r in t) {
    const i = t[r], s = i.primKey.src, a = i.indexes.filter((l) => !l.foreignKey).map((l) => l.src), o = i.indexes.filter((l) => l.foreignKey).map((l) => l.foreignKey && l.foreignKey.index + "->" + l.foreignKey.targetTable + "." + l.foreignKey.targetIndex), c = Array.from(/* @__PURE__ */ new Set([s, ...a, ...o])).join(",");
    e.stores[r] = c;
  }
  return e;
}
function W(n) {
  d.push(n);
}
function B(n) {
  const e = d.indexOf(n);
  e !== -1 && d.splice(e, 1);
}
function Z(n, e) {
  return j(n, e);
}
function H(n) {
  return new E((e) => {
    let t = !0;
    const r = /* @__PURE__ */ new Set(), i = (o) => {
      r.add(o);
    }, s = () => {
      r.clear();
      const o = m([], i);
      Promise.resolve(n(o)).then((c) => {
        t && (c !== void 0 ? e.next(c) : e.next(null));
      }).catch((c) => {
        t && e.error(c);
      });
    };
    s();
    const a = (o) => {
      [...r].some((l) => o.has(l)) && s();
    };
    return W(a), () => {
      t = !1, B(a);
    };
  }).pipe(D({ bufferSize: 1, refCount: !0 }));
}
function A(n, e = [], t) {
  return P(() => H(n), e, t);
}
let f = null, g = null, y = !1;
const v = /* @__PURE__ */ new Set(), ee = (n) => async (e) => {
  const { id: t, chain: r, schema: i, type: s } = e.data;
  try {
    if (s === "init")
      y ? postMessage({ id: t, result: "Database is initializing", type: "initializing" }) : f ? postMessage({ id: t, result: "Database already initialized", type: "init" }) : (y = !0, v.add(t), g = Q(i).then(() => {
        y = !1;
      }).catch((a) => {
        throw y = !1, f = null, a;
      }), await g, postMessage({ id: t, result: "Database initialized", type: "init" }));
    else if (s === "execute") {
      if (g && await g, !f)
        throw new Error("Database is not initialized.");
      const a = await F(r, n == null ? void 0 : n.operations);
      postMessage({ id: t, result: a, type: "result" });
    } else s === "disconnect" && v.delete(t);
  } catch (a) {
    postMessage({ id: t, error: a.message, type: "error" });
  }
};
function Q(n) {
  return new Promise((e, t) => {
    try {
      f = new M(n.name), f.version(n.version).stores(n.stores), f.use({
        stack: "dbcore",
        name: "ChangeTrackingMiddleware",
        create(r) {
          return {
            ...r,
            table(i) {
              const s = r.table(i);
              return {
                ...s,
                mutate(a) {
                  return s.mutate(a).then((o) => {
                    const c = /* @__PURE__ */ new Set();
                    return c.add(i), $(c), o;
                  });
                }
              };
            }
          };
        }
      }), f.open().then(() => {
        e();
      }).catch((r) => {
        f = null, t(r);
      });
    } catch (r) {
      f = null, t(r);
    }
  });
}
function $(n) {
  v.forEach((e) => {
    postMessage({ id: e, type: "changes", changedTables: Array.from(n) });
  });
}
function q(n) {
  return typeof configModule < "u" ? configModule[n] : null;
}
async function F(n, e) {
  let t = f;
  for (const r of n)
    if (r.type === "get")
      if (t[r.prop] !== void 0)
        t = t[r.prop];
      else if (t instanceof M && t.tables.map((i) => i.name).includes(r.prop))
        t = t.table(r.prop);
      else
        throw new Error("Property or table" + r.prop + "does not exist.");
    else if (r.type === "call")
      if (r.method === "operation") {
        const i = e || q("operations");
        if (i && typeof i[r.args[0]] == "function")
          t = i[r.args[0]](t, ...r.args.slice(1)), t && typeof t.then == "function" && (t = await t);
        else {
          const s = typeof i > "u" ? "Operations is not defined. Please generate the worker file by supplying a valid 'operations' file." : "The function name " + r.args[0] + " is not defined in the operations file. Have you generated a new worker after updating your operations file?";
          throw new Error(s);
        }
      } else if (typeof t[r.method] == "function")
        t = t[r.method](...r.args), t && t.then && (t = await t);
      else
        throw new Error("Method " + r.method + " does not exist.");
  if (!J(t))
    throw new Error("Result is not serializable. Chain: " + JSON.stringify(n), t);
  return t;
}
function J(n) {
  try {
    return structuredClone(n), !0;
  } catch {
    return !1;
  }
}
export {
  ee as getMessageListener,
  Z as getWebWorkerDB,
  H as liveQuery,
  A as useLiveQuery
};
//# sourceMappingURL=dexie-worker.es.js.map
