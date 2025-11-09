"use client";

import { useTranslations } from "next-intl";
import useTheme from "@/app/hooks/useTheme";
import Input from "@/app/components/common/Input";
import MultiDropdown from "@/app/components/common/MultiDropdown";
import {
  buttonAddPrimaryClass,
  buttonDeletePrimaryClass,
  buttonPrimaryClass,
  buttonSecondaryClass,
  iconButtonPrimaryClass,
  switchClass,
  switchKnobClass,
} from "@/app/styles/buttonClasses";
import * as Outline from "@heroicons/react/24/outline";
import * as Solid from "@heroicons/react/24/solid";
import * as SmallerSolid from "@heroicons/react/20/solid";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";
import { TdCell, ThCell } from "../../components/manage/ManageComponents";
import Message from "../../components/common/Message";
import SingleDropdown from "../../components/common/SingleDropdown";
import CustomTooltip from "@/app/components/common/CustomTooltip";
import HoverIcon from "@/app/components/common/HoverIcon";
import { useParams } from "next/navigation";
import { useMasterPlan } from "@/app/hooks/useMasterPlan";

type Props = {
  isAuthReady: boolean | null;
  isLoggedIn: boolean | null;
  isConnected: boolean | null;
  isReporter: boolean | null;
};

const MasterPlanClient = (props: Props) => {
  const t = useTranslations();
  const { masterPlanId } = useParams();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const {
    isLoading,
    isManualRefresh,
    refetchData,
    masterPlans,
    fieldOptions,
    showHidden,
    sortBy,
    sortOrder,
    totalItems,
    currentPage,
    itemsPerPage,
    isEditing,
    isStrikeMode,
    handleSearch,
    handleReset,
    handleAddElement,
    handleCellChange,
    toggleStrikeThrough,
    handleSave,
    handleAbortChanges,
    handleCheck,
    setShowHidden,
    setIsEditing,
    setIsManualRefresh,
    setRefetchData,
    setIsStrikeMode,
    setCurrentPage,
    setItemsPerPage,
    visibleElements,
    checkedOutBy,
    checkedOutByMe,
  } = useMasterPlan(t, apiUrl, token, masterPlanId);

  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <>
      {isEditing && (
        <div className="fixed inset-0 z-[calc(var(--z-edit)-2)] border-6 border-[var(--note-error)] bg-[var(--bg-main)] opacity-90" />
      )}

      {isEditing && (
        <div className="fixed top-0 left-0 z-[calc(var(--z-edit)-1)] w-full bg-[var(--note-error)] py-2 text-center text-lg font-semibold tracking-wide text-[var(--text-main-reverse)]">
          {t("Common/Editing")} {t("Common/master plan")}
        </div>
      )}

      <div
        className={`grid gap-4 ${isEditing ? "relative z-[var(--z-edit)]" : ""}`}
      >
        {/* <div className="grid gap-4"> */}
        <div className="grid w-full rounded-2xl bg-[var(--bg-modal)]">
          {/* --- HEADER --- */}
          <div className="flex items-center justify-between gap-4 px-6 pt-6">
            <h2 className="text-lg font-semibold whitespace-nowrap">
              {t("Common/Settings")}
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
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2"></div>
                    </div>

                    {/* --- STATUS SECTION --- */}
                    <div className="grid gap-6">
                      <div className="flex items-center gap-2">
                        <hr className="w-12 text-[var(--border-tertiary)]" />
                        <h3 className="text-sm whitespace-nowrap text-[var(--text-secondary)]">
                          {t("Common/Status")}
                        </h3>
                        <hr className="w-full text-[var(--border-tertiary)]" />
                      </div>

                      <div className="mb-8">
                        <div className="flex items-center gap-2 truncate">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={showHidden}
                            className={switchClass(showHidden)}
                            onClick={() => setShowHidden((prev) => !prev)}
                          >
                            <div className={switchKnobClass(showHidden)} />
                          </button>
                          <span className="mb-0.5">PLACEHOLDER</span>
                        </div>
                      </div>
                    </div>

                    {/* --- SEARCH & RESET --- */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                      <button
                        className={`${buttonPrimaryClass} md:col-span-2 lg:col-span-3 xl:col-span-4 2xl:col-span-5`}
                        onClick={handleSearch}
                        disabled={isLoading}
                      >
                        {t("Common/Search")}
                      </button>

                      <button
                        className={`${buttonSecondaryClass} col-span-1`}
                        onClick={handleReset}
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

        {/* --- ACTION BAR --- */}
        <div className="flex flex-wrap gap-4">
          {!isEditing ? (
            <div className="flex w-full justify-between">
              <div>
                {isLoading ? (
                  <button
                    className={`${buttonPrimaryClass} group cursor-wait opacity-60 lg:w-max lg:px-4`}
                    disabled
                  >
                    <div className="flex items-center justify-center gap-2 truncate">
                      <Outline.ArrowPathIcon className="h-6 min-h-6 w-6 min-w-6 motion-safe:animate-[spin_1s_linear_infinite]" />
                      <span className="hidden lg:block">
                        {t("MasterPlan/Checking out")}
                      </span>
                    </div>
                  </button>
                ) : !checkedOutBy || checkedOutByMe ? (
                  <CustomTooltip
                    content={t("MasterPlan/Edit master plan")}
                    lgHidden
                    longDelay
                  >
                    <button
                      className={`${buttonPrimaryClass} group lg:w-max lg:px-4`}
                      onClick={() => handleCheck(false)}
                    >
                      <div className="flex items-center justify-center gap-2 truncate">
                        <HoverIcon
                          outline={Outline.PencilSquareIcon}
                          solid={Solid.PencilSquareIcon}
                          className="h-6 min-h-6 w-6 min-w-6"
                        />
                        <span className="hidden lg:block">
                          {t("MasterPlan/Edit master plan")}
                        </span>
                      </div>
                    </button>
                  </CustomTooltip>
                ) : (
                  <CustomTooltip
                    content={t("MasterPlan/Force checkout")}
                    lgHidden
                    longDelay
                  >
                    <button
                      className={`${buttonDeletePrimaryClass} group lg:w-max lg:px-4`}
                      onClick={() => handleCheck(true)}
                    >
                      <div className="flex items-center justify-center gap-2 truncate">
                        <HoverIcon
                          outline={Outline.ExclamationTriangleIcon}
                          solid={Solid.ExclamationTriangleIcon}
                          className="h-6 min-h-6 w-6 min-w-6 text-[var(--note-warning)]"
                        />
                        <span className="hidden lg:block">
                          {t("MasterPlan/Force checkout")}
                        </span>
                      </div>
                    </button>
                  </CustomTooltip>
                )}
              </div>

              <CustomTooltip
                content={`${refetchData && isManualRefresh ? t("Common/Updating") : t("Common/Update page")}`}
                veryLongDelay
                showOnTouch
              >
                <button
                  className={`${buttonSecondaryClass} group flex items-center justify-center`}
                  onClick={() => {
                    setIsManualRefresh(true);
                    setRefetchData(true);
                  }}
                  aria-label={t("Common/Update page")}
                  disabled={isManualRefresh && refetchData}
                >
                  <Outline.ArrowPathIcon
                    className={`${refetchData && isManualRefresh ? "motion-safe:animate-[spin_1s_linear_infinite]" : ""} min-h-full min-w-full`}
                  />
                </button>
              </CustomTooltip>
            </div>
          ) : (
            <>
              <CustomTooltip
                content={t("MasterPlan/Save and push")}
                lgHidden
                longDelay
              >
                <button
                  className={`${buttonAddPrimaryClass} group lg:w-max lg:px-4`}
                  onClick={handleSave}
                  disabled={isLoading}
                >
                  <div className="flex items-center justify-center gap-2 truncate">
                    <HoverIcon
                      outline={Outline.CheckIcon}
                      solid={Solid.CheckIcon}
                      className="h-6 min-h-6 w-6 min-w-6"
                    />
                    <span className="hidden lg:block">
                      {t("MasterPlan/Save and push")}
                    </span>
                  </div>
                </button>
              </CustomTooltip>

              <CustomTooltip
                content={t("MasterPlan/Abort changes")}
                lgHidden
                longDelay
              >
                <button
                  className={`${buttonSecondaryClass} group lg:w-max lg:px-4`}
                  onClick={handleAbortChanges}
                  disabled={isLoading}
                >
                  <div className="flex items-center justify-center gap-2 truncate">
                    <HoverIcon
                      outline={Outline.XMarkIcon}
                      solid={Solid.XMarkIcon}
                      className="h-6 min-h-6 w-6 min-w-6"
                    />
                    <span className="hidden lg:block">
                      {t("MasterPlan/Abort changes")}
                    </span>
                  </div>
                </button>
              </CustomTooltip>
            </>
          )}
        </div>

        {/* --- Checked out by text --- */}
        {checkedOutBy && !isEditing && !isLoading && (
          <p className="text-sm text-[var(--text-secondary)]">
            {t("MasterPlan/Checked out by")}:{" "}
            <span className="font-medium">{checkedOutBy}</span>
          </p>
        )}

        {isEditing && (
          <div className="flex justify-end gap-4">
            <CustomTooltip content={t("MasterPlan/Add element")} longDelay>
              <button
                className={`${buttonPrimaryClass} group flex items-center justify-center gap-2`}
                onClick={() =>
                  handleAddElement(masterPlans[0]?.id as number, null)
                }
              >
                <HoverIcon
                  outline={Outline.PlusIcon}
                  solid={Solid.PlusIcon}
                  className="h-6 w-6"
                />
                <span className="hidden lg:block">
                  {t("MasterPlan/Add element")}
                </span>
              </button>
            </CustomTooltip>

            {masterPlans[0]?.elements?.length > 0 && (
              <CustomTooltip
                content={t("MasterPlan/Add to same group")}
                longDelay
              >
                <button
                  className={`${buttonSecondaryClass} group flex items-center justify-center gap-2`}
                  onClick={() => {
                    const topGroup =
                      masterPlans[0]?.elements?.[0]?.groupId ?? null;
                    handleAddElement(masterPlans[0]?.id as number, topGroup);
                  }}
                >
                  <HoverIcon
                    outline={Outline.LinkIcon}
                    solid={Solid.LinkIcon}
                    className="h-6 w-6"
                  />
                  <span className="hidden lg:block">
                    {t("MasterPlan/Add to same group")}
                  </span>
                </button>
              </CustomTooltip>
            )}

            {/* <CustomTooltip content={t("MasterPlan/Strike element")} longDelay>
              <button
                className={`${isStrikeMode ? buttonPrimaryClass : buttonSecondaryClass} group flex items-center justify-center gap-2`}
                onClick={() => setIsStrikeMode((prev) => !prev)}
              >
                <HoverIcon
                  outline={Outline.NoSymbolIcon}
                  solid={Solid.NoSymbolIcon}
                  className="h-6 w-6"
                />
                <span className="hidden lg:block">
                  {t("MasterPlan/Strike element")}
                </span>
              </button>
            </CustomTooltip> */}
          </div>
        )}

        {/* --- RESULT LIST --- */}
        <div className="relative w-full overflow-x-auto rounded border-1 border-[var(--border-main)]">
          <table className="table w-full min-w-6xl table-auto border-collapse">
            <thead className="bg-[var(--bg-grid-header)]">
              <tr>
                {/* <ThCell
                label="ID"
                sortable={false}
                classNameAddition="min-w-fit whitespace-nowrap px-4"
              /> */}
                {fieldOptions.map((f, i) => (
                  <ThCell
                    key={f.value}
                    label={f.label}
                    sortable={false}
                    classNameAddition={`${
                      i === fieldOptions.length - 1
                        ? "w-full min-w-fit"
                        : "min-w-fit whitespace-nowrap"
                    } px-4`}
                  />
                ))}
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={fieldOptions.length || 1}
                    className="h-57 text-center text-[var(--text-secondary)]"
                  >
                    <Message icon="loading" content={t("Message/Content")} />
                  </td>
                </tr>
              ) : (
                (() => {
                  let currentIsEven = false;
                  let lastGroupId: number | string | null = null;

                  return visibleElements.map((el, index) => {
                    const planId = masterPlans[0]?.id;

                    const groupKey =
                      el.groupId && el.groupId !== 0
                        ? `group-${el.groupId}`
                        : `nogroup-${index}`;

                    if (groupKey !== lastGroupId) {
                      currentIsEven = !currentIsEven;
                      lastGroupId = groupKey;
                    }

                    const isEven = currentIsEven;

                    return (
                      <tr
                        key={`${planId}-${el.id}`}
                        onClick={() => {
                          if (isEditing && isStrikeMode)
                            toggleStrikeThrough(String(planId), String(el.id));
                        }}
                        className={`${isEven ? "bg-[var(--bg-grid)]" : "bg-[var(--bg-grid-zebra)]"} ${
                          isStrikeMode ? "cursor-pointer" : ""
                        } transition-[background] duration-[var(--fast)] hover:bg-[var(--bg-grid-header-hover)]`}
                      >
                        {/* <TdCell classNameAddition="min-w-fit whitespace-nowrap px-4 text-[var(--text-secondary)]">
                        {String(el.id)}
                      </TdCell> */}
                        {fieldOptions.map((f, i) => {
                          const val =
                            el.values?.find(
                              (v: any) => v.masterPlanFieldId === f.id,
                            )?.value ?? "";
                          return (
                            <TdCell
                              key={`${el.id}-${f.value}`}
                              classNameAddition={`${
                                i === fieldOptions.length - 1
                                  ? "w-full min-w-fit"
                                  : "min-w-fit whitespace-nowrap"
                              } `}
                            >
                              {isEditing ? (
                                <div className="relative inline-flex w-full align-middle">
                                  <span className="invisible whitespace-pre">
                                    {val || " "}
                                  </span>
                                  <div className="absolute inset-0 w-full">
                                    <Input
                                      type="text"
                                      value={val || ""}
                                      onChange={(newValue) => {
                                        handleCellChange(
                                          String(planId),
                                          String(el.id),
                                          f.id,
                                          newValue as string,
                                        );
                                      }}
                                      compact
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span
                                  className={`${
                                    el.struckElement
                                      ? "line-through opacity-60"
                                      : ""
                                  } ${val ? "" : "text-[var(--text-secondary)]"}`}
                                >
                                  {val || "—"}
                                </span>
                              )}
                            </TdCell>
                          );
                        })}

                        {isEditing && isStrikeMode && (
                          <td className="w-10 text-center">
                            <SmallerSolid.NoSymbolIcon className="h-5 w-5 opacity-50" />
                          </td>
                        )}
                      </tr>
                    );
                  });
                })()
              )}
            </tbody>
          </table>
        </div>

        {/* --- PAGINATION --- */}
        <div className="flex w-full flex-wrap justify-between gap-x-12 gap-y-4">
          <span className="flex w-[175.23px] text-[var(--text-secondary)]">
            {t("Manage/Viewing")}{" "}
            {totalItems === 0
              ? "0-0"
              : `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, totalItems)}`}{" "}
            {t("Manage/out of")} {totalItems}
          </span>

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
                      } flex min-w-7 cursor-pointer justify-center rounded-full px-1 text-lg transition-colors duration-[var(--fast)]`}
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
    </>
  );
};

export default MasterPlanClient;
