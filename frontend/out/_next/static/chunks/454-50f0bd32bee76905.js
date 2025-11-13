"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [454],
  {
    255: (e, t, r) => {
      function n(e) {
        let { moduleIds: t } = e;
        return null;
      }
      Object.defineProperty(t, "__esModule", { value: !0 }),
        Object.defineProperty(t, "PreloadChunks", {
          enumerable: !0,
          get: function () {
            return n;
          },
        }),
        r(5155),
        r(7650),
        r(5744),
        r(589);
    },
    1703: (e, t, r) => {
      r.d(t, { A: () => a });
      var n = r(2115);
      let a = () => {
        let [e, t] = (0, n.useState)(null),
          [r, a] = (0, n.useState)(null),
          [o, l] = (0, n.useState)([]),
          [i, s] = (0, n.useState)(null),
          [c, u] = (0, n.useState)(""),
          [d, f] = (0, n.useState)(""),
          [b, v] = (0, n.useState)(""),
          [p, h] = (0, n.useState)(""),
          [x, m] = (0, n.useState)(null),
          [g, y] = (0, n.useState)(!1),
          j = "https://planningpoint-9jo7.onrender.com",
          w = localStorage.getItem("token"),
          _ = () => {
            l([]), u(""), s(null), f(""), v(""), h("");
          },
          S = async () => {
            try {
              t(!0);
              let e = await fetch("".concat(j, "/ping"));
              if ((m(e.ok), !e.ok || !w)) {
                a(!1), _();
                return;
              }
              let r = await fetch("".concat(j, "/user/check-login"), {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer ".concat(w),
                },
              });
              if (!r.ok) {
                a(!1), _();
                return;
              }
              let n = await r.json(),
                o = !0 === n.isLoggedIn;
              if ((a(o), o)) {
                let e = await fetch("".concat(j, "/user/info"), {
                  headers: { Authorization: "Bearer ".concat(w) },
                });
                if (!e.ok) return void _();
                let t = await e.json();
                l(t.roles),
                  u(t.username),
                  s(t.userId),
                  f(t.firstName),
                  v(t.lastName),
                  h(t.email);
              } else _();
            } catch (e) {
              m(!1), a(!1), _();
            } finally {
              t(!1), y(!0);
            }
          };
        return (
          (0, n.useEffect)(() => {
            S();
          }, []),
          {
            isLoggedIn: r,
            isAdmin: o.includes("Admin"),
            isDev: o.includes("Developer"),
            isConnected: x,
            isAuthReady: g,
            username: c,
            userId: i,
            firstName: d,
            lastName: b,
            email: p,
            fetchAuthData: S,
          }
        );
      };
    },
    1972: (e, t, r) => {
      r.d(t, {
        $U: () => c,
        $e: () => n,
        Kt: () => u,
        U0: () => i,
        XM: () => f,
        Xd: () => s,
        eA: () => o,
        lj: () => d,
        p9: () => a,
        s9: () => l,
      });
      let n =
          "whitespace-nowrap h-[40px] w-[40px] cursor-pointer rounded bg-(--button-primary)] p-2 font-semibold text-(--text-main-reverse)] transition-colors hover:bg-(--button-primary-hover)] hover:text-(--text-main)] active:bg-(--button-primary-active)] disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-(--button-primary)] z-[calc(var(--z-base)+1)]",
        a =
          "whitespace-nowrap h-[40px] w-[40px] cursor-pointer rounded border border-(--button-secondary)] p-2 font-semibold transition-colors hover:border-(--button-secondary-hover)] active:border-(--button-secondary-active)] disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:border-(--border-main)] z-[calc(var(--z-base)+1)]",
        o =
          "h-[40px] w-[40px] cursor-pointer rounded bg-(--button-delete)] p-2 font-semibold text-(--text-main-reverse)] transition-colors hover:bg-(--button-delete-hover)] hover:text-(--text-main)] active:bg-(--button-delete-active)] disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-(--button-delete)] z-[calc(var(--z-base)+1)]",
        l =
          "h-[40px] w-[40px] cursor-pointer rounded border border-(--button-secondary)] p-2 font-semibold transition-colors hover:border-(--button-delete)] active:border-(--button-delete-active)] disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:border-(--border-main)] z-[calc(var(--z-base)+1)]",
        i =
          "h-[24px] w-[24px] flex items-center justify-center cursor-pointer transition-colors duration-(--fast)] hover:text-(--button-primary)] active:text-(--button-primary-active)] z-[calc(var(--z-base)+1)] disabled:opacity-25 disabled:hover:text-(--text-main)] disabled:cursor-not-allowed",
        s =
          "h-[24px] w-[24px] flex items-center justify-center cursor-pointer transition-colors duration-(--fast)] hover:text-(--button-delete)] active:text-(--button-delete-active)] z-[calc(var(--z-base)+1)]",
        c =
          "cursor-pointer font-semibold text-(--accent-color)] transition-[color] duration-(--fast)] hover:text-(--accent-color-hover)] z-[calc(var(--z-base)+1)]",
        u =
          "h-[40px] w-[40px] flex justify-center items-center cursor-pointer bg-(--bg-navbar-link)] rounded-full z-[calc(var(--z-base)+1)]",
        d = (e) =>
          "".concat(
            e ? "bg-(--accent-color)]" : "bg-gray-500",
            " h-6 w-10 cursor-pointer rounded-full px-0.5",
          ),
        f = (e) =>
          "".concat(
            e ? "translate-x-4" : "translate-x-0",
            " h-5 w-5 rounded-full bg-white duration-(--fast)]",
          );
    },
    2146: (e, t, r) => {
      function n(e) {
        let { reason: t, children: r } = e;
        return r;
      }
      Object.defineProperty(t, "__esModule", { value: !0 }),
        Object.defineProperty(t, "BailoutToCSR", {
          enumerable: !0,
          get: function () {
            return n;
          },
        }),
        r(5262);
    },
    4054: (e, t) => {
      Object.defineProperty(t, "__esModule", { value: !0 }),
        !(function (e, t) {
          for (var r in t)
            Object.defineProperty(e, r, { enumerable: !0, get: t[r] });
        })(t, {
          bindSnapshot: function () {
            return l;
          },
          createAsyncLocalStorage: function () {
            return o;
          },
          createSnapshot: function () {
            return i;
          },
        });
      let r = Object.defineProperty(
        Error(
          "Invariant: AsyncLocalStorage accessed in runtime where it is not available",
        ),
        "__NEXT_ERROR_CODE",
        { value: "E504", enumerable: !1, configurable: !0 },
      );
      class n {
        disable() {
          throw r;
        }
        getStore() {}
        run() {
          throw r;
        }
        exit() {
          throw r;
        }
        enterWith() {
          throw r;
        }
        static bind(e) {
          return e;
        }
      }
      let a = "undefined" != typeof globalThis && globalThis.AsyncLocalStorage;
      function o() {
        return a ? new a() : new n();
      }
      function l(e) {
        return a ? a.bind(e) : n.bind(e);
      }
      function i() {
        return a
          ? a.snapshot()
          : function (e, ...t) {
              return e(...t);
            };
      }
    },
    5028: (e, t, r) => {
      r.d(t, { default: () => a.a });
      var n = r(6645),
        a = r.n(n);
    },
    5744: (e, t, r) => {
      Object.defineProperty(t, "__esModule", { value: !0 }),
        Object.defineProperty(t, "workAsyncStorage", {
          enumerable: !0,
          get: function () {
            return n.workAsyncStorageInstance;
          },
        });
      let n = r(7828);
    },
    6645: (e, t, r) => {
      Object.defineProperty(t, "__esModule", { value: !0 }),
        Object.defineProperty(t, "default", {
          enumerable: !0,
          get: function () {
            return a;
          },
        });
      let n = r(8229)._(r(7357));
      function a(e, t) {
        var r;
        let a = {};
        "function" == typeof e && (a.loader = e);
        let o = { ...a, ...t };
        return (0, n.default)({
          ...o,
          modules: null == (r = o.loadableGenerated) ? void 0 : r.modules,
        });
      }
      ("function" == typeof t.default ||
        ("object" == typeof t.default && null !== t.default)) &&
        void 0 === t.default.__esModule &&
        (Object.defineProperty(t.default, "__esModule", { value: !0 }),
        Object.assign(t.default, t),
        (e.exports = t.default));
    },
    7357: (e, t, r) => {
      Object.defineProperty(t, "__esModule", { value: !0 }),
        Object.defineProperty(t, "default", {
          enumerable: !0,
          get: function () {
            return s;
          },
        });
      let n = r(5155),
        a = r(2115),
        o = r(2146);
      function l(e) {
        return { default: e && "default" in e ? e.default : e };
      }
      r(255);
      let i = {
          loader: () => Promise.resolve(l(() => null)),
          loading: null,
          ssr: !0,
        },
        s = function (e) {
          let t = { ...i, ...e },
            r = (0, a.lazy)(() => t.loader().then(l)),
            s = t.loading;
          function c(e) {
            let l = s
                ? (0, n.jsx)(s, { isLoading: !0, pastDelay: !0, error: null })
                : null,
              i = !t.ssr || !!t.loading,
              c = i ? a.Suspense : a.Fragment,
              u = t.ssr
                ? (0, n.jsxs)(n.Fragment, {
                    children: [null, (0, n.jsx)(r, { ...e })],
                  })
                : (0, n.jsx)(o.BailoutToCSR, {
                    reason: "next/dynamic",
                    children: (0, n.jsx)(r, { ...e }),
                  });
            return (0, n.jsx)(c, {
              ...(i ? { fallback: l } : {}),
              children: u,
            });
          }
          return (c.displayName = "LoadableComponent"), c;
        };
    },
    7828: (e, t, r) => {
      Object.defineProperty(t, "__esModule", { value: !0 }),
        Object.defineProperty(t, "workAsyncStorageInstance", {
          enumerable: !0,
          get: function () {
            return n;
          },
        });
      let n = (0, r(4054).createAsyncLocalStorage)();
    },
    7877: (e, t, r) => {
      r.d(t, { default: () => w });
      var n = r(5155),
        a = r(1972),
        o = r(5279),
        l = r(3347),
        i = r(8338),
        s = r(4170),
        c = r(4393),
        u = r(6073),
        d = r(1817),
        f = r(4760),
        b = r(3466),
        v = r(5442),
        p = r(8688),
        h = r(8054),
        x = r(6874),
        m = r.n(x),
        g = r(2115);
      let y = {
          loading: o.A,
          deny: l.A,
          server: i.A,
          user: s.A,
          category: c.A,
          unit: u.A,
          unitGroup: d.A,
          beware: f.A,
          search: b.A,
          lock: v.A,
          work: p.A,
        },
        j = {
          loading: "Laddar...",
          auth: "Autentiserar...",
          deny: (0, n.jsxs)("div", {
            className: "flex flex-col",
            children: [
              (0, n.jsx)("span", { children: "Obeh\xf6rig access!" }),
              " ",
              (0, n.jsxs)("span", {
                children: [
                  (0, n.jsx)(m(), {
                    href: "/",
                    className: "".concat(a.$U),
                    children: "Klicka h\xe4r",
                  }),
                  " ",
                  "f\xf6r att logga in.",
                ],
              }),
            ],
          }),
          server: "Ingen kontakt med servern, f\xf6rs\xf6k igen senare!",
          lock: (0, n.jsxs)("div", {
            className: "flex flex-col",
            children: [
              (0, n.jsx)("span", {
                children: "Sidan \xe4r ej tillg\xe4nglig f\xf6r tillf\xe4llet!",
              }),
              " ",
              (0, n.jsx)("span", { children: "F\xf6rs\xf6k igen senare." }),
            ],
          }),
          fof: (0, n.jsx)("div", {
            className: "flex flex-col",
            children: (0, n.jsx)("span", {
              children: "Sidan kunde inte hittas.",
            }),
          }),
        },
        w = (e) => {
          var t;
          let [r, a] = (0, g.useState)(null);
          (0, g.useEffect)(() => {
            a(() => {
              var t;
              return e.icon && null != (t = y[e.icon]) ? t : null;
            });
          }, [e.icon]);
          let o = null != (t = e.content && j[e.content]) ? t : e.content;
          return (0, n.jsx)("div", {
            className: ""
              .concat(
                e.fullscreen ? "fixed inset-0 overflow-auto" : "h-full grow",
                " ",
              )
              .concat(
                !e.withinContainer && e.fullscreen
                  ? "ml-18 md:ml-64"
                  : e.withinContainer && e.fullscreen && "",
                " flex items-center justify-center",
              ),
            children: (0, n.jsxs)("div", {
              className: "".concat(
                e.sideMessage ? "" : "flex-col",
                " flex items-center gap-3 opacity-75",
              ),
              children: [
                e.icon && r
                  ? (0, n.jsx)(r, {
                      className: "".concat(
                        "loading" === e.icon
                          ? "motion-safe:animate-[spin_2s_linear_infinite]"
                          : "",
                        " h-8 w-8",
                      ),
                    })
                  : e.icon
                    ? (0, n.jsx)("div", { className: "h-8 w-8" })
                    : (0, n.jsx)(h.A, { className: "h-8 w-8" }),
                o &&
                  (0, n.jsx)("span", { className: "text-center", children: o }),
              ],
            }),
          });
        };
    },
  },
]);
