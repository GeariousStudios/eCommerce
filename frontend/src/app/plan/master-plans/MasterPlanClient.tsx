"use client";

import { useTranslations } from "next-intl";
import useTheme from "@/app/hooks/useTheme";
import Input from "@/app/components/common/Input";
import MultiDropdown from "@/app/components/common/MultiDropdown";
import {
  buttonAddPrimaryClass,
  buttonDeletePrimaryClass,
  buttonDeleteSecondaryClass,
  buttonPrimaryClass,
  buttonSecondaryClass,
  hyperLinkButtonClass,
  iconButtonPrimaryClass,
  switchClass,
  switchKnobClass,
  textPrimaryButtonClass,
  textSecondaryButtonClass,
} from "@/app/styles/buttonClasses";
import * as Outline from "@heroicons/react/24/outline";
import * as Solid from "@heroicons/react/24/solid";
import * as SmallerSolid from "@heroicons/react/20/solid";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { TdCell, ThCell } from "../../components/manage/ManageComponents";
import Message from "../../components/common/Message";
import SingleDropdown from "../../components/common/SingleDropdown";
import CustomTooltip from "@/app/components/common/CustomTooltip";
import HoverIcon from "@/app/components/common/HoverIcon";
import { useParams } from "next/navigation";
import { useMasterPlan } from "@/app/hooks/useMasterPlan";
import { tdClass, thClass } from "@/app/components/manage/ManageClasses";
import { useAuth } from "@/app/context/AuthContext";

type Props = {
  isAuthReady: boolean | null;
  isLoggedIn: boolean | null;
  isConnected: boolean | null;
  isMasterPlanner: boolean | null;
};

