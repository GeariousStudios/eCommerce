"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [115],
  {
    7115: (e, l, s) => {
      s.r(l), s.d(l, { default: () => R });
      var a = s(5155),
        n = s(2115),
        t = s(1701),
        r = s(3555),
        i = s(8500),
        c = s(4541),
        o = s(815),
        d = s(6934),
        x = s(4822),
        m = s(6493),
        h = s(5271),
        u = s(3472),
        f = s(3762),
        p = s(2237),
        j = s(7765),
        v = s(2175),
        g = s(1151),
        b = s(1972),
        w = s(7877),
        N = s(4402),
        k = s(251),
        y = s(4163);
      let A = (e) => {
        let l = (0, n.useRef)(null),
          [s, r] = (0, n.useState)(""),
          [c, o] = (0, n.useState)(""),
          [d, x] = (0, n.useState)(""),
          [m, h] = (0, n.useState)(""),
          [u, f] = (0, n.useState)(""),
          [p, g] = (0, n.useState)([]),
          [w, N] = (0, n.useState)(!1),
          A = localStorage.getItem("token"),
          { notify: S } = (0, i.d)(),
          C = "https://planningpoint-9jo7.onrender.com";
        (0, n.useEffect)(() => {
          e.isOpen &&
            (null !== e.userId && void 0 !== e.userId
              ? I()
              : (r(""), o(""), x(""), h(""), f(""), g([]), N(!1)));
        }, [e.isOpen, e.userId]);
        let D = async (l) => {
            l.preventDefault();
            try {
              let l = await fetch("".concat(C, "/user-management/create"), {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer ".concat(A),
                },
                body: JSON.stringify({
                  username: s,
                  firstName: c,
                  lastName: d,
                  password: m,
                  email: "" === u.trim() ? null : u,
                  roles: p,
                  isLocked: w,
                }),
              });
              if (401 === l.status)
                return void localStorage.removeItem("token");
              let a = await l.json();
              if (!l.ok) {
                if (a.errors) {
                  let e = null,
                    l = Number.MAX_SAFE_INTEGER;
                  for (let s in a.errors)
                    for (let n of a.errors[s]) {
                      let s = n.match(/\[(\d+)\]/),
                        a = s ? parseInt(s[1], 10) : 99;
                      a < l && ((l = a), (e = n.replace(/\[\d+\]\s*/, "")));
                    }
                  e && S("error", e);
                  return;
                }
                if (a.message) return void S("error", a.message);
                S("error", "Ett ok\xe4nt fel intr\xe4ffade");
                return;
              }
              e.onClose(),
                e.onUserUpdated(),
                S("success", "Anv\xe4ndare skapad!", 4e3);
            } catch (e) {
              S("error", String(e));
            }
          },
          I = async () => {
            try {
              let l = await fetch(
                  "".concat(C, "/user-management/fetch/").concat(e.userId),
                  {
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: "Bearer ".concat(A),
                    },
                  },
                ),
                s = await l.json();
              l.ok ? E(s) : S("error", s.message);
            } catch (e) {
              S("error", String(e));
            }
          },
          E = (e) => {
            var l, s, a, n, t, i;
            r(null != (l = e.username) ? l : ""),
              o(null != (s = e.firstName) ? s : ""),
              x(null != (a = e.lastName) ? a : ""),
              h(""),
              f(null != (n = e.email) ? n : ""),
              g(null != (t = e.roles) ? t : []),
              N(null != (i = e.isLocked) && i);
          },
          L = async (l, a) => {
            l.preventDefault();
            try {
              let l = await fetch(
                "".concat(C, "/user-management/update/").concat(e.userId),
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer ".concat(A),
                  },
                  body: JSON.stringify({
                    username: s,
                    firstName: c,
                    lastName: d,
                    password: m,
                    email: "" === u.trim() ? null : u,
                    roles: p,
                    isLocked: w,
                  }),
                },
              );
              if (401 === l.status)
                return void localStorage.removeItem("token");
              let a = await l.json();
              if (!l.ok) {
                if (a.errors) {
                  let e = null,
                    l = Number.MAX_SAFE_INTEGER;
                  for (let s in a.errors)
                    for (let n of a.errors[s]) {
                      let s = n.match(/\[(\d+)\]/),
                        a = s ? parseInt(s[1], 10) : 99;
                      a < l && ((l = a), (e = n.replace(/\[\d+\]\s*/, "")));
                    }
                  e && S("error", e);
                  return;
                }
                if (a.message) return void S("error", a.message);
                S("error", "Ett ok\xe4nt fel intr\xe4ffade");
                return;
              }
              e.onClose(),
                e.onUserUpdated(),
                S("success", "Anv\xe4ndare uppdaterad!", 4e3);
            } catch (e) {
              S("error", String(e));
            }
          };
        return (0, a.jsx)(a.Fragment, {
          children:
            e.isOpen &&
            (0, a.jsx)(y.A, {
              isOpen: e.isOpen,
              onClose: () => e.onClose(),
              icon: e.userId ? v.A : j.A,
              label: e.userId
                ? "Redigera anv\xe4ndare"
                : "L\xe4gg till ny anv\xe4ndare",
              children: (0, a.jsxs)("form", {
                ref: l,
                className: "relative flex flex-col gap-4",
                onSubmit: (l) => (e.userId ? L(l, e.userId) : D(l)),
                children: [
                  (0, a.jsxs)("div", {
                    className: "flex items-center gap-2",
                    children: [
                      (0, a.jsx)("hr", {
                        className: "w-12 text-(--border-main)]",
                      }),
                      (0, a.jsx)("h3", {
                        className:
                          "text-sm whitespace-nowrap text-(--text-secondary)",
                        children: "Inloggningsuppgifter",
                      }),
                      (0, a.jsx)("hr", {
                        className: "w-full text-(--border-main)]",
                      }),
                    ],
                  }),
                  (0, a.jsxs)("div", {
                    className: "flex flex-col gap-6 sm:flex-row sm:gap-4",
                    children: [
                      (0, a.jsx)(t.A, {
                        id: "username",
                        label: "Anv\xe4ndarnamn",
                        value: s,
                        onChange: (e) => r(String(e)),
                        onModal: !0,
                        required: !0,
                        autoComplete: "new-username",
                      }),
                      null !== e.userId
                        ? (0, a.jsx)(t.A, {
                            type: "password",
                            id: "password",
                            label: "L\xf6senord",
                            value: m,
                            placeholder: "•••••••••",
                            onChange: (e) => h(String(e)),
                            onModal: !0,
                          })
                        : (0, a.jsx)(t.A, {
                            type: "password",
                            id: "password",
                            label: "L\xf6senord",
                            value: m,
                            onChange: (e) => h(String(e)),
                            onModal: !0,
                            required: !0,
                            autoComplete: "new-password",
                          }),
                    ],
                  }),
                  (0, a.jsxs)("div", {
                    className: "mt-8 flex items-center gap-2",
                    children: [
                      (0, a.jsx)("hr", {
                        className: "w-12 text-(--border-main)]",
                      }),
                      (0, a.jsx)("h3", {
                        className:
                          "text-sm whitespace-nowrap text-(--text-secondary)",
                        children: "Anv\xe4ndardetaljer",
                      }),
                      (0, a.jsx)("hr", {
                        className: "w-full text-(--border-main)]",
                      }),
                    ],
                  }),
                  (0, a.jsxs)("div", {
                    className: "flex flex-col gap-6 sm:flex-row sm:gap-4",
                    children: [
                      (0, a.jsx)(t.A, {
                        id: "email",
                        label: "Mejladress",
                        value: u,
                        onChange: (e) => f(String(e)),
                        onModal: !0,
                      }),
                      (0, a.jsxs)("div", {
                        className: "flex w-full gap-6 sm:gap-4",
                        children: [
                          (0, a.jsx)(t.A, {
                            id: "firstName",
                            label: "F\xf6rnamn",
                            value: c,
                            onChange: (e) => o(String(e)),
                            onModal: !0,
                          }),
                          (0, a.jsx)(t.A, {
                            id: "lastName",
                            label: "Efternamn",
                            value: d,
                            onChange: (e) => x(String(e)),
                            onModal: !0,
                          }),
                        ],
                      }),
                    ],
                  }),
                  (0, a.jsxs)("div", {
                    className: "mt-8 flex items-center gap-2",
                    children: [
                      (0, a.jsx)("hr", {
                        className: "w-12 text-(--border-main)]",
                      }),
                      (0, a.jsx)("h3", {
                        className:
                          "text-sm whitespace-nowrap text-(--text-secondary)",
                        children: "Beh\xf6righeter och status",
                      }),
                      (0, a.jsx)("hr", {
                        className: "w-full text-(--border-main)]",
                      }),
                    ],
                  }),
                  (0, a.jsxs)("div", {
                    className: "mb-8 flex justify-between gap-4",
                    children: [
                      (0, a.jsx)("div", {
                        className: "flex w-[calc(50%-0.375rem)] min-w-36",
                        children: (0, a.jsx)(k.A, {
                          label: "Beh\xf6righeter",
                          options: [
                            { label: "Admin", value: "Admin" },
                            { label: "Developer", value: "Developer" },
                          ],
                          value: p,
                          onChange: g,
                          onModal: !0,
                          required: !0,
                        }),
                      }),
                      (0, a.jsxs)("div", {
                        className: "flex items-center gap-2 truncate",
                        children: [
                          (0, a.jsx)("button", {
                            type: "button",
                            role: "switch",
                            "aria-checked": w,
                            className: (0, b.lj)(w),
                            onClick: () => N((e) => !e),
                            children: (0, a.jsx)("div", {
                              className: (0, b.XM)(w),
                            }),
                          }),
                          (0, a.jsx)("span", {
                            className: "mb-0.5",
                            children: "L\xe5s konto",
                          }),
                        ],
                      }),
                    ],
                  }),
                  (0, a.jsxs)("div", {
                    className:
                      "flex flex-col gap-4 sm:flex-row sm:justify-between",
                    children: [
                      (0, a.jsx)("button", {
                        type: "button",
                        onClick: () => {
                          var e;
                          null == (e = l.current) || e.requestSubmit();
                        },
                        className: "".concat(b.$e, " w-full grow-2 sm:w-auto"),
                        children: e.userId ? "Uppdatera" : "L\xe4gg till",
                      }),
                      (0, a.jsx)("button", {
                        type: "button",
                        onClick: e.onClose,
                        className: "".concat(b.p9, " w-full grow sm:w-auto"),
                        children: "\xc5ngra",
                      }),
                    ],
                  }),
                ],
              }),
            }),
        });
      };
      var S = s(3107),
        C = s(703);
      let D =
          "pl-4 p-2 min-w-48 h-[40px] cursor-pointer border border-t-0 border-(--border-secondary)] border-b-(--border-main)] text-left transition-[background] duration-(--fast)] hover:bg-(--bg-grid-header-hover)]",
        I =
          "py-2 px-4 min-w-48 h-[40px] border border-b-0 border-(--border-secondary)] text-left break-all",
        E =
          "truncate font-semibold transition-colors duration-(--fast)] group-hover:text-(--accent-color)]",
        L =
          "h-6 w-6 transition-[color,rotate] duration-(--fast)] group-hover:text-(--accent-color)]",
        M = (e) => {
          let { filterRef: l, label: s, breakpoint: r, filterData: i } = e,
            [c, d] = (0, n.useState)(!1),
            x = "relative hidden ";
          return (
            "2xs" === r
              ? (x += "2xs:flex")
              : "xs" === r
                ? (x += "xs:flex")
                : "sm" === r
                  ? (x += "sm:flex")
                  : "md" === r
                    ? (x += "md:flex")
                    : "ml" === r
                      ? (x += "ml:flex")
                      : "lg" === r
                        ? (x += "lg:flex")
                        : "xl" === r
                          ? (x += "xl:flex")
                          : "2xl" === r && (x += "2xl:flex"),
            (0, a.jsxs)("div", {
              className: x,
              children: [
                (0, a.jsxs)("button", {
                  ref: l,
                  className: "".concat(b.Kt, " group w-auto gap-2 px-4"),
                  onClick: () => {
                    d((e) => !e);
                  },
                  children: [
                    (0, a.jsx)("span", {
                      className: ""
                        .concat(E, " ")
                        .concat(c ? "text-(--accent-color)]" : ""),
                      children: s,
                    }),
                    (0, a.jsx)(o.A, {
                      className: ""
                        .concat(L, " ")
                        .concat(c ? "rotate-180 text-(--accent-color)]" : ""),
                    }),
                  ],
                }),
                (0, a.jsx)(S.A, {
                  triggerRef: l,
                  isOpen: c,
                  onClose: () => d(!1),
                  children: (0, a.jsx)("div", {
                    className: "flex w-full flex-col gap-4",
                    children: i.map((e, l) => {
                      var s;
                      return (0, a.jsxs)(
                        "div",
                        {
                          onClick: () => e.setShow(!e.show),
                          className:
                            "group flex cursor-pointer justify-between",
                          children: [
                            (0, a.jsx)(t.A, {
                              type: "checkbox",
                              checked: e.show,
                              label: e.label,
                              readOnly: !0,
                            }),
                            (0, a.jsxs)("span", {
                              children: [
                                "(",
                                null != (s = e.count) ? s : 0,
                                ")",
                              ],
                            }),
                          ],
                        },
                        l,
                      );
                    }),
                  }),
                }),
              ],
            })
          );
        },
        O = (e) => {
          let { filterRef: l, label: s, filterData: r } = e,
            [i, c] = (0, n.useState)(!1),
            [d, x] = (0, n.useState)("0px");
          return (
            (0, n.useEffect)(() => {
              l.current &&
                x(i ? "".concat(l.current.scrollHeight, "px") : "0px");
            }, [i]),
            (0, a.jsxs)("div", {
              children: [
                (0, a.jsxs)("button", {
                  onClick: () => c((e) => !e),
                  className: "".concat(
                    i ? "text-(--accent-color)]" : "",
                    " flex w-full cursor-pointer items-center justify-between py-4 duration-(--fast)] hover:text-(--accent-color)]",
                  ),
                  children: [
                    (0, a.jsx)("span", {
                      className: "text-lg font-semibold",
                      children: s,
                    }),
                    (0, a.jsx)(o.A, {
                      className: "".concat(
                        i ? "rotate-180" : "",
                        " transition-rotate h-6 w-6 duration-(--fast)]",
                      ),
                    }),
                  ],
                }),
                (0, a.jsx)("div", {
                  style: { height: d },
                  className:
                    "overflow-hidden transition-[height] duration-(--slow)]",
                  children: (0, a.jsx)("div", {
                    ref: l,
                    children: (0, a.jsx)("div", {
                      className: "flex w-full flex-col",
                      children: r.map((e, l) => {
                        var s;
                        return (0, a.jsxs)(
                          "div",
                          {
                            onClick: () => e.setShow(!e.show),
                            className: "".concat(
                              l === r.length - 1 ? "mb-4" : "",
                              " group flex cursor-pointer justify-between py-4",
                            ),
                            children: [
                              (0, a.jsx)(t.A, {
                                type: "checkbox",
                                checked: e.show,
                                label: e.label,
                                readOnly: !0,
                              }),
                              (0, a.jsxs)("span", {
                                children: [
                                  "(",
                                  null != (s = e.count) ? s : 0,
                                  ")",
                                ],
                              }),
                            ],
                          },
                          l,
                        );
                      }),
                    }),
                  }),
                }),
                (0, a.jsx)("hr", {
                  className:
                    "-ml-4 flex w-[calc(100%+2rem)] text-(--border-main)]",
                }),
              ],
            })
          );
        },
        R = (e) => {
          let [l, s] = (0, n.useState)(8),
            [k, y] = (0, n.useState)(!1),
            [S, R] = (0, n.useState)(null),
            [U, T] = (0, n.useState)([]),
            [B, K] = (0, n.useState)(null),
            [F, z] = (0, n.useState)([]),
            [_, H] = (0, n.useState)(!1),
            [V, q] = (0, n.useState)([]),
            [P, X] = (0, n.useState)(!1),
            [$, G] = (0, n.useState)(1),
            [J, W] = (0, n.useState)(5),
            [Q, Y] = (0, n.useState)(null),
            [Z, ee] = (0, n.useState)("id"),
            [el, es] = (0, n.useState)("asc"),
            [ea, en] = (0, n.useState)(""),
            [et, er] = (0, n.useState)(!1),
            [ei, ec] = (0, n.useState)(!1),
            [eo, ed] = (0, n.useState)(!1),
            [ex, em] = (0, n.useState)(!1),
            eh = localStorage.getItem("token"),
            eu = "https://planningpoint-9jo7.onrender.com",
            { notify: ef } = (0, i.d)(),
            ep = $ * J - J,
            ej = Math.max(0, Math.min(J, (null != Q ? Q : 0) - ep)),
            ev = Math.max(0, Math.min(J, ej)),
            eg = Math.max(1, Math.ceil((null != Q ? Q : 0) / J)),
            eb = (0, n.useRef)(null),
            ew = (0, n.useRef)(null),
            eN = (0, n.useRef)(null),
            ek = (0, n.useRef)(null),
            ey = (0, n.useRef)(null),
            [eA, eS] = (0, n.useState)(!1),
            eC = async function (e, l, s, a) {
              let n =
                !(arguments.length > 4) ||
                void 0 === arguments[4] ||
                arguments[4];
              try {
                var t, r;
                n && y(!0);
                let i = new URLSearchParams({
                  page: String(e),
                  pageSize: String(l),
                  sortBy: s,
                  sortOrder: a,
                  search: ea,
                });
                eo && !ex
                  ? i.append("isLocked", "true")
                  : !eo && ex && i.append("isLocked", "false"),
                  et && i.append("roles", "Admin"),
                  ei && i.append("roles", "Developer");
                let c = await fetch(
                  "".concat(eu, "/user-management?").concat(i.toString()),
                  {
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: "Bearer ".concat(eh),
                    },
                  },
                );
                if (401 === c.status)
                  return void localStorage.removeItem("token");
                let o = await c.json();
                if (!c.ok) return void ef("error", o.message);
                T(Array.isArray(o.items) ? o.items : []),
                  Y(null != (t = o.totalCount) ? t : 0),
                  R(null != (r = o.counts) ? r : null);
              } catch (e) {
              } finally {
                n && y(!1);
              }
            },
            eD = async (e) => {
              try {
                let l = await fetch(
                  "".concat(eu, "/user-management/delete/").concat(e),
                  {
                    method: "DELETE",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: "Bearer ".concat(eh),
                    },
                  },
                );
                if (401 === l.status)
                  return void localStorage.removeItem("token");
                let s = await l.json();
                if (!l.ok) return void ef("error", s.message);
                await eC($, J, Z, el),
                  ef("success", "Anv\xe4ndare borttagen!", 4e3);
              } catch (e) {
                ef("error", String(e));
              }
            };
          (0, n.useEffect)(() => {
            eC($, J, Z, el);
          }, [$, J, Z, el, ea, et, ei, eo, ex]),
            (0, n.useEffect)(() => {
              G(1);
            }, [ea, et, ei, eo, ex]);
          let eI = (e) => {
              let l = e === Z && "asc" === el ? "desc" : "asc";
              ee(e), es(l), eC($, J, e, l, !1);
            },
            eE = (e) =>
              Z !== e
                ? (0, a.jsx)(d.A, { className: "h-6 w-6" })
                : "asc" === el
                  ? (0, a.jsx)(x.A, { className: "h-6 w-6" })
                  : (0, a.jsx)(o.A, { className: "h-6 w-6" }),
            eL = U.map((e) => e.id),
            eM = U.filter((e) => !e.roles.includes("Master")).map((e) => e.id),
            eO = eM.length > 0 && eM.every((e) => F.includes(e)),
            eR = (e) => {
              let l = U.find((l) => l.id === e);
              !l ||
                l.roles.includes("Master") ||
                (F.includes(e) ? z(F.filter((l) => l !== e)) : z([...F, e]));
            },
            eU = () => {
              eO
                ? z(F.filter((e) => !eM.includes(e)))
                : z([...new Set([...F, ...eM])]);
            };
          (0, n.useEffect)(() => {
            let e = () => {
              let e = window.innerWidth,
                l = 4;
              e >= 640 && (l += 1),
                e >= 1024 && (l += 1),
                e >= 1280 && (l += 1),
                s(l);
            };
            return (
              e(),
              window.addEventListener("resize", e),
              () => removeEventListener("resize", e)
            );
          }, []);
          let eT = function () {
              let e =
                arguments.length > 0 && void 0 !== arguments[0]
                  ? arguments[0]
                  : [];
              q(e), X((e) => !e);
            },
            eB = function () {
              let e =
                arguments.length > 0 && void 0 !== arguments[0]
                  ? arguments[0]
                  : null;
              K(e), H(!0);
            },
            eK = (e) => {
              let { visible: l, onClickEvent: s, label: n } = e;
              return (0, a.jsx)(a.Fragment, {
                children:
                  l &&
                  (0, a.jsxs)("button", {
                    className: "".concat(b.Kt, " group w-auto gap-2 px-4"),
                    onClick: () => {
                      s(!1);
                    },
                    children: [
                      (0, a.jsx)("span", {
                        className: "".concat(E),
                        children: n,
                      }),
                      (0, a.jsx)(m.A, { className: "".concat(L) }),
                    ],
                  }),
              });
            },
            eF = (e) => {
              let {
                sortingItem: l,
                label: s,
                labelAsc: n,
                labelDesc: t,
                classNameAddition: r,
              } = e;
              return (0, a.jsx)(c.A, {
                content:
                  Z === l && "asc" === el ? "Sortera " + n : "Sortera " + t,
                children: (0, a.jsx)("th", {
                  className: "".concat(D, " ").concat(r || ""),
                  onClick: () => eI(l),
                  onKeyDown: (e) => {
                    ("Enter" === e.key || " " === e.key) &&
                      (e.preventDefault(), eI(l));
                  },
                  tabIndex: 0,
                  "aria-sort":
                    Z === l
                      ? "asc" === el
                        ? "ascending"
                        : "descending"
                      : "none",
                  children: (0, a.jsxs)("div", {
                    className: "relative flex gap-2",
                    children: [
                      (0, a.jsx)("span", {
                        className:
                          "w-full truncate overflow-hidden text-ellipsis",
                        children: s,
                      }),
                      (0, a.jsx)("span", {
                        className: "flex",
                        children: eE(l),
                      }),
                    ],
                  }),
                }),
              });
            },
            ez = (e) => {
              let { children: l, classNameAddition: s } = e;
              return (0, a.jsx)("td", {
                className: "".concat(I, " ").concat(s || ""),
                children: (0, a.jsx)("div", {
                  className: "truncate overflow-hidden text-ellipsis",
                  children: l,
                }),
              });
            };
          return (0, a.jsxs)(a.Fragment, {
            children: [
              (0, a.jsx)(A, {
                isOpen: _,
                onClose: () => {
                  H(!1), K(null);
                },
                userId: B,
                onUserUpdated: () => {
                  eC($, J, Z, el);
                },
              }),
              (0, a.jsx)(r.A, {
                isOpen: P,
                onClose: () => {
                  eT(), q([]);
                },
                onConfirm: async () => {
                  for (let e of V) await eD(e);
                  X(!1), q([]), z([]);
                },
              }),
              (0, a.jsxs)("div", {
                className: "flex flex-col gap-4",
                children: [
                  (0, a.jsxs)("div", {
                    className: "flex flex-col gap-4",
                    children: [
                      (0, a.jsxs)("div", {
                        className: "flex flex-wrap gap-4",
                        children: [
                          (0, a.jsx)(c.A, {
                            content: "L\xe4gg till ny anv\xe4ndare",
                            lgHidden: !0,
                            children: (0, a.jsx)("button", {
                              className: "".concat(
                                b.$e,
                                " sm:w-56 sm:min-w-56",
                              ),
                              onClick: () => {
                                eB();
                              },
                              onKeyDown: (e) => {
                                ("Enter" === e.key || " " === e.key) &&
                                  (e.preventDefault(), eB());
                              },
                              tabIndex: 0,
                              children: (0, a.jsxs)("div", {
                                className:
                                  "flex items-center justify-center gap-2 truncate",
                                children: [
                                  (0, a.jsx)(j.A, { className: "h-6" }),
                                  (0, a.jsx)("span", {
                                    className: "hidden sm:block",
                                    children: "L\xe4gg till ny anv\xe4ndare",
                                  }),
                                ],
                              }),
                            }),
                          }),
                          (0, a.jsx)(c.A, {
                            content:
                              0 === F.length
                                ? "V\xe4lj en anv\xe4ndare"
                                : 1 === F.length
                                  ? "Redigera anv\xe4ndare"
                                  : "Du kan bara redigera en anv\xe4ndare i taget!",
                            lgHidden: 1 === F.length,
                            showOnTouch: 0 === F.length || F.length > 1,
                            children: (0, a.jsx)("button", {
                              className: "".concat(
                                b.p9,
                                " sm:w-56 sm:min-w-56",
                              ),
                              onClick: () => {
                                eB(F[0]);
                              },
                              onKeyDown: (e) => {
                                ("Enter" === e.key || " " === e.key) &&
                                  (e.preventDefault(), eB(F[0]));
                              },
                              tabIndex: 0,
                              disabled: 0 === F.length || F.length > 1,
                              children: (0, a.jsxs)("div", {
                                className:
                                  "flex items-center justify-center gap-2 truncate",
                                children: [
                                  (0, a.jsx)(v.A, {
                                    className: "h-6 min-h-6 w-6 min-w-6",
                                  }),
                                  (0, a.jsx)("span", {
                                    className: "hidden sm:block",
                                    children: "Redigera anv\xe4ndare",
                                  }),
                                ],
                              }),
                            }),
                          }),
                          (0, a.jsx)(c.A, {
                            content:
                              0 === F.length
                                ? "V\xe4lj en eller fler anv\xe4ndare"
                                : "Ta bort anv\xe4ndare (".concat(
                                    F.length,
                                    ")",
                                  ),
                            lgHidden: F.length > 0,
                            showOnTouch: 0 === F.length,
                            children: (0, a.jsx)("button", {
                              className: "".concat(
                                b.s9,
                                " 3xs:ml-auto lg:w-56 lg:min-w-56",
                              ),
                              onClick: () => eT(F),
                              onKeyDown: (e) => {
                                ("Enter" === e.key || " " === e.key) &&
                                  (e.preventDefault(), eT(F));
                              },
                              tabIndex: 0,
                              disabled: 0 === F.length,
                              children: (0, a.jsxs)("div", {
                                className:
                                  "flex items-center justify-center gap-2 truncate",
                                children: [
                                  (0, a.jsx)(g.A, { className: "h-6" }),
                                  (0, a.jsxs)("span", {
                                    className: "hidden lg:block",
                                    children: [
                                      "Ta bort anv\xe4ndare",
                                      (0, a.jsx)("span", {
                                        children:
                                          F.length > 0
                                            ? " (".concat(F.length, ")")
                                            : "",
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                            }),
                          }),
                        ],
                      }),
                      (0, a.jsxs)("div", {
                        className:
                          "3xs:flex-nowrap flex flex-wrap justify-between gap-4",
                        children: [
                          (0, a.jsx)("div", {
                            className: "flex w-full items-center gap-4",
                            children: (0, a.jsx)("div", {
                              className:
                                "flex w-full items-center justify-start",
                              children: (0, a.jsx)(t.A, {
                                icon: (0, a.jsx)(h.A, {}),
                                placeholder: "S\xf6k anv\xe4ndare",
                                value: ea,
                                onChange: (e) => en(String(e).toLowerCase()),
                              }),
                            }),
                          }),
                          (0, a.jsxs)("div", {
                            className: "flex gap-4",
                            children: [
                              (0, a.jsx)(M, {
                                filterRef: eb,
                                label: "Beh\xf6righeter",
                                breakpoint: "sm",
                                filterData: [
                                  {
                                    label: "Admin",
                                    show: et,
                                    setShow: er,
                                    count:
                                      null == S ? void 0 : S.filteredAdmins,
                                  },
                                  {
                                    label: "Developer",
                                    show: ei,
                                    setShow: ec,
                                    count:
                                      null == S ? void 0 : S.filteredDevelopers,
                                  },
                                ],
                              }),
                              (0, a.jsx)(M, {
                                filterRef: ew,
                                label: "Status",
                                breakpoint: "ml",
                                filterData: [
                                  {
                                    label: "L\xe5st",
                                    show: eo,
                                    setShow: ed,
                                    count:
                                      null == S ? void 0 : S.filteredLocked,
                                  },
                                  {
                                    label: "Uppl\xe5st",
                                    show: ex,
                                    setShow: em,
                                    count:
                                      null == S ? void 0 : S.filteredUnlocked,
                                  },
                                ],
                              }),
                              (0, a.jsxs)("div", {
                                className: "relative",
                                children: [
                                  (0, a.jsxs)("button", {
                                    className: "".concat(
                                      b.Kt,
                                      " group xs:w-auto xs:px-4 gap-2",
                                    ),
                                    onClick: () => {
                                      eS(!0);
                                    },
                                    children: [
                                      (0, a.jsx)("span", {
                                        className: "".concat(
                                          E,
                                          " xs:flex hidden",
                                        ),
                                        children: "Alla filter",
                                      }),
                                      (0, a.jsx)(u.A, {
                                        className: "".concat(L),
                                      }),
                                    ],
                                  }),
                                  (0, a.jsx)(C.A, {
                                    triggerRef: eN,
                                    isOpen: eA,
                                    onClose: () => eS(!1),
                                    label: "Alla filter",
                                    children: (0, a.jsxs)("div", {
                                      className:
                                        "flex h-full flex-col justify-between",
                                      children: [
                                        (0, a.jsxs)("div", {
                                          className: "flex flex-col",
                                          children: [
                                            (0, a.jsx)(O, {
                                              filterRef: ek,
                                              label: "Beh\xf6righeter",
                                              filterData: [
                                                {
                                                  label: "Admin",
                                                  show: et,
                                                  setShow: er,
                                                  count:
                                                    null == S
                                                      ? void 0
                                                      : S.filteredAdmins,
                                                },
                                                {
                                                  label: "Developer",
                                                  show: ei,
                                                  setShow: ec,
                                                  count:
                                                    null == S
                                                      ? void 0
                                                      : S.filteredDevelopers,
                                                },
                                              ],
                                            }),
                                            (0, a.jsx)(O, {
                                              filterRef: ey,
                                              label: "Status",
                                              filterData: [
                                                {
                                                  label: "L\xe5st",
                                                  show: eo,
                                                  setShow: ed,
                                                  count:
                                                    null == S
                                                      ? void 0
                                                      : S.filteredLocked,
                                                },
                                                {
                                                  label: "Uppl\xe5st",
                                                  show: ex,
                                                  setShow: em,
                                                  count:
                                                    null == S
                                                      ? void 0
                                                      : S.filteredUnlocked,
                                                },
                                              ],
                                            }),
                                          ],
                                        }),
                                        (0, a.jsxs)("div", {
                                          className:
                                            "flex flex-col gap-4 py-4 sm:flex-row",
                                          children: [
                                            (0, a.jsxs)("button", {
                                              onClick: () => eS(!1),
                                              className: "".concat(
                                                b.$e,
                                                " w-full",
                                              ),
                                              children: [
                                                "Visa",
                                                " ",
                                                (0, a.jsx)("span", {
                                                  className: "font-normal",
                                                  children: null != Q ? Q : 0,
                                                }),
                                              ],
                                            }),
                                            (0, a.jsx)("button", {
                                              onClick: () => {
                                                ec(!1), er(!1), ed(!1), em(!1);
                                              },
                                              className: "".concat(
                                                b.p9,
                                                " w-full",
                                              ),
                                              disabled:
                                                !ei && !et && !eo && !ex,
                                              children: "Rensa alla",
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                      (et || ei || eo || ex) &&
                        (0, a.jsxs)("div", {
                          className: "flex flex-wrap gap-4",
                          children: [
                            (0, a.jsx)("span", {
                              className:
                                "flex items-center font-semibold text-(--text-secondary)",
                              children: "Aktiva filter:",
                            }),
                            (0, a.jsx)(eK, {
                              visible: et,
                              onClickEvent: er,
                              label: "Admin",
                            }),
                            (0, a.jsx)(eK, {
                              visible: ei,
                              onClickEvent: ec,
                              label: "Developer",
                            }),
                            (0, a.jsx)(eK, {
                              visible: eo,
                              onClickEvent: ed,
                              label: "L\xe5st",
                            }),
                            (0, a.jsx)(eK, {
                              visible: ex,
                              onClickEvent: em,
                              label: "Uppl\xe5st",
                            }),
                            (0, a.jsx)("button", {
                              className:
                                "group w-auto cursor-pointer rounded-full px-4 transition-colors duration-(--fast)] hover:bg-(--bg-navbar-link)]",
                              onClick: () => {
                                er(!1), ec(!1), ed(!1), em(!1);
                              },
                              children: (0, a.jsx)("span", {
                                className:
                                  "font-semibold text-(--accent-color)]",
                                children: "Rensa alla",
                              }),
                            }),
                          ],
                        }),
                    ],
                  }),
                  (0, a.jsx)("div", {
                    className: "flex w-full flex-col",
                    children: (0, a.jsx)("div", {
                      className:
                        "flex w-full overflow-x-auto rounded border border-(--border-main)]",
                      children: (0, a.jsxs)("table", {
                        className: "w-full table-fixed border-collapse",
                        children: [
                          (0, a.jsx)("thead", {
                            className: "".concat(
                              !e.isConnected || k ? "pointer-events-none" : "",
                              " bg-(--bg-grid-header)]",
                            ),
                            children: (0, a.jsxs)("tr", {
                              children: [
                                (0, a.jsx)("th", {
                                  className: "".concat(
                                    D,
                                    " !w-[40px] !min-w-[40px] !border-l-0 !pl-2",
                                  ),
                                  onClick: eU,
                                  onKeyDown: (e) => {
                                    ("Enter" === e.key || " " === e.key) &&
                                      (e.preventDefault(), eU());
                                  },
                                  children: (0, a.jsx)("div", {
                                    className:
                                      "flex items-center justify-center",
                                    children: (0, a.jsx)(t.A, {
                                      type: "checkbox",
                                      checked: eO,
                                      indeterminate:
                                        !eO && eL.some((e) => F.includes(e)),
                                      readOnly: !0,
                                    }),
                                  }),
                                }),
                                (0, a.jsx)(eF, {
                                  sortingItem: "username",
                                  label: "Anv\xe4ndarnamn",
                                  labelAsc: "anv\xe4ndarnamn \xd6-A",
                                  labelDesc: "anv\xe4ndarnamn A-\xd6",
                                }),
                                (0, a.jsx)(eF, {
                                  sortingItem: "firstName",
                                  label: "F\xf6rnamn",
                                  labelAsc: "f\xf6rnamn \xd6-A",
                                  labelDesc: "f\xf6rnamn A-\xd6",
                                  classNameAddition: "hidden xs:table-cell",
                                }),
                                (0, a.jsx)(eF, {
                                  sortingItem: "lastName",
                                  label: "Efternamn",
                                  labelAsc: "efternamn \xd6-A",
                                  labelDesc: "efternamn A-\xd6",
                                  classNameAddition: "hidden sm:table-cell",
                                }),
                                (0, a.jsx)(eF, {
                                  sortingItem: "email",
                                  label: "Mejladress",
                                  labelAsc: "mejladress \xd6-A",
                                  labelDesc: "mejladress A-\xd6",
                                  classNameAddition: "hidden lg:table-cell",
                                }),
                                (0, a.jsx)(eF, {
                                  sortingItem: "roles",
                                  label: "Beh\xf6righeter",
                                  labelAsc: "beh\xf6righeter \xd6-A",
                                  labelDesc: "beh\xf6righeter A-\xd6",
                                  classNameAddition: "hidden xl:table-cell",
                                }),
                                (0, a.jsx)(eF, {
                                  sortingItem: "isLocked",
                                  label: "Status",
                                  labelAsc: "l\xe5sta konton",
                                  labelDesc: "uppl\xe5sta konton",
                                  classNameAddition:
                                    "w-28 min-w-28 border-r-0 hidden 2xs:table-cell",
                                }),
                              ],
                            }),
                          }),
                          (0, a.jsx)("tbody", {
                            children:
                              e.isConnected && 0 !== U.length
                                ? k
                                  ? (0, a.jsx)(a.Fragment, {
                                      children: (0, a.jsx)("tr", {
                                        className: "bg-(--bg-grid)]",
                                        children: (0, a.jsx)("td", {
                                          colSpan: l,
                                          style: {
                                            height: "".concat(40 * ev, "px"),
                                          },
                                          children: (0, a.jsx)("div", {
                                            className: "flex h-[40px]",
                                            children: (0, a.jsx)(w.default, {
                                              icon: "loading",
                                              content:
                                                "H\xe4mtar inneh\xe5ll...",
                                              sideMessage:
                                                (null != ej ? ej : 0) <= 2,
                                            }),
                                          }),
                                        }),
                                      }),
                                    })
                                  : (0, a.jsx)(a.Fragment, {
                                      children: U.map((e, l) => {
                                        let s = F.includes(e.id),
                                          n = ""
                                            .concat(
                                              l % 2 == 0
                                                ? "bg-(--bg-grid)]"
                                                : "bg-(--bg-grid-zebra)]",
                                              " ",
                                            )
                                            .concat(
                                              s
                                                ? "bg-[var--bg-grid-header-hover)]"
                                                : "",
                                              " ",
                                            )
                                            .concat(
                                              e.roles.includes("Master")
                                                ? "pointer-events-none"
                                                : "",
                                              " hover:bg-(--bg-grid-header-hover)] cursor-pointer transition-[background] duration-(--fast)]",
                                            );
                                        return (0, a.jsxs)(
                                          "tr",
                                          {
                                            className: n,
                                            onClick: () => eR(e.id),
                                            onKeyDown: (l) => {
                                              ("Enter" === l.key ||
                                                " " === l.key) &&
                                                (l.preventDefault(), eR(e.id));
                                            },
                                            children: [
                                              (0, a.jsx)("td", {
                                                className: "".concat(
                                                  I,
                                                  " !w-[40px] !min-w-[40px] cursor-pointer !border-l-0",
                                                ),
                                                children: (0, a.jsx)("div", {
                                                  className:
                                                    "flex items-center justify-center",
                                                  children: (0, a.jsx)("div", {
                                                    className:
                                                      "flex items-center justify-center",
                                                    children: (0, a.jsx)(t.A, {
                                                      type: "checkbox",
                                                      checked: F.includes(e.id),
                                                      id: e.roles.includes(
                                                        "Master",
                                                      )
                                                        ? "disabled"
                                                        : "",
                                                      readOnly: !0,
                                                    }),
                                                  }),
                                                }),
                                              }),
                                              (0, a.jsx)(ez, {
                                                children: e.username,
                                              }),
                                              (0, a.jsx)(ez, {
                                                classNameAddition:
                                                  "hidden xs:table-cell",
                                                children: e.firstName,
                                              }),
                                              (0, a.jsx)(ez, {
                                                classNameAddition:
                                                  "hidden sm:table-cell",
                                                children: e.lastName,
                                              }),
                                              (0, a.jsx)(ez, {
                                                classNameAddition:
                                                  "hidden lg:table-cell",
                                                children: e.email,
                                              }),
                                              (0, a.jsx)(ez, {
                                                classNameAddition:
                                                  "hidden xl:table-cell",
                                                children: (Array.isArray(
                                                  e.roles,
                                                )
                                                  ? e.roles
                                                  : [e.roles || ""]
                                                ).join(", "),
                                              }),
                                              (0, a.jsx)(ez, {
                                                classNameAddition:
                                                  " w-28 min-w-28 border-r-0 2xs:table-cell hidden",
                                                children: (0, a.jsx)("div", {
                                                  className:
                                                    "flex items-center justify-center",
                                                  children: (0, a.jsx)("span", {
                                                    className: "".concat(
                                                      e.isLocked
                                                        ? "bg-(--locked)]"
                                                        : "bg-(--unlocked)]",
                                                      " flex h-6 w-64 items-center justify-center rounded-xl text-sm font-semibold text-(--text-main-reverse)]",
                                                    ),
                                                    children: e.isLocked
                                                      ? "L\xe5st"
                                                      : "Uppl\xe5st",
                                                  }),
                                                }),
                                              }),
                                            ],
                                          },
                                          e.id,
                                        );
                                      }),
                                    })
                                : (0, a.jsx)("tr", {
                                    children: (0, a.jsx)("td", {
                                      colSpan: l,
                                      className: "h-57",
                                      children: e.isConnected
                                        ? (0, a.jsx)(w.default, {
                                            icon: "search",
                                            content:
                                              ea || et || ei || eo || ex
                                                ? "Inga anv\xe4ndare kunde hittas med det s\xf6kkriteriet."
                                                : "Det finns inga anv\xe4ndare.",
                                          })
                                        : (0, a.jsx)(w.default, {
                                            icon: "server",
                                            content: "server",
                                          }),
                                    }),
                                  }),
                          }),
                        ],
                      }),
                    }),
                  }),
                  (0, a.jsxs)("div", {
                    className:
                      "flex w-full flex-wrap justify-between gap-x-12 gap-y-4",
                    children: [
                      (0, a.jsxs)("span", {
                        className: "flex w-[175.23px] text-(--text-secondary)",
                        children: [
                          "Visar ",
                          ($ - 1) * J + 1,
                          "-",
                          Math.min($ * J, null != Q ? Q : 0),
                          " av",
                          " ",
                          null != Q ? Q : 0,
                        ],
                      }),
                      (0, a.jsxs)("div", {
                        className: "xs:w-auto flex w-full items-center",
                        children: [
                          (0, a.jsx)("button", {
                            type: "button",
                            onClick: () => {
                              z([]), G((e) => Math.max(e - 1, 1));
                            },
                            disabled: 1 === $,
                            className: "".concat(b.U0),
                            children: (0, a.jsx)(f.A, {
                              className: "min-h-full min-w-full",
                            }),
                          }),
                          (0, a.jsx)("div", {
                            className:
                              "flex flex-wrap items-center justify-center",
                            children: (() => {
                              let e = [];
                              if (eg <= 7) {
                                for (let l = 1; l <= eg; l++) e.push(l);
                                return e;
                              }
                              if ($ <= 3) {
                                for (let l = 1; l <= 4; l++) e.push(l);
                                e.push("..."), e.push(eg);
                              } else if ($ >= eg - 2) {
                                e.push(1), e.push("...");
                                for (let l = eg - 3; l <= eg; l++) e.push(l);
                              } else {
                                e.push(1), e.push("...");
                                for (let l = $ - 1; l <= $ + 1; l++) e.push(l);
                                e.push("..."), e.push(eg);
                              }
                              return e;
                            })().map((e, l) =>
                              "..." === e
                                ? (0, a.jsx)(
                                    "span",
                                    { className: "flex px-2", children: "..." },
                                    l,
                                  )
                                : (0, a.jsx)(
                                    "button",
                                    {
                                      onClick: () => {
                                        z([]), G(Number(e));
                                      },
                                      className: ""
                                        .concat(
                                          $ === e
                                            ? "bg-(--accent-color)] text-(--text-main-reverse)]"
                                            : "hover:text-(--accent-color)]",
                                          " ",
                                        )
                                        .concat(
                                          $ === e && e >= 100 ? "px-5" : "",
                                          " flex max-w-7 min-w-7 cursor-pointer justify-center rounded-full px-1 text-lg transition-colors duration-(--fast)]",
                                        ),
                                      children: e,
                                    },
                                    l,
                                  ),
                            ),
                          }),
                          (0, a.jsx)("button", {
                            type: "button",
                            onClick: () => {
                              z([]),
                                G((e) =>
                                  e <
                                  Math.max(
                                    1,
                                    Math.ceil((null != Q ? Q : 0) / J),
                                  )
                                    ? e + 1
                                    : e,
                                );
                            },
                            disabled: $ >= Math.ceil((null != Q ? Q : 0) / J),
                            className: "".concat(b.U0),
                            children: (0, a.jsx)(p.A, {
                              className: "min-h-full min-w-full",
                            }),
                          }),
                        ],
                      }),
                      (0, a.jsxs)("div", {
                        className: "flex items-center gap-4",
                        children: [
                          (0, a.jsx)("span", {
                            className: "",
                            children: "Antal per sida:",
                          }),
                          (0, a.jsxs)("div", {
                            className: "3xs:min-w-20",
                            children: [
                              (0, a.jsx)("div", { id: "portal-root" }),
                              (0, a.jsx)(N.A, {
                                options: [
                                  { label: "5", value: "5" },
                                  { label: "15", value: "15" },
                                  { label: "25", value: "25" },
                                ],
                                value: String(J),
                                onChange: (e) => {
                                  let l = Number(e),
                                    s = Math.ceil((null != Q ? Q : 0) / l);
                                  W(l), $ > s && G(s);
                                },
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                  (0, a.jsxs)("div", {
                    className: "flex w-full flex-col",
                    children: [
                      (0, a.jsx)("div", {
                        className:
                          "flex items-center rounded-t border border-(--border-main)] bg-(--bg-grid-header)] px-3 py-2",
                        children: (0, a.jsx)("span", {
                          className: "truncate font-semibold",
                          children: "Anv\xe4ndarinformation",
                        }),
                      }),
                      (0, a.jsx)("div", {
                        className: "".concat(
                          0 === F.length || F.length > 1 ? "items-center" : "",
                          " flex max-h-96 min-h-80 overflow-x-auto rounded-b border border-t-0 border-(--border-main)] p-4",
                        ),
                        children:
                          0 === F.length
                            ? (0, a.jsx)(w.default, {
                                icon: "user",
                                content:
                                  "H\xe4r kan du se information om vald anv\xe4ndare. V\xe4lj en i tabellen ovan!",
                              })
                            : F.length > 1
                              ? (0, a.jsx)(w.default, {
                                  icon: "beware",
                                  content:
                                    "Kan inte visa information om flera anv\xe4ndare samtidigt.",
                                })
                              : (0, a.jsx)("div", {
                                  className: "flex",
                                  children: U.filter((e) => e.id === F[0]).map(
                                    (e) =>
                                      (0, a.jsxs)(
                                        "div",
                                        {
                                          className: "flex flex-col gap-8",
                                          children: [
                                            (0, a.jsxs)("div", {
                                              children: [
                                                e.isOnline
                                                  ? (0, a.jsx)("span", {
                                                      className:
                                                        "font-semibold text-(--unlocked)]",
                                                      children: "Online",
                                                    })
                                                  : (0, a.jsx)("span", {
                                                      className:
                                                        "font-semibold text-(--locked)]",
                                                      children: "Offline",
                                                    }),
                                                (0, a.jsxs)("p", {
                                                  children: [
                                                    (0, a.jsx)("strong", {
                                                      children:
                                                        "Anv\xe4ndarnamn: ",
                                                    }),
                                                    e.username,
                                                  ],
                                                }),
                                                (0, a.jsxs)("p", {
                                                  children: [
                                                    (0, a.jsx)("strong", {
                                                      children: "F\xf6rnamn: ",
                                                    }),
                                                    e.firstName,
                                                  ],
                                                }),
                                                (0, a.jsxs)("p", {
                                                  children: [
                                                    (0, a.jsx)("strong", {
                                                      children: "Efternamn: ",
                                                    }),
                                                    e.lastName,
                                                  ],
                                                }),
                                                (0, a.jsxs)("p", {
                                                  children: [
                                                    (0, a.jsx)("strong", {
                                                      children: "Mejladress: ",
                                                    }),
                                                    e.email,
                                                  ],
                                                }),
                                                (0, a.jsxs)("p", {
                                                  className: "flex",
                                                  children: [
                                                    (0, a.jsx)("strong", {
                                                      children:
                                                        "Beh\xf6righeter:\xa0",
                                                    }),
                                                    e.roles.map((l, s) =>
                                                      (0, a.jsxs)(
                                                        "span",
                                                        {
                                                          children: [
                                                            l,
                                                            s <
                                                            e.roles.length - 1
                                                              ? ",\xa0"
                                                              : "",
                                                          ],
                                                        },
                                                        s,
                                                      ),
                                                    ),
                                                  ],
                                                }),
                                                (0, a.jsx)("div", {
                                                  className: "mt-2",
                                                  children: (0, a.jsx)("span", {
                                                    className: "".concat(
                                                      e.isLocked
                                                        ? "bg-(--locked)]"
                                                        : "bg-(--unlocked)]",
                                                      " flex h-6 w-28 items-center justify-center rounded-xl text-sm font-semibold text-(--text-main-reverse)]",
                                                    ),
                                                    children: e.isLocked
                                                      ? "L\xe5st"
                                                      : "Uppl\xe5st",
                                                  }),
                                                }),
                                              ],
                                            }),
                                            (0, a.jsxs)("div", {
                                              children: [
                                                (0, a.jsxs)("p", {
                                                  children: [
                                                    (0, a.jsx)("strong", {
                                                      children:
                                                        "Senast inloggad: ",
                                                    }),
                                                    e.lastLogin
                                                      ? new Date(
                                                          e.lastLogin,
                                                        ).toLocaleString()
                                                      : "Aldrig",
                                                  ],
                                                }),
                                                (0, a.jsxs)("p", {
                                                  children: [
                                                    (0, a.jsx)("strong", {
                                                      children:
                                                        "Konto skapat: ",
                                                    }),
                                                    new Date(
                                                      e.creationDate,
                                                    ).toLocaleString(),
                                                  ],
                                                }),
                                              ],
                                            }),
                                          ],
                                        },
                                        e.id,
                                      ),
                                  ),
                                }),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          });
        };
    },
  },
]);
