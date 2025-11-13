"use client";

import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { useToast } from "../components/toast/ToastProvider";
import { useAuth } from "../context/AuthContext";
import { skip } from "node:test";
import { useDragControls } from "framer-motion";

type MasterPlanElement = {
  id: number | string;
  values: {
    masterPlanFieldId: number;
    masterPlanFieldName: string;
    value: string;
    originalValue?: string | null;
  }[];
  groupId?: number | null;
  struckElement?: boolean;
  currentElement?: boolean;
  nextElement?: boolean;
  isNew?: boolean;
  originalOrder?: number;
  originalGroupId?: number | null;
  originalStruckElement?: boolean | null;
};

export const useMasterPlan = (
  t: any,
  apiUrl: string | undefined,
  token: string | null,
  masterPlanId: string | string[] | undefined,
) => {
  // --- VARIABLES ---
  // --- Refs ---
  const skipNextInfoRef = useRef(false);
  const constraintsRef = useRef(null);
  const dragControls = useDragControls();

  // --- States ---
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isManualRefresh, setIsManualRefresh] = useState(false);
  const [refetchData, setRefetchData] = useState(false);
  const [masterPlans, setMasterPlans] = useState<
    { id: number | string; elements: MasterPlanElement[]; [key: string]: any }[]
  >([]);
  const [fieldOptions, setFieldOptions] = useState<
    {
      id: number;
      label: string;
      value: string;
      dataType?: string;
      alignment?: "Left" | "Center" | "Right";
      isHidden?: boolean;
    }[]
  >([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [hasSearched, setHasSearched] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(16);
  const [isEditing, setIsEditing] = useState(false);
  const [groupCounter, setGroupCounter] = useState(1);
  const [isStrikeMode, setIsStrikeMode] = useState(false);
  const [firstFetch, setFirstFetch] = useState(true);
  const [checkedOutBy, setCheckedOutBy] = useState<string | null>(null);
  const [removedElementIds, setRemovedElementIds] = useState<
    (number | string)[]
  >([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<"element" | "group">("element");
  const selectedElement = masterPlans[0]?.elements.find(
    (el) => String(el.id) === selectedId,
  );
  const isSelectedStruck = selectedElement?.struckElement ?? false;
  const [isKeepSeparate, setIsKeepSeparate] = useState(false);
  const [holdInterval, setHoldInterval] = useState<NodeJS.Timeout | null>(null);
  const minDelay = 100;
  const startDelay = 600;
  const acceleration = 100;

  // --- Other ---
  const { notify } = useToast();
  const { username } = useAuth();
  const checkedOutByMe = checkedOutBy !== null && checkedOutBy === username;
  const showForceColor =
    !isCheckingOut &&
    !isCheckingIn &&
    !isEditing &&
    checkedOutBy &&
    !checkedOutByMe;

  // --- Initialization ---
  useEffect(() => {
    const fetchMasterPlan = async () => {
      if (!masterPlanId) return;
      try {
        if (firstFetch) setIsLoading(true);
        const response = await fetch(
          `${apiUrl}/master-plan/fetch/${masterPlanId}`,
          {
            headers: {
              "Content-Type": "application/json",
              "X-User-Language": localStorage.getItem("language") || "sv",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) return;

        const data = await response.json();
        setMasterPlans([
          {
            ...data,
            elements: (data.elements ?? []).map((el: any, index: number) => ({
              ...el,
              originalOrder: index,
              originalGroupId: el.groupId,
              originalStruckElement: el.struckElement,
              values: el.values.map((v: any) => ({
                ...v,
                originalValue: v.value,
              })),
            })),
          },
        ]);
        setTotalItems(data.elements?.length ?? 0);

        const options =
          data.fields?.map((f: any) => ({
            label: f.name,
            value: f.id.toString(),
            dataType: f.dataType,
            alignment: f.alignment,
            isHidden: f.isHidden ?? false,
            id: f.id,
          })) ?? [];

        setFieldOptions(options);

        // --- Check initial check status ---
        const checkInitialStatus = async () => {
          if (!masterPlanId || !apiUrl) return;
          try {
            const response = await fetch(
              `${apiUrl}/master-plan/check/status/${masterPlanId}`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  "X-User-Language": localStorage.getItem("language") || "sv",
                  Authorization: `Bearer ${token}`,
                },
              },
            );
            if (!response.ok) return;
            const data = await response.json();
            setIsEditing(data.isCheckedOutByMe || false);
            setCheckedOutBy(data.checkedOutBy || null);
          } catch {}
        };
        checkInitialStatus();
      } finally {
        setRefetchData(false);
        setIsManualRefresh(false);

        if (firstFetch) {
          setIsLoading(false);
          setFirstFetch(false);
        }
      }
    };

    if (refetchData || firstFetch) {
      fetchMasterPlan();
    }
  }, [refetchData]);

  // --- Handle search ---
  const handleSearch = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (showHidden) params.append("isHidden", "true");
      if (selectedFields.length > 0)
        selectedFields.forEach((id) => params.append("fieldIds", id));
      params.append("page", String(currentPage));
      params.append("pageSize", String(itemsPerPage));

      const response = await fetch(
        `${apiUrl}/master-plan?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            "X-User-Language": localStorage.getItem("language") || "sv",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) return;

      const data = await response.json();

      setMasterPlans(data.items ?? []);
      setTotalItems(data.totalCount ?? 0);
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handle reset ---
  const handleReset = () => {
    setSelectedFields([]);
    setShowHidden(false);
    setMasterPlans([]);
    setTotalItems(0);
    setHasSearched(false);
    setCurrentPage(1);
  };

  // --- Handle add element ---
  const handleAddElement = (planId: number, groupId: number | null = null) => {
    setMasterPlans((prev) =>
      prev.map((p) => {
        if (p.id !== planId) return p;

        const newValues = fieldOptions.map((f) => ({
          masterPlanFieldId: f.id,
          masterPlanFieldName: f.label,
          value: "",
        }));

        const nextGroupId =
          groupId ??
          (p.elements.length > 0
            ? Math.max(...p.elements.map((el) => el.groupId || 0)) + 1
            : 1);

        const newElement: MasterPlanElement = {
          id: `temp-${Date.now()}`,
          groupId: nextGroupId,
          values: newValues,
          currentElement: false,
          nextElement: false,
          struckElement: false,
          isNew: true,
        };

        return { ...p, elements: [newElement, ...p.elements] };
      }),
    );
  };

  // --- Handle cell change ---
  const handleCellChange = (
    planId: string,
    elementId: string,
    fieldId: number,
    newValue: string,
  ) => {
    setMasterPlans((prev) =>
      prev.map((plan) =>
        String(plan.id) !== String(planId)
          ? plan
          : {
              ...plan,
              elements: plan.elements.map((el: MasterPlanElement) =>
                String(el.id) !== String(elementId)
                  ? el
                  : {
                      ...el,
                      values: el.values.map((v) =>
                        v.masterPlanFieldId === fieldId
                          ? {
                              ...v,
                              value: newValue,
                              originalValue: v.originalValue ?? v.value ?? "",
                            }
                          : v,
                      ),
                    },
              ),
            },
      ),
    );
  };

  // --- Toggle strike through ---
  const toggleStrikeThrough = (
    elementId: string,
    mode: "element" | "group",
  ) => {
    setMasterPlans((prev) =>
      prev.map((plan) => {
        const target = plan.elements.find(
          (el) => String(el.id) === String(elementId),
        );
        if (!target) return plan;

        const groupId = target.groupId ?? null;
        const currentlyStruck = !!target.struckElement;

        return {
          ...plan,
          elements: plan.elements.map((el) => {
            const shouldStrike =
              mode === "group"
                ? el.groupId === groupId
                : String(el.id) === String(elementId);

            return shouldStrike
              ? { ...el, struckElement: !currentlyStruck, hasChanges: true }
              : el;
          }),
        };
      }),
    );
  };

  // --- Toggle remove element ---
  const toggleRemoveElement = (
    elementId: string,
    mode: "element" | "group" = "element",
  ) => {
    setRemovedElementIds((prev) => {
      const updated = new Set(prev);

      const plan = masterPlans[0];
      if (!plan) return prev;

      const target = plan.elements.find((el) => String(el.id) === elementId);
      if (!target) return prev;

      const groupId = target.groupId ?? null;
      const elementsToToggle =
        mode === "group"
          ? plan.elements.filter((el) => el.groupId === groupId)
          : [target];

      const allMarked = elementsToToggle.every((el) => updated.has(el.id));

      elementsToToggle.forEach((el) => {
        if (allMarked) updated.delete(el.id);
        else updated.add(el.id);
      });

      return Array.from(updated);
    });
  };

  const clearRemovedElements = () => {
    setRemovedElementIds([]);
  };

  // --- Handle save ---
  const handleSave = async () => {
    if (!masterPlans.length) return;

    const plan = masterPlans[0];
    try {
      for (const id of removedElementIds) {
        if (!isNaN(Number(id))) {
          await fetch(`${apiUrl}/master-plan-elements/delete/${id}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "X-User-Language": localStorage.getItem("language") || "sv",
              Authorization: `Bearer ${token}`,
            },
          });
        }
      }

      for (const el of plan.elements) {
        if (isNaN(Number(el.id))) {
          const createDto = {
            groupId: el.groupId ?? null,
            struckElement: !!el.struckElement,
            currentElement: !!el.currentElement,
            nextElement: !!el.nextElement,
            order: plan.elements.indexOf(el),
            values: el.values.map((v) => ({
              masterPlanFieldId: v.masterPlanFieldId,
              value: v.value === "" ? null : v.value,
            })),
          };

          const res = await fetch(
            `${apiUrl}/master-plan-elements/create/${plan.id}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-User-Language": localStorage.getItem("language") || "sv",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(createDto),
            },
          );
          if (!res.ok) continue;
          const { id: newId } = await res.json();
          el.id = newId;
          el.isNew = true;
        }
      }

      for (const el of plan.elements) {
        const elementId = Number(el.id);
        if (isNaN(elementId)) continue;
        if (el.isNew) continue;

        const orderChanged = plan.elements.indexOf(el) !== el.originalOrder;
        const groupChanged = el.groupId !== el.originalGroupId;
        const struckChanged = el.struckElement !== el.originalStruckElement;
        const hasChanged =
          el.values.some((v) => v.value !== v.originalValue) ||
          orderChanged ||
          groupChanged ||
          struckChanged;

        if (!hasChanged) continue;

        const includeGroupList = orderChanged || groupChanged;
        const isFirstMover =
          includeGroupList &&
          !plan.elements.some(
            (prevEl) =>
              prevEl !== el &&
              (plan.elements.indexOf(prevEl) !== prevEl.originalOrder ||
                prevEl.groupId !== prevEl.originalGroupId),
          );

        const updateDto: any = {
          masterPlanId: plan.id,
          groupId: el.groupId ?? null,
          struckElement: !!el.struckElement,
          currentElement: !!el.currentElement,
          nextElement: !!el.nextElement,
          order: plan.elements.indexOf(el),
          values: el.values.map((v) => ({
            masterPlanFieldId: v.masterPlanFieldId,
            value: v.value === "" ? null : v.value,
          })),
        };

        if (isFirstMover) {
          updateDto.groupList = {
            elements: plan.elements.map((e, order) => ({
              elementId: Number(e.id),
              groupId: e.groupId ?? null,
              order,
            })),
          };
        }

        const res = await fetch(
          `${apiUrl}/master-plan-elements/update/${elementId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "X-User-Language": localStorage.getItem("language") || "sv",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(updateDto),
          },
        );

        if (!res.ok) continue;
      }

      setIsEditing(false);
      setEditMode("element");
      setRefetchData(true);
      await handleCheck(true);
      clearRemovedElements();
      setSelectedId(null);
    } finally {
      setIsCheckingIn(false);
    }
  };

  // --- Handle cancel ---
  const handleAbortChanges = async () => {
    setIsEditing(false);
    setEditMode("element");
    setRefetchData(true);
    await handleCheck(true, true);
    clearRemovedElements();
    setSelectedId(null);
  };

  // --- Check hub ---
  const handleCheck = async (force = false, cancelled = false) => {
    if (!masterPlanId || !apiUrl) return;
    try {
      skipNextInfoRef.current = true;

      const response = await fetch(
        `${apiUrl}/master-plan/check/${masterPlanId}?force=${force}&cancelled=${cancelled}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Language": localStorage.getItem("language") || "sv",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        notify("error", data.message, 6000);
        return;
      }

      const type = cancelled ? "info" : "success";
      notify(type, t(data.message, 6000));

      const statusRes = await fetch(
        `${apiUrl}/master-plan/check/status/${masterPlanId}`,
        {
          headers: {
            "Content-Type": "application/json",
            "X-User-Language": localStorage.getItem("language") || "sv",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (statusRes.ok) {
        const status = await statusRes.json();
        setIsEditing(status.isCheckedOutByMe || false);
        setCheckedOutBy(status.checkedOutBy || null);
      }
    } finally {
      setIsCheckingOut(false);
      setIsCheckingIn(false);
    }
  };

  useEffect(() => {
    if (!apiUrl || !masterPlanId) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${apiUrl}/hubs/master-plan`, {
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .build();

    connection.on(
      "MasterPlanForceTakenOver",
      ({ masterPlanId: id, message, forcedBy }) => {
        if (String(id) === String(masterPlanId)) {
          if (!skipNextInfoRef.current) {
            notify("error", t(message, { forcedBy }, 6000));
          }

          skipNextInfoRef.current = false;
          setIsEditing(false);
          setEditMode("element");
          clearRemovedElements();
          setSelectedId(null);
          setRefetchData(true);
        }
      },
    );

    connection.on(
      "MasterPlanCheckedIn",
      ({ masterPlanId: id, message, checkedInBy }) => {
        if (String(id) === String(masterPlanId)) {
          if (checkedInBy !== username && !skipNextInfoRef.current) {
            notify("info", t(message, { checkedInBy }, 6000));
          }

          skipNextInfoRef.current = false;
          setIsEditing(false);
          setEditMode("element");
          clearRemovedElements();
          setSelectedId(null);
          setRefetchData(true);
        }
      },
    );

    connection.on(
      "MasterPlanCheckInAborted",
      ({ masterPlanId: id, message, checkedInBy }) => {
        if (String(id) === String(masterPlanId)) {
          if (checkedInBy !== username && !skipNextInfoRef.current) {
            notify("info", t(message, { checkedInBy }, 6000));
          }

          skipNextInfoRef.current = false;
          setIsEditing(false);
          setEditMode("element");
          clearRemovedElements();
          setSelectedId(null);
          setRefetchData(true);
        }
      },
    );

    connection.on(
      "MasterPlanCheckedOut",
      ({ masterPlanId: id, message, checkedOutBy }) => {
        if (String(id) === String(masterPlanId)) {
          if (checkedOutBy !== username && !skipNextInfoRef.current) {
            notify("info", t(message, { checkedOutBy }, 6000));
          }

          skipNextInfoRef.current = false;
          setCheckedOutBy(checkedOutBy || null);
          setIsEditing(false);
          setRefetchData(true);
        }
      },
    );

    let stopped = false;

    connection
      .start()
      .then(() => {
        if (stopped) {
          return connection.stop().catch(() => {});
        }
      })
      .catch((err) => {
        if (!err.message?.includes("stopped during negotiation")) {
          console.warn("SignalR start error:", err);
        }
      });

    return () => {
      stopped = true;
      if (connection.state === signalR.HubConnectionState.Connected) {
        connection.stop().catch(() => {});
      }
    };
  }, [apiUrl, masterPlanId]);

  // --- Move element & group ---
  const moveElement = (
    planId: string,
    elementId: string,
    direction: "up" | "down",
    keepSeparate = false,
  ) => {
    setMasterPlans((prev) =>
      prev.map((plan) => {
        if (String(plan.id) !== String(planId)) return plan;

        const elements = [...plan.elements];
        const index = elements.findIndex(
          (el) => String(el.id) === String(elementId),
        );
        if (index === -1) return plan;

        const current = elements[index];
        const currentGroupId = current.groupId ?? null;

        // --- Identify all groups ---
        const groups: (number | string)[] = [];
        const seen = new Set<string>();
        for (const el of elements) {
          const key = el.groupId ? `group-${el.groupId}` : `nogroup-${el.id}`;
          if (!seen.has(key)) {
            groups.push(el.groupId ?? `nogroup-${el.id}`);
            seen.add(key);
          }
        }

        // --- If not keepSeparate: normal single element move (with group exit) ---
        if (!keepSeparate) {
          const targetIndex = direction === "up" ? index - 1 : index + 1;

          // --- Move outside top or bottom of list: exit current group ---
          if (targetIndex < 0 || targetIndex >= elements.length) {
            const newGroupId =
              Math.max(
                1,
                ...elements.map((e) => (e.groupId ? Number(e.groupId) : 0)),
              ) + 1;

            const updated = [...elements];
            updated[index] = { ...current, groupId: newGroupId };

            const uniqueGroups = Array.from(
              new Set(
                updated.map((e) =>
                  e.groupId ? `group-${e.groupId}` : `nogroup-${e.id}`,
                ),
              ),
            );
            const movedGroup = `group-${newGroupId}`;
            const newGroupIndex = uniqueGroups.findIndex(
              (g) => g === movedGroup,
            );
            const newPage = Math.floor(newGroupIndex / itemsPerPage) + 1;
            setCurrentPage(newPage);

            return { ...plan, elements: updated };
          }

          // --- Normal swap with next/previous element ---
          const target = elements[targetIndex];
          const reordered = [...elements];
          reordered.splice(index, 1);
          reordered.splice(targetIndex, 0, current);

          // --- Adjust group if crossing group boundary ---
          const currentGroup = current.groupId ?? null;
          const targetGroup = target.groupId ?? null;
          if (currentGroup !== targetGroup) {
            reordered[targetIndex] = { ...current, groupId: targetGroup };
          }

          const moved = reordered[targetIndex];
          const groupKey = moved.groupId
            ? `group-${moved.groupId}`
            : `nogroup-${moved.id}`;
          const allGroups = Array.from(
            new Set(
              reordered.map((e) =>
                e.groupId ? `group-${e.groupId}` : `nogroup-${e.id}`,
              ),
            ),
          );
          const groupIndex = allGroups.findIndex((g) => g === groupKey);
          const newPage = Math.floor(groupIndex / itemsPerPage) + 1;
          setCurrentPage(newPage);

          return { ...plan, elements: reordered };
        }

        // --- KeepSeparate mode: jump whole groups ---
        const currentGroupKey = currentGroupId
          ? `group-${currentGroupId}`
          : `nogroup-${current.id}`;
        const currentGroupIndex = groups.findIndex(
          (g) =>
            (typeof g === "number" ? `group-${g}` : String(g)) ===
            currentGroupKey,
        );
        if (currentGroupIndex === -1) return plan;

        const targetGroupIndex =
          direction === "up" ? currentGroupIndex - 1 : currentGroupIndex + 1;

        // --- If at edge, move out into a new group (same as before) ---
        if (targetGroupIndex < 0 || targetGroupIndex >= groups.length) {
          const newGroupId =
            Math.max(
              1,
              ...elements.map((e) => (e.groupId ? Number(e.groupId) : 0)),
            ) + 1;

          const updated = [...elements];
          const updatedElements = updated.map((el) =>
            el.id === current.id ? { ...el, groupId: newGroupId } : el,
          );

          const uniqueGroups = Array.from(
            new Set(
              updatedElements.map((e) =>
                e.groupId ? `group-${e.groupId}` : `nogroup-${e.id}`,
              ),
            ),
          );
          const movedGroup = `group-${newGroupId}`;
          const newGroupIndex = uniqueGroups.findIndex((g) => g === movedGroup);
          const newPage = Math.floor(newGroupIndex / itemsPerPage) + 1;
          setCurrentPage(newPage);

          return { ...plan, elements: updatedElements };
        }

        const targetGroup = groups[targetGroupIndex];

        // --- Find first element of the target group ---
        const targetFirstIndex = elements.findIndex((el) => {
          if (targetGroup.toString().startsWith("nogroup-")) {
            const id = targetGroup.toString().replace("nogroup-", "");
            return String(el.id) === id;
          }
          return String(el.groupId) === String(targetGroup);
        });
        if (targetFirstIndex === -1) return plan;

        // --- Move current group as a whole ---
        const currentGroupElements = elements.filter((el) =>
          currentGroupId ? el.groupId === currentGroupId : el.id === current.id,
        );
        const filtered = elements.filter(
          (el) =>
            !(currentGroupId
              ? el.groupId === currentGroupId
              : el.id === current.id),
        );

        // --- Find first element of target group in the filtered list ---
        const targetIndexInFiltered = filtered.findIndex((el) => {
          if (targetGroup.toString().startsWith("nogroup-")) {
            const id = targetGroup.toString().replace("nogroup-", "");
            return String(el.id) === id;
          }
          return String(el.groupId) === String(targetGroup);
        });

        // --- Find insert index ---
        let insertIndex = targetIndexInFiltered;
        if (direction === "down" && targetIndexInFiltered !== -1) {
          const targetGroupElements = filtered.filter((el) =>
            targetGroup.toString().startsWith("nogroup-")
              ? String(el.id) === targetGroup.toString().replace("nogroup-", "")
              : String(el.groupId) === String(targetGroup),
          );
          insertIndex = targetIndexInFiltered + targetGroupElements.length;
        }

        if (insertIndex === -1) insertIndex = filtered.length;

        const reordered = [
          ...filtered.slice(0, insertIndex),
          ...currentGroupElements,
          ...filtered.slice(insertIndex),
        ];

        const newPage = Math.floor(targetGroupIndex / itemsPerPage) + 1;
        setCurrentPage(newPage);

        return { ...plan, elements: reordered };
      }),
    );
  };

  const moveGroup = (
    planId: string,
    groupId: number | string | null,
    direction: "up" | "down",
  ) => {
    setMasterPlans((prev) =>
      prev.map((plan) => {
        if (String(plan.id) !== String(planId)) return plan;
        const elements: MasterPlanElement[] = [...plan.elements];

        const groups: (number | string)[] = [];
        const seenGroups = new Set<string>();

        for (const el of elements) {
          const key = el.groupId ? `group-${el.groupId}` : `nogroup-${el.id}`;
          if (!seenGroups.has(key)) {
            groups.push(el.groupId ?? `nogroup-${el.id}`);
            seenGroups.add(key);
          }
        }

        const index = groups.findIndex((g) => String(g) === String(groupId));
        if (index === -1) return plan;

        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= groups.length) return plan;

        const newGroups = [...groups];
        [newGroups[index], newGroups[targetIndex]] = [
          newGroups[targetIndex],
          newGroups[index],
        ];

        const reordered = [...elements].sort((a, b) => {
          const aKey = a.groupId ?? `nogroup-${a.id}`;
          const bKey = b.groupId ?? `nogroup-${b.id}`;
          return newGroups.indexOf(aKey) - newGroups.indexOf(bKey);
        });

        const newGroupIndex = newGroups.findIndex(
          (g) => String(g) === String(groupId),
        );
        const newPage = Math.floor(newGroupIndex / itemsPerPage) + 1;
        setCurrentPage(newPage);

        return { ...plan, elements: reordered };
      }),
    );
  };

  const handleHoldStart = (direction: "up" | "down") => {
    if (!selectedId || !masterPlans[0]?.elements) return;
    let currentDelay = startDelay;

    const performMove = () => {
      if (editMode === "group") {
        const selectedElement = masterPlans[0].elements.find(
          (el) => String(el.id) === selectedId,
        );
        const groupId = selectedElement?.groupId
          ? String(selectedElement.groupId)
          : String(selectedElement?.id ?? "");
        moveGroup(String(masterPlans[0]?.id), groupId, direction);
      } else {
        moveElement(
          String(masterPlans[0]?.id),
          selectedId,
          direction,
          isKeepSeparate,
        );
      }

      currentDelay = Math.max(minDelay, currentDelay - acceleration);
      const next = setTimeout(performMove, currentDelay);
      setHoldInterval(next);
    };

    performMove();
  };

  const handleHoldEnd = () => {
    if (holdInterval) {
      clearTimeout(holdInterval);
      setHoldInterval(null);
    }
  };

  // --- HELPERS ---
  const elements = masterPlans[0]?.elements ?? [];
  const groups: MasterPlanElement[][] = [];
  const seenGroups = new Set<string>();

  for (const el of elements) {
    const key = el.groupId ? `group-${el.groupId}` : `nogroup-${el.id}`;
    if (!seenGroups.has(key)) {
      const group = elements.filter((e) =>
        el.groupId ? e.groupId === el.groupId : e.id === el.id,
      );
      groups.push(group);
      seenGroups.add(key);
    }
  }

  const groupedElements = groups;

  const startGroupIndex = (currentPage - 1) * itemsPerPage;
  const visibleGroups = groupedElements.slice(
    startGroupIndex,
    startGroupIndex + itemsPerPage,
  );

  // const visibleElements = visibleGroups
  //   .flat()
  //   .filter((el) => !removedElementIds.includes(el.id));

  const visibleElements = visibleGroups.flat();

  const totalGroups = groupedElements.length;
  const totalPages = Math.max(1, Math.ceil(totalGroups / itemsPerPage));

  return {
    setIsCheckingOut,
    setIsCheckingIn,
    isCheckingOut,
    isCheckingIn,
    isLoading,
    isManualRefresh,
    refetchData,
    masterPlans,
    fieldOptions,
    selectedFields,
    showHidden,
    sortBy,
    sortOrder,
    hasSearched,
    totalItems,
    totalGroups,
    currentPage,
    itemsPerPage,
    isEditing,
    groupCounter,
    isStrikeMode,
    setShowHidden,
    setIsExpanded,
    setCurrentPage,
    setItemsPerPage,
    setIsEditing,
    setIsManualRefresh,
    setRefetchData,
    setGroupCounter,
    setIsStrikeMode,
    checkedOutBy,
    checkedOutByMe,
    handleSearch,
    handleReset,
    handleAddElement,
    handleCellChange,
    toggleStrikeThrough,
    handleSave,
    handleAbortChanges,
    handleCheck,
    moveElement,
    moveGroup,
    toggleRemoveElement,
    clearRemovedElements,
    visibleElements,
    totalPages,
    removedElementIds,
    dragControls,
    constraintsRef,
    isSelectedStruck,
    selectedElement,
    editMode,
    setEditMode,
    isKeepSeparate,
    setIsKeepSeparate,
    showForceColor,
    selectedId,
    setSelectedId,
    isExpanded,
    handleHoldStart,
    handleHoldEnd,
  };
};