const MasterPlanClient = (props: Props) => {
  const t = useTranslations();
  const { masterPlanId } = useParams();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const {
    setIsCheckingOut,
    setIsCheckingIn,
    isCheckingOut,
    isCheckingIn,
    isLoading,
    isManualRefresh,
    refetchData,
    masterPlans,
    fieldOptions,
    showHidden,
    sortBy,
    sortOrder,
    totalItems,
    totalGroups,
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
    moveElement,
    moveGroup,
    toggleRemoveElement,
    removedElementIds,
    clearRemovedElements,
    constraintsRef,
    dragControls,
    isExpanded,
    setIsExpanded,
    selectedId,
    setSelectedId,
    editMode,
    setEditMode,
    isKeepSeparate,
    setIsKeepSeparate,
    showForceColor,
    selectedElement,
    isSelectedStruck,
    handleHoldStart,
    handleHoldEnd,
  } = useMasterPlan(t, apiUrl, token, masterPlanId);

  return (
    <>
      {isEditing && (
        <>
          <div className="fixed inset-0 z-[calc(var(--z-edit)-2)] bg-(--bg-main) opacity-90" />

          <div className="pointer-events-none fixed inset-0 z-[calc(var(--z-edit)+1)] border-6 border-(--edit-mode)" />

          <div className="fixed top-0 left-0 z-(--z-edit) w-full bg-(--edit-mode) py-2 text-center text-lg font-semibold tracking-wide text-(--text-main-reverse)">
            {t("Common/Editing")} {t("Common/master plan")}
          </div>
        </>
      )}

      <div
        className={`grid gap-4 ${isEditing ? "relative z-[calc(var(--z-edit)-1)]" : ""}`}
      >
        {/* --- HEADER --- */}
        {/* <div className="grid w-full rounded-2xl bg-(--bg-modal)">
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
                  <div className="grid gap-6">
                    <hr className="-mx-6 mt-6 text-(--border-tertiary)" />

                    <div className="flex items-center gap-2">
                      <hr className="w-12 text-(--border-tertiary)" />
                      <h3 className="text-sm whitespace-nowrap text-(--text-secondary)">
                        {t("AuditTrail/Filters")}
                      </h3>
                      <hr className="w-full text-(--border-tertiary)" />
                    </div>

                    <div className="mb-8 grid gap-6">
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2"></div>
                    </div>

                    <div className="grid gap-6">
                      <div className="flex items-center gap-2">
                        <hr className="w-12 text-(--border-tertiary)" />
                        <h3 className="text-sm whitespace-nowrap text-(--text-secondary)">
                          {t("Common/Status")}
                        </h3>
                        <hr className="w-full text-(--border-tertiary)" />
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
        </div> */}

        {/* --- CHECKING BAR --- */}
        {props.isMasterPlanner ? (
          <>
            <div className="flex w-full flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-4">
                <button
                  className={` ${buttonPrimaryClass} group lg:w-max lg:px-4 ${
                    isEditing
                      ? "!bg-(--note-success) text-(--text-main-reverse) hover:!bg-(--note-success-hover)"
                      : showForceColor
                        ? "!bg-(--note-error) text-(--text-main-reverse) hover:!bg-(--note-error-hover)"
                        : ""
                  } `}
                  disabled={isCheckingOut || isCheckingIn || isLoading}
                  onClick={() => {
                    if (!isEditing) {
                      if (checkedOutBy && !checkedOutByMe) {
                        setIsCheckingOut(true);
                        handleCheck(true);
                      } else {
                        setIsCheckingOut(true);
                        handleCheck(false);
                      }
                    } else {
                      setIsCheckingIn(true);
                      setIsKeepSeparate(false);
                      handleSave();
                    }
                  }}
                >
                  <div className="flex items-center justify-center gap-2 truncate">
                    {(isCheckingOut || isCheckingIn) && (
                      <Outline.ArrowPathIcon className="h-6 w-6 motion-safe:animate-[spin_1s_linear_infinite]" />
                    )}

                    {!isCheckingOut && !isCheckingIn && (
                      <HoverIcon
                        outline={
                          isEditing
                            ? Outline.CheckIcon
                            : showForceColor
                              ? Outline.ExclamationTriangleIcon
                              : Outline.PencilIcon
                        }
                        solid={
                          isEditing
                            ? Solid.CheckIcon
                            : showForceColor
                              ? Solid.ExclamationTriangleIcon
                              : Solid.PencilIcon
                        }
                        className="h-6 w-6"
                      />
                    )}

                    <span className="hidden lg:block">
                      {isCheckingOut || isCheckingIn
                        ? isEditing && isCheckingIn
                          ? t("MasterPlan/Checking in")
                          : isCheckingOut
                            ? t("MasterPlan/Checking out")
                            : t("MasterPlan/Checking in")
                        : showForceColor
                          ? t("MasterPlan/Force checkout")
                          : isEditing
                            ? t("MasterPlan/Save and push")
                            : t("MasterPlan/Edit master plan")}
                    </span>
                  </div>
                </button>

                {/* --- Abort --- */}
                {isEditing && !isCheckingIn && (
                  <button
                    className={`${buttonSecondaryClass} group lg:w-max lg:px-4`}
                    disabled={isCheckingIn}
                    onClick={() => {
                      setIsCheckingIn(true);
                      setIsKeepSeparate(false);
                      handleAbortChanges();
                    }}
                  >
                    <div className="flex items-center justify-center gap-2 truncate">
                      {isCheckingIn ? (
                        <Outline.ArrowPathIcon className="h-6 w-6 motion-safe:animate-[spin_1s_linear_infinite]" />
                      ) : (
                        <HoverIcon
                          outline={Outline.XMarkIcon}
                          solid={Solid.XMarkIcon}
                          className="h-6 w-6"
                        />
                      )}
                      <span className="hidden lg:block">
                        {isCheckingIn
                          ? t("MasterPlan/Checking in")
                          : t("MasterPlan/Abort changes")}
                      </span>
                    </div>
                  </button>
                )}
              </div>

              {/* --- Manual refresh --- */}
              {!isEditing && !isCheckingOut && !isCheckingIn && (
                <CustomTooltip
                  content={`${refetchData && isManualRefresh ? t("Common/Updating") : t("Common/Update page")}`}
                  veryLongDelay
                  showOnTouch
                >
                  <button
                    className={`${buttonSecondaryClass} ml-auto flex w-fit items-center justify-center`}
                    onClick={() => {
                      setIsManualRefresh(true);
                      setRefetchData(true);
                    }}
                    aria-label={t("Common/Update page")}
                    disabled={isManualRefresh && refetchData}
                  >
                    <Outline.ArrowPathIcon
                      className={`${refetchData && isManualRefresh ? "motion-safe:animate-[spin_1s_linear_infinite]" : ""} h-6 w-6`}
                    />
                  </button>
                </CustomTooltip>
              )}
            </div>

            {/* --- Checked out by text --- */}
            {checkedOutBy && !isEditing && !isCheckingOut && !isCheckingIn && (
              <p className="text-sm text-(--text-secondary)">
                {t("MasterPlan/Checked out by")}:{" "}
                <span className="font-medium">{checkedOutBy}</span>
              </p>
            )}

            {/* --- ACTION BAR --- */}
            {isEditing && (
              <div
                ref={constraintsRef}
                className="pointer-events-none fixed inset-0 z-[calc(var(--z-edit)+1)]"
              >
                <motion.div
                  drag
                  dragControls={dragControls}
                  dragListener={false}
                  dragMomentum={false}
                  dragElastic={0}
                  dragConstraints={constraintsRef}
                  className="pointer-events-auto absolute bottom-4 mx-4 flex w-fit flex-col gap-4 rounded-2xl bg-(--bg-modal) p-4 shadow-[0_0_16px_0_rgba(0,0,0,0.125)] lg:left-1/2 lg:-translate-x-1/2"
                  style={{ touchAction: "none" }}
                >
                  <div
                    className="flex cursor-move items-center justify-between gap-4"
                    onPointerDown={(e) => {
                      document.body.style.userSelect = "none";
                      dragControls.start(e);
                      const handleUp = () => {
                        document.body.style.userSelect = "";
                        window.removeEventListener("pointerup", handleUp);
                      };
                      window.addEventListener("pointerup", handleUp);
                    }}
                  >
                    <span className="text-xl font-semibold">
                      {t("MasterPlan/Master Plan Toolbar")}
                    </span>
                    <Outline.Bars3Icon className="h-6 w-6 opacity-50" />
                  </div>

                  <hr className="-ml-4 flex w-[calc(100%+2rem)] text-(--border-tertiary)" />

                  <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2">
                    {/* --- Don't join groups --- */}
                    <div
                      className={`${editMode === "group" ? "cursor-not-allowed opacity-25" : ""}`}
                    >
                      <CustomTooltip
                        content={`${editMode === "element" ? t("MasterPlan/Do not join groups tooltip") : ""}`}
                        showOnTouch
                        longDelay
                      >
                        <div className="flex items-center gap-2 truncate">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isKeepSeparate}
                            className={`${switchClass(isKeepSeparate)} `}
                            onClick={() => setIsKeepSeparate((prev) => !prev)}
                            disabled={editMode === "group"}
                          >
                            <div className={switchKnobClass(isKeepSeparate)} />
                          </button>
                          <span className="mb-0.5">
                            {t("MasterPlan/Do not join groups")}
                          </span>
                        </div>
                      </CustomTooltip>
                    </div>

                    <div className="flex gap-2">
                      {/* --- Edit mode --- */}
                      <CustomTooltip
                        content={t("MasterPlan/Element mode tooltip")}
                        showOnTouch
                        longDelay
                      >
                        <button
                          className={`${editMode === "element" ? `${textPrimaryButtonClass} underline` : `${textSecondaryButtonClass}`}`}
                          onClick={() => setEditMode("element")}
                        >
                          {t("MasterPlan/Element mode")}
                        </button>
                      </CustomTooltip>
                      |
                      <CustomTooltip
                        content={t("MasterPlan/Group mode tooltip")}
                        showOnTouch
                        longDelay
                      >
                        <button
                          className={`${editMode === "group" ? `${textPrimaryButtonClass} underline` : `${textSecondaryButtonClass}`}`}
                          onClick={() => {
                            setEditMode("group");
                            setIsKeepSeparate(false);
                          }}
                        >
                          {t("MasterPlan/Group mode")}
                        </button>
                      </CustomTooltip>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-4">
                    {/* --- Add element --- */}
                    <CustomTooltip
                      content={t("MasterPlan/Add element tooltip")}
                      showOnTouch
                      longDelay
                    >
                      <button
                        className={`${buttonPrimaryClass} group flex items-center justify-center gap-2 lg:w-max lg:px-4`}
                        onClick={() => {
                          const topGroup =
                            editMode === "group"
                              ? (masterPlans[0]?.elements?.[0]?.groupId ?? null)
                              : null;
                          handleAddElement(
                            masterPlans[0]?.id as number,
                            topGroup,
                          );
                        }}
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

                    {/* --- Move up --- */}
                    <CustomTooltip
                      content={t("MasterPlan/Move up tooltip")}
                      showOnTouch
                      longDelay
                    >
                      <button
                        className={`${buttonSecondaryClass} group flex items-center justify-center gap-2 lg:w-max lg:px-4`}
                        onMouseDown={() => handleHoldStart("up")}
                        onMouseUp={handleHoldEnd}
                        onMouseLeave={handleHoldEnd}
                        disabled={selectedId === null}
                      >
                        <HoverIcon
                          outline={Outline.ArrowUpIcon}
                          solid={Solid.ArrowUpIcon}
                          className="h-6 w-6"
                        />
                        <span className="hidden lg:block">
                          {t("MasterPlan/Move up")}
                        </span>
                      </button>
                    </CustomTooltip>

                    {/* --- Move down --- */}
                    <CustomTooltip
                      content={t("MasterPlan/Move down tooltip")}
                      showOnTouch
                      longDelay
                    >
                      <button
                        className={`${buttonSecondaryClass} group flex items-center justify-center gap-2 lg:w-max lg:px-4`}
                        onMouseDown={() => handleHoldStart("down")}
                        onMouseUp={handleHoldEnd}
                        onMouseLeave={handleHoldEnd}
                        disabled={selectedId === null}
                      >
                        <HoverIcon
                          outline={Outline.ArrowDownIcon}
                          solid={Solid.ArrowDownIcon}
                          className="h-6 w-6"
                        />
                        <span className="hidden lg:block">
                          {t("MasterPlan/Move down")}
                        </span>
                      </button>
                    </CustomTooltip>

                    {/* --- Strike mode --- */}
                    <CustomTooltip
                      content={t("MasterPlan/Strike tooltip")}
                      showOnTouch
                      longDelay
                    >
                      <button
                        className={`${
                          isSelectedStruck
                            ? buttonPrimaryClass
                            : buttonSecondaryClass
                        } group flex items-center justify-center gap-2 lg:w-max lg:px-4`}
                        onClick={() => {
                          if (selectedId !== null) {
                            toggleStrikeThrough(String(selectedId), editMode);
                          }
                        }}
                        disabled={selectedId === null}
                      >
                        <HoverIcon
                          outline={Outline.NoSymbolIcon}
                          solid={Solid.NoSymbolIcon}
                          className="h-6 w-6"
                        />
                        <span className="hidden lg:block">
                          {t("MasterPlan/Strike")}
                        </span>
                      </button>
                    </CustomTooltip>

                    {/* --- Delete element --- */}
                    {masterPlans[0]?.allowRemovingElements && (
                      <CustomTooltip
                        content={t("MasterPlan/Mark for deletion tooltip")}
                        showOnTouch
                        longDelay
                      >
                        <button
                          className={`${
                            removedElementIds.includes(Number(selectedId))
                              ? buttonDeletePrimaryClass
                              : buttonDeleteSecondaryClass
                          } group flex items-center justify-center gap-2 lg:w-max lg:px-4`}
                          onClick={() => {
                            if (selectedId !== null) {
                              toggleRemoveElement(String(selectedId), editMode);
                            }
                          }}
                          disabled={selectedId === null}
                        >
                          <HoverIcon
                            outline={Outline.TrashIcon}
                            solid={Solid.TrashIcon}
                            className="h-6 w-6"
                          />
                          <span className="hidden lg:block">
                            {removedElementIds.includes(Number(selectedId))
                              ? t("MasterPlan/Undo mark for deletion")
                              : t("MasterPlan/Mark for deletion")}
                          </span>
                        </button>
                      </CustomTooltip>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </>
        ) : (
          <CustomTooltip
            content={`${refetchData && isManualRefresh ? t("Common/Updating") : t("Common/Update page")}`}
            veryLongDelay
            showOnTouch
          >
            <button
              className={`${buttonSecondaryClass} ml-auto flex w-fit items-center justify-center`}
              onClick={() => {
                setIsManualRefresh(true);
                setRefetchData(true);
              }}
              aria-label={t("Common/Update page")}
              disabled={isManualRefresh && refetchData}
            >
              <Outline.ArrowPathIcon
                className={`${refetchData && isManualRefresh ? "motion-safe:animate-[spin_1s_linear_infinite]" : ""} h-6 w-6`}
              />
            </button>
          </CustomTooltip>
        )}

        {/* --- RESULT LIST --- */}
        <div className="relative w-full overflow-x-auto rounded border border-(--border-main)">
          <table className="table w-full min-w-6xl table-auto border-collapse">
            <thead className="bg-(--bg-grid-header)">
              <tr>
                {/* <ThCell
                label="ID"
                sortable={false}
                classNameAddition="min-w-fit whitespace-nowrap px-4"
              /> */}
                {isEditing && (
                  <th
                    className={`${thClass} pointer-events-none !w-[40px] !min-w-[40px] !border-l-0`}
                  />
                )}

                {fieldOptions
                  .filter((f) => !f.isHidden)
                  .map((f, i) => (
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
                    className="h-57 text-center text-(--text-secondary)"
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
                        className={` ${isEven ? "bg-(--bg-grid)" : "bg-(--bg-grid-zebra)"} ${
                          removedElementIds.includes(el.id)
                            ? "!bg-(--button-delete) text-(--text-main-reverse)"
                            : ""
                        } ${isStrikeMode ? "cursor-pointer" : ""} ${selectedId === el.id ? "ring-2 ring-(--accent-color)" : "hover:bg-(--bg-grid-header-hover)"} transition-[background] duration-(--fast)`}
                      >
                        {/* <TdCell classNameAddition="min-w-fit whitespace-nowrap px-4 text-(--text-secondary)">
                        {String(el.id)}
                      </TdCell> */}

                        {isEditing && (
                          <td
                            className={`${tdClass} !w-[40px] !min-w-[40px] cursor-pointer !border-l-0`}
                            onClick={() => {
                              const id = el.id ? String(el.id) : null;
                              setSelectedId((prev) =>
                                prev === id ? null : id,
                              );
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                const id = el.id ? String(el.id) : null;
                                setSelectedId((prev) =>
                                  prev === id ? null : id,
                                );
                              }
                            }}
                            tabIndex={0}
                          >
                            <div className="flex items-center justify-center">
                              <Input
                                type="radio"
                                name="row-selector"
                                checked={selectedId === String(el.id)}
                                readOnly
                              />
                            </div>
                          </td>
                        )}

                        {fieldOptions
                          .filter((f) => !f.isHidden)
                          .map((f, i) => {
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
                                } ${f.dataType?.toLowerCase() === "date" && isEditing ? "!min-w-[11rem]" : ""}`}
                              >
                                <div
                                  className={`flex w-full ${
                                    f.alignment === "Center"
                                      ? "justify-center"
                                      : f.alignment === "Right"
                                        ? "justify-end"
                                        : f.alignment === "Left"
                                          ? "justify-start"
                                          : "justify-start"
                                  }`}
                                >
                                  {isEditing ? (
                                    <div
                                      className={`relative inline-flex w-full align-middle ${
                                        el.struckElement
                                          ? "line-through opacity-60"
                                          : ""
                                      }`}
                                    >
                                      <span className="invisible whitespace-pre">
                                        {val || " "}
                                      </span>
                                      <div className="absolute inset-0 w-full">
                                        <Input
                                          type={
                                            f.dataType?.toLowerCase() ===
                                            "number"
                                              ? "number"
                                              : f.dataType?.toLowerCase() ===
                                                  "date"
                                                ? "date"
                                                : "text"
                                          }
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
                                          classNameAddition={
                                            el.struckElement
                                              ? "line-through opacity-60"
                                              : ""
                                          }
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <span
                                      className={`${
                                        el.struckElement
                                          ? "line-through opacity-60"
                                          : ""
                                      } ${val ? "" : "text-(--text-secondary)"}`}
                                    >
                                      {val || "—"}
                                    </span>
                                  )}
                                </div>
                              </TdCell>
                            );
                          })}
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
          <span className="flex w-[175.23px] text-(--text-secondary)">
            {t("Manage/Viewing")} {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, totalGroups)}{" "}
            {t("Manage/out of")} {totalGroups}
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
                  Math.ceil(totalGroups / itemsPerPage),
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
                          ? "bg-(--accent-color) text-(--text-main-reverse)"
                          : "hover:text-(--accent-color)"
                      } flex min-w-7 cursor-pointer justify-center rounded-full px-1 text-lg transition-colors duration-(--fast)`}
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
                  Math.min(prev + 1, Math.ceil(totalGroups / itemsPerPage)),
                )
              }
              disabled={currentPage >= Math.ceil(totalGroups / itemsPerPage)}
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
