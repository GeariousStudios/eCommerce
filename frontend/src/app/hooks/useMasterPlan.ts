"use client";

import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { useToast } from "../components/toast/ToastProvider";
import { useAuth } from "../context/AuthContext";
import { skip } from "node:test";

type MasterPlanElement = {
  id: number | string;
  values: {
    masterPlanFieldId: number;
    masterPlanFieldName: string;
    value: string;
  }[];
  groupId?: number | null;
  struckElement?: boolean;
  currentElement?: boolean;
  nextElement?: boolean;
  isNew?: boolean;
};

export const useMasterPlan = (
  t: any,
  apiUrl: string | undefined,
  token: string | null,
  masterPlanId: string | string[] | undefined,
) => {
  // --- VARIABLES ---
  // --- Refs ---
  const signalRStartedRef = useRef(false);
  const skipNextInfoRef = useRef(false);

  // --- States ---
  const [isLoading, setIsLoading] = useState(false);
  const [isManualRefresh, setIsManualRefresh] = useState(false);
  const [refetchData, setRefetchData] = useState(false);
  const [masterPlans, setMasterPlans] = useState<
    { id: number | string; elements: MasterPlanElement[]; [key: string]: any }[]
  >([]);

  const [fieldOptions, setFieldOptions] = useState<
    { id: number; label: string; value: string }[]
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

  // --- Other ---
  const { notify } = useToast();
  const { username } = useAuth();
  const checkedOutByMe = checkedOutBy !== null && checkedOutBy === username;

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
        const sorted = [...(data.elements ?? [])].sort((a, b) => {
          const aGroup = a.groupId ?? 0;
          const bGroup = b.groupId ?? 0;
          if (aGroup !== bGroup) return bGroup - aGroup;
          const aOrder = a.order ?? 0;
          const bOrder = b.order ?? 0;
          return aOrder - bOrder;
        });

        setMasterPlans([{ ...data, elements: sorted }]);
        setTotalItems(data.elements?.length ?? 0);

        const options =
          data.fields?.map((f: any) => ({
            label: f.name,
            value: f.id.toString(),
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
                          ? { ...v, value: newValue }
                          : v,
                      ),
                    },
              ),
            },
      ),
    );
  };

  // --- Toggle strike through ---
  const toggleStrikeThrough = (planId: string, elementId: string) => {
    setMasterPlans((prev) =>
      prev.map((plan) =>
        plan.id !== planId
          ? plan
          : {
              ...plan,
              elements: plan.elements.map((el: MasterPlanElement) =>
                el.id === elementId
                  ? { ...el, struckElement: !el.struckElement }
                  : el,
              ),
            },
      ),
    );
  };

  // --- Handle save ---
  const handleSave = async () => {
    if (!masterPlans.length) return;

    const plan = masterPlans[0];
    try {
      setIsLoading(true);

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

        const isNew = el.isNew;
        const hasChanged = el.values.some(
          (v) => v.value !== "" && v.value !== null,
        );

        if (!isNew && !hasChanged) continue;

        const valuesDto = {
          values: el.values.map((v) => ({
            masterPlanFieldId: v.masterPlanFieldId,
            value: v.value === "" ? null : v.value,
          })),
        };

        const valuesRes = await fetch(
          `${apiUrl}/master-plan-elements/update/${elementId}/values`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "X-User-Language": localStorage.getItem("language") || "sv",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(valuesDto),
          },
        );

        if (!valuesRes.ok) continue;

        const metaDto = {
          id: elementId,
          masterPlanId: plan.id,
          groupId: el.groupId ?? null,
          struckElement: !!el.struckElement,
          currentElement: !!el.currentElement,
          nextElement: !!el.nextElement,
          order: plan.elements.indexOf(el),
        };

        const metaRes = await fetch(
          `${apiUrl}/master-plan-elements/update/${elementId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "X-User-Language": localStorage.getItem("language") || "sv",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(metaDto),
          },
        );

        if (!metaRes.ok) continue;
      }

      setIsEditing(false);
      setRefetchData(true);
      await handleCheck(true);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handle cancel ---
  const handleAbortChanges = async () => {
    setIsEditing(false);
    setRefetchData(true);
    await handleCheck(true);
  };

  // --- Check hub ---
  const handleCheck = async (force = false) => {
    if (!masterPlanId || !apiUrl) return;
    try {
      skipNextInfoRef.current = true;

      setIsLoading(true);
      const response = await fetch(
        `${apiUrl}/master-plan/check/${masterPlanId}?force=${force}`,
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

      notify("success", t(data.message, 6000));

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
      setIsLoading(false);
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

  // --- Move element ---
  const moveElement = (
    planId: string,
    elementId: string,
    direction: "up" | "down",
  ) => {
    setMasterPlans((prev) =>
      prev.map((plan) => {
        if (plan.id !== planId) return plan;
        const elements: MasterPlanElement[] = [...plan.elements];
        const index = elements.findIndex((el) => el.id === elementId);
        if (index === -1) return plan;
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= elements.length) return plan;
        const [moved] = elements.splice(index, 1);
        elements.splice(targetIndex, 0, moved);
        return { ...plan, elements };
      }),
    );
  };

  // --- HELPERS ---
  const allElements: MasterPlanElement[] = masterPlans[0]?.elements ?? [];
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleElements = allElements.slice(
    startIndex,
    startIndex + itemsPerPage,
  );
  const elementCount = allElements.length;
  const totalPages = Math.max(1, Math.ceil(elementCount / itemsPerPage));

  return {
    // --- States ---
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
    currentPage,
    itemsPerPage,
    isEditing,
    groupCounter,
    isStrikeMode,
    setShowHidden,
    setIsExpanded: undefined,
    setCurrentPage,
    setItemsPerPage,
    setIsEditing,
    setIsManualRefresh,
    setRefetchData,
    setGroupCounter,
    setIsStrikeMode,
    checkedOutBy,
    checkedOutByMe,

    // --- Functions ---
    handleSearch,
    handleReset,
    handleAddElement,
    handleCellChange,
    toggleStrikeThrough,
    handleSave,
    handleAbortChanges,
    handleCheck,
    moveElement,

    // --- Helpers ---
    startIndex,
    visibleElements,
    totalPages,
  };
};
