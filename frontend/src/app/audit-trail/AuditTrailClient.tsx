"use client";

import { use, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import useTheme from "@/app/hooks/useTheme";
import Input from "@/app/components/common/Input";
import MultiDropdown from "@/app/components/common/MultiDropdown";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
  iconButtonPrimaryClass,
  switchClass,
  switchKnobClass,
} from "@/app/styles/buttonClasses";
import CustomTooltip from "@/app/components/common/CustomTooltip";
import * as Outline from "@heroicons/react/24/outline";
import * as SmallerSolid from "@heroicons/react/20/solid";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";
import { TdCell, ThCell } from "../components/manage/ManageComponents";
import Message from "../components/common/Message";
import SingleDropdown from "../components/common/SingleDropdown";

type Props = {
  isAuthReady: boolean | null;
  isLoggedIn: boolean | null;
  isConnected: boolean | null;
  isReporter: boolean | null;
  isAdmin: boolean | null;
  isDev: boolean | null;
};

const AuditTrailClient = (props: Props) => {
  const t = useTranslations();

  // --- VARIABLES ---
  // --- States ---
  const [isLoading, setIsLoading] = useState(false);
  const [entityOptions, setEntityOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [actionOptions, setActionOptions] = useState<
    { label: string; value: string }[]
  >([]);

  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [showAllDates, setShowAllDates] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const [auditResults, setAuditResults] = useState<any[]>([]);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>("timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [hasSearched, setHasSearched] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(16);
  const [lastFilters, setLastFilters] = useState({
    entities: [] as string[],
    actions: [] as string[],
    users: [] as string[],
    from: "",
    to: "",
    showAllDates: true,
  });

  // --- States: Filters ---
  const [userOptions, setUserOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // --- OTHER ---
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  // --- FUNCTIONS ---
  // --- Initialization ---
  useEffect(() => {
    const fetchRules = async () => {
      try {
        const response = await fetch(`${apiUrl}/audit-trail/rules`, {
          headers: {
            "Content-Type": "application/json",
            "X-User-Language": localStorage.getItem("language") || "sv",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        setEntityOptions(data.Entities ?? data.entities ?? []);
        setActionOptions(data.Actions ?? data.actions ?? []);

        setSelectedEntities(
          data.Entities.length > 0 ? [data.Entities[0].value] : [],
        );
        setSelectedActions(
          data.Actions.length > 0 ? [data.Actions[0].value] : [],
        );
      } catch {}
    };

    fetchRules();
  }, [t]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${apiUrl}/user-management/list`, {
          headers: {
            "Content-Type": "application/json",
            "X-User-Language": localStorage.getItem("language") || "sv",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        setUserOptions([
          { label: t("Common/All"), value: "All" },
          ...data.map((u: any) => ({
            label: u.label,
            value: u.value,
          })),
        ]);
      } catch {}
    };

    fetchUsers();
  }, [t]);

  // --- Handle search ---
  const handleSearch = async (override?: {
    key?: string;
    order?: "asc" | "desc";
    entities?: string[];
    actions?: string[];
    users?: string[];
    from?: string;
    to?: string;
    showAllDates?: boolean;
    page?: number;
    pageSize?: number;
  }) => {
    const sortKey = override?.key ?? sortBy;
    const sortDir = override?.order ?? sortOrder;
    const page = override?.page ?? currentPage;
    const pageSize = override?.pageSize ?? itemsPerPage;

    const entitiesToSend =
      override?.entities ??
      (entityOptions.find((o) => o.value === "All") &&
      selectedEntities.includes("All")
        ? []
        : selectedEntities.filter(Boolean));

    const actionsToSend =
      override?.actions ??
      (actionOptions.find((o) => o.value === "All") &&
      selectedActions.includes("All")
        ? []
        : selectedActions.filter(Boolean));

    const usersToSend =
      override?.users ??
      (userOptions.find((o) => o.value === "All") &&
      selectedUsers.includes("All")
        ? []
        : selectedUsers.filter(Boolean));

    const params = new URLSearchParams();
    if (entitiesToSend.length > 0)
      entitiesToSend.forEach((e) => params.append("entity", e));
    if (actionsToSend.length > 0)
      actionsToSend.forEach((a) => params.append("action", a));
    if (usersToSend.length > 0)
      usersToSend.forEach((u) => params.append("user", u));

    const fromDate = override?.from ?? dateFrom;
    const toDate = override?.to ?? dateTo;
    const useAllDates = override?.showAllDates ?? showAllDates;
    if (!useAllDates) {
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
    }

    params.set("sortBy", sortKey);
    params.set("sortOrder", sortDir);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    const url = `${apiUrl}/audit-trail/fetch?${params.toString()}`;
    try {
      setIsLoading(true);
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          "X-User-Language": localStorage.getItem("language") || "sv",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setAuditResults(data.items ?? data);
      setTotalItems(data.totalItems ?? data.length ?? 0);
      setHasSearched(true);
      setLastFilters({
        entities: entitiesToSend,
        actions: actionsToSend,
        users: usersToSend,
        from: fromDate,
        to: toDate,
        showAllDates: useAllDates,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  useEffect(() => {
    if (hasSearched) {
      handleSearch({
        key: sortBy,
        order: sortOrder,
        entities: lastFilters.entities,
        actions: lastFilters.actions,
        from: lastFilters.from,
        to: lastFilters.to,
        showAllDates: lastFilters.showAllDates,
      } as any);
    }
  }, [t]);

  const checkIfHtml = (value: unknown): boolean => {
    if (typeof value !== "string") {
      return false;
    }

    return /<\/?[a-z][\s\S]*>/i.test(value.trim());
  };

  const checkIfCreated = (action: string) => {
    if (action === "Created" || action === "Skapad") {
      return true;
    }

    return false;
  };

  // --- Handle sort ---
  const handleSort = (key: string) => {
    let newOrder: "asc" | "desc" = "asc";
    if (sortBy === key) {
      newOrder = sortOrder === "asc" ? "desc" : "asc";
    }

    setSortBy(key);
    setSortOrder(newOrder);

    if (hasSearched) {
      const prevEntities = lastFilters.entities;
      const prevActions = lastFilters.actions;
      const prevFrom = lastFilters.from;
      const prevTo = lastFilters.to;
      const prevShowAllDates = lastFilters.showAllDates;

      handleSearch({
        key,
        order: newOrder,
        entities: prevEntities,
        actions: prevActions,
        from: prevFrom,
        to: prevTo,
        showAllDates: prevShowAllDates,
      } as any);
    }
  };

  // --- HELPERS ---
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResults = auditResults.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const isHexColor = (val: any) => {
    return (
      typeof val === "string" && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(val)
    );
  };

  return (
    <div className="grid gap-4">
      <div className="grid w-full rounded-2xl bg-[var(--bg-modal)]">
        {/* --- HEADER --- */}
        <div className="flex items-center justify-between gap-4 px-6 pt-6">
          <h2 className="text-lg font-semibold whitespace-nowrap">
            {t("AuditTrail/Search in audit trail")}
          </h2>

          <button onClick={() => setIsExpanded((prev) => !prev)}>
            <motion.div
              animate={{ rotate: isExpanded ? 0 : 180 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className={iconButtonPrimaryClass}
            >
              <Outline.ChevronUpIcon />
            </motion.div>
          </button>
        </div>

        <div className="overflow-hidden px-6 pb-6">
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                key="filter-section"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                {/* --- FILTER SECTION --- */}
                <div className="grid gap-6">
                  <hr className="-mx-6 mt-6 text-[var(--border-tertiary)]" />

                  <div className="flex items-center gap-2">
                    <hr className="w-12 text-[var(--border-tertiary)]" />
                    <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                      {t("AuditTrail/Filters")}
                    </h3>
                    <hr className="w-full text-[var(--border-tertiary)]" />
                  </div>

                  <div className="mb-8 grid gap-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      {/* --- Action --- */}
                      <MultiDropdown
                        label={t("AuditTrail/Action")}
                        options={actionOptions}
                        value={selectedActions}
                        onChange={setSelectedActions}
                        required
                        showMore
                        onModal
                      />

                      {/* --- Entity --- */}
                      <MultiDropdown
                        label={t("AuditTrail/Entity")}
                        options={entityOptions}
                        value={selectedEntities}
                        onChange={setSelectedEntities}
                        required
                        showMore
                        onModal
                      />
                    </div>

                    {/* --- User --- */}
                    <MultiDropdown
                      label={t("Common/User")}
                      options={userOptions}
                      value={selectedUsers}
                      onChange={setSelectedUsers}
                      showMore
                      onModal
                    />
                  </div>

                  {/* --- DATE SECTION --- */}
                  <div className="grid gap-6">
                    <div className="flex items-center gap-2">
                      <hr className="w-12 text-[var(--border-tertiary)]" />
                      <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                        {t("Common/Date range")}
                      </h3>
                      <hr className="w-full text-[var(--border-tertiary)]" />
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <div
                        className={`${showAllDates ? "cursor-not-allowed opacity-25" : ""} grid grid-cols-1 gap-6 sm:grid-cols-2`}
                      >
                        <Input
                          label={t("Common/Start date")}
                          type="date"
                          value={dateFrom}
                          onChange={(v) => setDateFrom(v as string)}
                          readOnly={showAllDates}
                          tabIndex={showAllDates ? -1 : 0}
                          required={!showAllDates}
                          onModal
                        />

                        <Input
                          label={t("Common/End date")}
                          type="date"
                          value={dateTo}
                          onChange={(v) => setDateTo(v as string)}
                          readOnly={showAllDates}
                          tabIndex={showAllDates ? -1 : 0}
                          required={!showAllDates}
                          onModal
                        />
                      </div>

                      <div className="mb-8">
                        <div className="flex items-center gap-2 truncate">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={showAllDates}
                            className={switchClass(showAllDates)}
                            onClick={() => setShowAllDates((prev) => !prev)}
                          >
                            <div className={switchKnobClass(showAllDates)} />
                          </button>
                          <span className="mb-0.5">
                            {t("AuditTrail/Show all")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* --- SEARCH & RESET --- */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                    <button
                      className={`${buttonPrimaryClass} md:col-span-2 lg:col-span-3 xl:col-span-4 2xl:col-span-5`}
                      onClick={() => {
                        setIsLoading(true);
                        handleSearch();
                      }}
                      disabled={
                        selectedActions.length === 0 ||
                        selectedEntities.length === 0 ||
                        (!dateFrom && !showAllDates) ||
                        (!dateTo && !showAllDates)
                      }
                    >
                      {t("Common/Search")}
                    </button>

                    <button
                      className={`${buttonSecondaryClass} col-span-1`}
                      onClick={() => {
                        setSelectedEntities([]);
                        setSelectedActions([]);
                        setSelectedUsers([]);
                        setAuditResults([]);
                        setDateFrom("");
                        setDateTo("");
                        setShowAllDates(true);
                        setTotalItems(0);
                        setCurrentPage(1);
                        setHasSearched(false);
                      }}
                    >
                      {t("Common/Reset")}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* --- RESULT LIST --- */}
      <div className="relative w-full overflow-x-auto rounded border-1 border-[var(--border-main)]">
        <table className="w-full min-w-6xl table-fixed border-collapse">
          <thead className="bg-[var(--bg-grid-header)]">
            <tr>
              <ThCell
                sortingItem="timestamp"
                label={t("AuditTrail/Timestamp")}
                labelAsc={`${t("AuditTrail/timestamp")} ${t("AuditTrail/newest first")}`}
                labelDesc={`${t("AuditTrail/timestamp")} ${t("AuditTrail/oldest first")}`}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                classNameAddition="sticky left-0 bg-[var(--bg-grid-header)] z-[calc(var(--z-base)+1)]"
              />
              <ThCell
                sortingItem="action"
                label={t("AuditTrail/Action")}
                labelAsc={`${t("AuditTrail/action")} Ö-A`}
                labelDesc={`${t("AuditTrail/action")} A-Ö`}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <ThCell
                sortingItem="entityName"
                label={t("AuditTrail/Entity")}
                labelAsc={`${t("AuditTrail/entity")} Ö-A`}
                labelDesc={`${t("AuditTrail/entity")} A-Ö`}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <ThCell
                sortingItem="entityId"
                label={t("AuditTrail/Entity ID")}
                labelAsc={`${t("AuditTrail/entity ID")} ${t("Manage/descending")}`}
                labelDesc={`${t("AuditTrail/entity ID")} ${t("Manage/ascending")}`}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                classNameAddition="w-40"
              />
              <ThCell
                sortingItem="user"
                label={t("Common/User")}
                labelAsc={`${t("Common/user")} Ö-A`}
                labelDesc={`${t("Common/user")} A-Ö`}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <ThCell
                sortingItem="userId"
                label={t("Common/User ID")}
                labelAsc={`${t("Common/user ID")} ${t("Manage/descending")}`}
                labelDesc={`${t("Common/user ID")} ${t("Manage/ascending")}`}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                classNameAddition="w-44"
              />
            </tr>
          </thead>

          <tbody>
            {auditResults.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="h-57 text-center text-[var(--text-secondary)]"
                >
                  {isLoading ? (
                    <Message icon="loading" content={t("Message/Content")} />
                  ) : (
                    <Message icon="search" content={t("Manage/No content")} />
                  )}
                </td>
              </tr>
            ) : (
              paginatedResults.map((a, index) => {
                const isEven = index % 2 === 0;
                const isExpanded = expandedRow === a.id;

                return (
                  <React.Fragment key={a.id}>
                    <tr
                      className={`${isEven ? "bg-[var(--bg-grid)]" : "bg-[var(--bg-grid-zebra)]"} cursor-pointer transition-[background] duration-[var(--fast)] hover:bg-[var(--bg-grid-header-hover)]`}
                      onClick={() => setExpandedRow(isExpanded ? null : a.id)}
                    >
                      <TdCell classNameAddition="sticky left-0 [background:inherit] z-[calc(var(--z-base)+1)]">
                        {new Date(a.timestamp + "Z").toLocaleString()}
                      </TdCell>
                      <TdCell>{a.action}</TdCell>
                      <TdCell>{a.entityName}</TdCell>
                      <TdCell>{a.entityId}</TdCell>
                      <TdCell childClassNameAddition="whitespace-normal flex-wrap">
                        {a.user}
                        {a.username && a.username !== a.user && (
                          <span className="">&nbsp;({a.username})</span>
                        )}
                      </TdCell>
                      <TdCell>{a.userId}</TdCell>
                    </tr>

                    {/* --- EXPANDED DETAILS --- */}
                    {isExpanded && a.details && (
                      <tr
                        className={`${isEven ? "bg-[var(--bg-grid)]" : "bg-[var(--bg-grid-zebra)]"} border-t-1 border-[var(--border-secondary)]`}
                      >
                        <td
                          colSpan={6}
                          className="px-4 py-4 text-sm text-[var(--text-secondary)]"
                        >
                          {(() => {
                            try {
                              const details = JSON.parse(a.details);

                              // --- UPDATE ---
                              if (details.OldValues && details.NewValues) {
                                return (
                                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                    {/* --- Old values --- */}
                                    <div className="rounded bg-[var(--bg-modal)] p-4">
                                      <h4 className="mb-2 font-semibold text-[var(--note-error)] uppercase">
                                        {t("AuditTrail/Before change")}
                                      </h4>
                                      <div className="-mx-4">
                                        <table className="w-full text-sm">
                                          <tbody>
                                            {Object.entries(
                                              details.OldValues,
                                            ).map(
                                              ([key, value], index, arr) => {
                                                const total = arr.length;
                                                const startWithZebra =
                                                  total % 2 === 0;
                                                const useZebra = startWithZebra
                                                  ? index % 2 === 0
                                                  : index % 2 !== 0;

                                                const rowClass = useZebra
                                                  ? "bg-[var(--bg-modal-zebra)] text-[var(--text-main)]"
                                                  : "bg-[var(--bg-modal)] text-[var(--text-secondary)]";

                                                return (
                                                  <tr
                                                    key={key}
                                                    className={rowClass}
                                                  >
                                                    <td className="px-4 pr-2 align-top font-medium whitespace-nowrap">
                                                      {key}
                                                    </td>
                                                    <td className="px-4 break-words">
                                                      {checkIfHtml(value) ? (
                                                        <div
                                                          className="prose prose-sm max-w-none"
                                                          dangerouslySetInnerHTML={{
                                                            __html:
                                                              value as string,
                                                          }}
                                                        />
                                                      ) : typeof value ===
                                                        "object" ? (
                                                        <pre className="font-[Karla] whitespace-pre-wrap">
                                                          {Array.isArray(value)
                                                            ? value
                                                                .map((v) =>
                                                                  typeof v ===
                                                                  "object"
                                                                    ? Object.entries(
                                                                        v,
                                                                      )
                                                                        .map(
                                                                          ([
                                                                            k,
                                                                            val,
                                                                          ]) =>
                                                                            `${k}: ${val}`,
                                                                        )
                                                                        .join(
                                                                          "\n",
                                                                        )
                                                                    : `${v}`,
                                                                )
                                                                .join(
                                                                  typeof value[0] ===
                                                                    "object"
                                                                    ? "\n\n"
                                                                    : "\n",
                                                                )
                                                            : Object.entries(
                                                                value as Record<
                                                                  string,
                                                                  any
                                                                >,
                                                              )
                                                                .map(
                                                                  ([k, val]) =>
                                                                    `${k}: ${val}`,
                                                                )
                                                                .join("\n")}
                                                        </pre>
                                                      ) : isHexColor(value) ? (
                                                        <span
                                                          className="flex items-center gap-2"
                                                          style={{
                                                            color:
                                                              String(value),
                                                          }}
                                                        >
                                                          {String(value)}
                                                        </span>
                                                      ) : (
                                                        String(value ?? "—")
                                                      )}
                                                    </td>
                                                  </tr>
                                                );
                                              },
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>

                                    {/* --- New values --- */}
                                    <div className="rounded bg-[var(--bg-modal)] p-4">
                                      <h4 className="mb-2 font-semibold text-[var(--note-success)] uppercase">
                                        {t("AuditTrail/After change")}
                                      </h4>
                                      <div className="-mx-4">
                                        <table className="w-full text-sm">
                                          <tbody>
                                            {Object.entries(
                                              details.NewValues,
                                            ).map(
                                              ([key, value], index, arr) => {
                                                const total = arr.length;
                                                const startWithZebra =
                                                  total % 2 === 0;
                                                const useZebra = startWithZebra
                                                  ? index % 2 === 0
                                                  : index % 2 !== 0;

                                                const rowClass = useZebra
                                                  ? "bg-[var(--bg-modal-zebra)] text-[var(--text-main)]"
                                                  : "bg-[var(--bg-modal)] text-[var(--text-secondary)]";

                                                return (
                                                  <tr
                                                    key={key}
                                                    className={rowClass}
                                                  >
                                                    <td className="px-4 pr-2 align-top font-medium whitespace-nowrap">
                                                      {key}
                                                    </td>
                                                    <td className="px-4 break-words">
                                                      {checkIfHtml(value) ? (
                                                        <div
                                                          className="prose prose-sm max-w-none"
                                                          dangerouslySetInnerHTML={{
                                                            __html:
                                                              value as string,
                                                          }}
                                                        />
                                                      ) : typeof value ===
                                                        "object" ? (
                                                        <pre className="font-[Karla] whitespace-pre-wrap">
                                                          {Array.isArray(value)
                                                            ? value
                                                                .map((v) =>
                                                                  typeof v ===
                                                                  "object"
                                                                    ? Object.entries(
                                                                        v,
                                                                      )
                                                                        .map(
                                                                          ([
                                                                            k,
                                                                            val,
                                                                          ]) =>
                                                                            `${k}: ${val}`,
                                                                        )
                                                                        .join(
                                                                          "\n",
                                                                        )
                                                                    : `${v}`,
                                                                )
                                                                .join(
                                                                  typeof value[0] ===
                                                                    "object"
                                                                    ? "\n\n"
                                                                    : "\n",
                                                                )
                                                            : Object.entries(
                                                                value as Record<
                                                                  string,
                                                                  any
                                                                >,
                                                              )
                                                                .map(
                                                                  ([k, val]) =>
                                                                    `${k}: ${val}`,
                                                                )
                                                                .join("\n")}
                                                        </pre>
                                                      ) : isHexColor(value) ? (
                                                        <span
                                                          className="flex items-center gap-2"
                                                          style={{
                                                            color:
                                                              String(value),
                                                          }}
                                                        >
                                                          {String(value)}
                                                        </span>
                                                      ) : (
                                                        String(value ?? "—")
                                                      )}
                                                    </td>
                                                  </tr>
                                                );
                                              },
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }

                              // --- CREATE or DELETE ---
                              return (
                                <div className="rounded bg-[var(--bg-modal)] p-4">
                                  <h4
                                    className={`${checkIfCreated(a.action) ? "text-[var(--note-success)]" : "text-[var(--note-error)]"} mb-2 font-semibold uppercase`}
                                  >
                                    {t("AuditTrail/Details")}
                                  </h4>
                                  <div className="-mx-4">
                                    <table className="w-full text-sm">
                                      <tbody>
                                        {Object.entries(details).map(
                                          ([key, value], index, arr) => {
                                            const total = arr.length;
                                            const startWithZebra =
                                              total % 2 === 0;
                                            const useZebra = startWithZebra
                                              ? index % 2 === 0
                                              : index % 2 !== 0;

                                            const rowClass = useZebra
                                              ? "bg-[var(--bg-modal-zebra)] text-[var(--text-main)]"
                                              : "bg-[var(--bg-modal)] text-[var(--text-secondary)]";

                                            return (
                                              <tr
                                                key={key}
                                                className={rowClass}
                                              >
                                                <td className="px-4 pr-2 align-top font-medium whitespace-nowrap">
                                                  {key}
                                                </td>
                                                <td className="px-4 break-words">
                                                  {checkIfHtml(value) ? (
                                                    <div
                                                      className="prose prose-sm max-w-none"
                                                      dangerouslySetInnerHTML={{
                                                        __html: value as string,
                                                      }}
                                                    />
                                                  ) : typeof value ===
                                                    "object" ? (
                                                    <pre className="font-[Karla] whitespace-pre-wrap">
                                                      {Array.isArray(value)
                                                        ? value
                                                            .map((v) =>
                                                              typeof v ===
                                                              "object"
                                                                ? Object.entries(
                                                                    v,
                                                                  )
                                                                    .map(
                                                                      ([
                                                                        k,
                                                                        val,
                                                                      ]) =>
                                                                        `${k}: ${val}`,
                                                                    )
                                                                    .join("\n")
                                                                : `${v}`,
                                                            )
                                                            .join(
                                                              typeof value[0] ===
                                                                "object"
                                                                ? "\n\n"
                                                                : "\n",
                                                            )
                                                        : Object.entries(
                                                            value as Record<
                                                              string,
                                                              any
                                                            >,
                                                          )
                                                            .map(
                                                              ([k, val]) =>
                                                                `${k}: ${val}`,
                                                            )
                                                            .join("\n")}
                                                    </pre>
                                                  ) : isHexColor(value) ? (
                                                    <span
                                                      className="flex items-center gap-2"
                                                      style={{
                                                        color: String(value),
                                                      }}
                                                    >
                                                      {String(value)}
                                                    </span>
                                                  ) : (
                                                    String(value ?? "—")
                                                  )}
                                                </td>
                                              </tr>
                                            );
                                          },
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              );
                            } catch {
                              return (
                                <span className="text-sm text-[var(--note-error)]">
                                  {t("AuditTrail/Invalid JSON")}
                                </span>
                              );
                            }
                          })()}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* --- PAGINATION --- */}
      <div className="flex w-full flex-wrap justify-between gap-x-12 gap-y-4">
        {/* --- Showing info --- */}
        <span className="flex w-[175.23px] text-[var(--text-secondary)]">
          {t("Manage/Viewing")}{" "}
          {totalItems === 0
            ? "0-0"
            : `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(
                currentPage * itemsPerPage,
                totalItems,
              )}`}{" "}
          {t("Manage/out of")} {totalItems}
        </span>

        {/* --- Change pages --- */}
        <div className="xs:w-auto flex w-full items-center">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={iconButtonPrimaryClass}
          >
            <SmallerSolid.ChevronLeftIcon className="min-h-full min-w-full" />
          </button>

          <div className="flex flex-wrap items-center justify-center">
            {(() => {
              const totalPages = Math.max(
                1,
                Math.ceil(totalItems / itemsPerPage),
              );
              const pages: (number | string)[] = [];

              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
              } else if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, "...", totalPages);
              } else if (currentPage >= totalPages - 2) {
                pages.push(
                  1,
                  "...",
                  totalPages - 3,
                  totalPages - 2,
                  totalPages - 1,
                  totalPages,
                );
              } else {
                pages.push(
                  1,
                  "...",
                  currentPage - 1,
                  currentPage,
                  currentPage + 1,
                  "...",
                  totalPages,
                );
              }

              return pages.map((page, index) =>
                page === "..." ? (
                  <span key={index} className="flex px-2">
                    ...
                  </span>
                ) : (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(Number(page))}
                    className={`${
                      currentPage === page
                        ? "bg-[var(--accent-color)] text-[var(--text-main-reverse)]"
                        : "hover:text-[var(--accent-color)]"
                    } flex max-w-7 min-w-7 cursor-pointer justify-center rounded-full px-1 text-lg transition-colors duration-[var(--fast)]`}
                  >
                    {page}
                  </button>
                ),
              );
            })()}
          </div>

          <button
            type="button"
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(prev + 1, Math.ceil(totalItems / itemsPerPage)),
              )
            }
            disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
            className={iconButtonPrimaryClass}
          >
            <SmallerSolid.ChevronRightIcon className="min-h-full min-w-full" />
          </button>
        </div>

        {/* --- Amount per page --- */}
        <div className="flex items-center gap-4">
          <span>{t("Manage/Amount")}</span>
          <div className="3xs:min-w-20">
            <SingleDropdown
              options={[
                { label: "4", value: "4" },
                { label: "8", value: "8" },
                { label: "16", value: "16" },
                { label: "32", value: "32" },
              ]}
              value={String(itemsPerPage)}
              onChange={(val) => {
                const newPageSize = Number(val);
                setItemsPerPage(newPageSize);
                setCurrentPage(1);
              }}
              showAbove
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditTrailClient;
