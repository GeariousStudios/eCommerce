(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [345],
  {
    1972: (e, r, t) => {
      "use strict";
      t.d(r, {
        $U: () => c,
        $e: () => a,
        Kt: () => d,
        U0: () => i,
        XM: () => b,
        Xd: () => l,
        eA: () => n,
        lj: () => v,
        p9: () => o,
        s9: () => s,
      });
      let a =
          "whitespace-nowrap h-[40px] w-[40px] cursor-pointer rounded bg-(--button-primary)] p-2 font-semibold text-(--text-main-reverse)] transition-colors hover:bg-(--button-primary-hover)] hover:text-(--text-main)] active:bg-(--button-primary-active)] disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-(--button-primary)] z-[calc(var(--z-base)+1)]",
        o =
          "whitespace-nowrap h-[40px] w-[40px] cursor-pointer rounded border border-(--button-secondary)] p-2 font-semibold transition-colors hover:border-(--button-secondary-hover)] active:border-(--button-secondary-active)] disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:border-(--border-main)] z-[calc(var(--z-base)+1)]",
        n =
          "h-[40px] w-[40px] cursor-pointer rounded bg-(--button-delete)] p-2 font-semibold text-(--text-main-reverse)] transition-colors hover:bg-(--button-delete-hover)] hover:text-(--text-main)] active:bg-(--button-delete-active)] disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-(--button-delete)] z-[calc(var(--z-base)+1)]",
        s =
          "h-[40px] w-[40px] cursor-pointer rounded border border-(--button-secondary)] p-2 font-semibold transition-colors hover:border-(--button-delete)] active:border-(--button-delete-active)] disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:border-(--border-main)] z-[calc(var(--z-base)+1)]",
        i =
          "h-[24px] w-[24px] flex items-center justify-center cursor-pointer transition-colors duration-(--fast)] hover:text-(--button-primary)] active:text-(--button-primary-active)] z-[calc(var(--z-base)+1)] disabled:opacity-25 disabled:hover:text-(--text-main)] disabled:cursor-not-allowed",
        l =
          "h-[24px] w-[24px] flex items-center justify-center cursor-pointer transition-colors duration-(--fast)] hover:text-(--button-delete)] active:text-(--button-delete-active)] z-[calc(var(--z-base)+1)]",
        c =
          "cursor-pointer font-semibold text-(--accent-color)] transition-[color] duration-(--fast)] hover:text-(--accent-color-hover)] z-[calc(var(--z-base)+1)]",
        d =
          "h-[40px] w-[40px] flex justify-center items-center cursor-pointer bg-(--bg-navbar-link)] rounded-full z-[calc(var(--z-base)+1)]",
        v = (e) =>
          "".concat(
            e ? "bg-(--accent-color)]" : "bg-gray-500",
            " h-6 w-10 cursor-pointer rounded-full px-0.5",
          ),
        b = (e) =>
          "".concat(
            e ? "translate-x-4" : "translate-x-0",
            " h-5 w-5 rounded-full bg-white duration-(--fast)]",
          );
    },
    7808: (e, r, t) => {
      Promise.resolve().then(t.bind(t, 7877));
    },
    7877: (e, r, t) => {
      "use strict";
      t.d(r, { default: () => j });
      var a = t(5155),
        o = t(1972),
        n = t(5279),
        s = t(3347),
        i = t(8338),
        l = t(4170),
        c = t(4393),
        d = t(6073),
        v = t(1817),
        b = t(4760),
        u = t(3466),
        x = t(5442),
        h = t(8688),
        p = t(8054),
        f = t(6874),
        m = t.n(f),
        g = t(2115);
      let w = {
          loading: n.A,
          deny: s.A,
          server: i.A,
          user: l.A,
          category: c.A,
          unit: d.A,
          unitGroup: v.A,
          beware: b.A,
          search: u.A,
          lock: x.A,
          work: h.A,
        },
        y = {
          loading: "Laddar...",
          auth: "Autentiserar...",
          deny: (0, a.jsxs)("div", {
            className: "flex flex-col",
            children: [
              (0, a.jsx)("span", { children: "Obeh\xf6rig access!" }),
              " ",
              (0, a.jsxs)("span", {
                children: [
                  (0, a.jsx)(m(), {
                    href: "/",
                    className: "".concat(o.$U),
                    children: "Klicka h\xe4r",
                  }),
                  " ",
                  "f\xf6r att logga in.",
                ],
              }),
            ],
          }),
          server: "Ingen kontakt med servern, f\xf6rs\xf6k igen senare!",
          lock: (0, a.jsxs)("div", {
            className: "flex flex-col",
            children: [
              (0, a.jsx)("span", {
                children: "Sidan \xe4r ej tillg\xe4nglig f\xf6r tillf\xe4llet!",
              }),
              " ",
              (0, a.jsx)("span", { children: "F\xf6rs\xf6k igen senare." }),
            ],
          }),
          fof: (0, a.jsx)("div", {
            className: "flex flex-col",
            children: (0, a.jsx)("span", {
              children: "Sidan kunde inte hittas.",
            }),
          }),
        },
        j = (e) => {
          var r;
          let [t, o] = (0, g.useState)(null);
          (0, g.useEffect)(() => {
            o(() => {
              var r;
              return e.icon && null != (r = w[e.icon]) ? r : null;
            });
          }, [e.icon]);
          let n = null != (r = e.content && y[e.content]) ? r : e.content;
          return (0, a.jsx)("div", {
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
            children: (0, a.jsxs)("div", {
              className: "".concat(
                e.sideMessage ? "" : "flex-col",
                " flex items-center gap-3 opacity-75",
              ),
              children: [
                e.icon && t
                  ? (0, a.jsx)(t, {
                      className: "".concat(
                        "loading" === e.icon
                          ? "motion-safe:animate-[spin_2s_linear_infinite]"
                          : "",
                        " h-8 w-8",
                      ),
                    })
                  : e.icon
                    ? (0, a.jsx)("div", { className: "h-8 w-8" })
                    : (0, a.jsx)(p.A, { className: "h-8 w-8" }),
                n &&
                  (0, a.jsx)("span", { className: "text-center", children: n }),
              ],
            }),
          });
        };
    },
  },
  (e) => {
    var r = (r) => e((e.s = r));
    e.O(0, [209, 441, 684, 358], () => r(7808)), (_N_E = e.O());
  },
]);
