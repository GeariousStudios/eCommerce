"use client";

import {
  PlusIcon,
  PencilSquareIcon as OutlinePencilSquareIcon,
  TrashIcon as OutlineTrashIcon,
  PencilIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import {
  PencilSquareIcon as SolidPencilSquareIcon,
  TrashIcon as SolidTrashIcon,
} from "@heroicons/react/24/solid";
import { FormEvent, useEffect, useState } from "react";
import NewsModal from "./components/modals/NewsModal";
import DeleteModal from "./components/modals/DeleteModal";
import Input from "./components/common/Input";
import { useToast } from "./components/toast/ToastProvider";
import Message from "./components/common/Message";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
  hyperLinkButtonClass,
  iconButtonPrimaryClass,
} from "./styles/buttonClasses";
import HoverIcon from "./components/common/HoverIcon";
import { useTranslations } from "next-intl";
import { utcIsoToLocalDateTime } from "./helpers/timeUtils";
import TrendingPanel from "./components/pulse/TrendingPanel";
import DragDrop from "./components/common/DragDrop";

type Props = {
  isAuthReady: boolean | null;
  isLoggedIn: boolean | null;
  isAdmin: boolean | null;
  isConnected: boolean | null;
};

type NewsItem = {
  id: number;
  date: string;
  typeName: string;
  headline: string;
  content: string;
  updateDate: string;
  updatedBy: string;
};

type Unit = {
  id: number;
  name: string;
  creationDate: string;
};

const HomeClient = (props: Props) => {
  const t = useTranslations();

  // --- VARIABLES ---
  // --- States: News ---
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [isLoadingNews, setIsLoadingNews] = useState(false);

  // --- States: Login ---
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- States: Units ---
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);

  // --- States: Trending panels ---
  const [trendingPanels, setTrendingPanels] = useState<any[]>([]);

  // --- Other ---
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");
  const { notify } = useToast();

  // --- WELCOME MESSAGE ---
  useEffect(() => {
    const message = localStorage.getItem("postLoginToast");
    if (message) {
      notify("info", t("Home/Welcome") + message + "!", 6000);
      localStorage.removeItem("postLoginToast");
    }
  }, []);

  /* --- BACKEND --- */
  // --- Fetch news ---
  const fetchNews = async () => {
    try {
      setIsLoadingNews(true);

      const response = await fetch(`${apiUrl}/news/fetch`, {
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        notify("error", result?.message ?? t("Modal/Unknown error"));
      } else {
        setNewsItems(result);
      }
    } catch (err) {
    } finally {
      setIsLoadingNews(false);
    }
  };

  // --- Delete news item ---
  const deleteNewsItem = async (id: number) => {
    try {
      const response = await fetch(`${apiUrl}/news/delete/${id}`, {
        method: "DELETE",
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        notify("error", result?.message ?? t("Modal/Unknown error"));
      } else {
        setNewsItems((prev) => prev.filter((item) => item.id !== id));
        selectedItemId == null;
        notify(
          "success",
          t("NewsModal/News item") + t("Manage/deleted1"),
          4000,
        );
      }
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  // --- Login ---
  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    localStorage.removeItem("token");

    try {
      const response = await fetch(`${apiUrl}/user/login`, {
        method: "POST",
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        notify("error", result?.message ?? t("Modal/Unknown error"));
        setIsSubmitting(false);
      } else {
        localStorage.setItem("token", result.token);
        localStorage.setItem("postLoginToast", result.message);

        window.location.reload();
      }
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
      setIsSubmitting(false);
    }
  };

  // --- Fetch units ---
  const fetchUnits = async () => {
    try {
      setIsLoadingUnits(true);

      const response = await fetch(
        `${apiUrl}/unit?page=1&pageSize=1000&sortBy=name&sortOrder=asc`,
        {
          headers: {
            "X-User-Language": localStorage.getItem("language") || "sv",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        notify("error", result?.message ?? t("Modal/Unknown error"));
      } else {
        setUnits(
          Array.isArray(result?.items)
            ? result.items.map((u: any) => ({
                id: u.id ?? u.Id,
                name: u.name ?? u.Name,
                creationDate: u.creationDate ?? u.CreationDate,
              }))
            : [],
        );
      }
    } catch (err) {
    } finally {
      setIsLoadingUnits(false);
    }
  };

  // --- Create trending panel ---
  const createTrendingPanel = async () => {
    try {
      const response = await fetch(`${apiUrl}/trending-panel/create`, {
        method: "POST",
        headers: {
          "X-User-Language": localStorage.getItem("language") || "sv",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: "Ny trendpanel",
          type: null,
          period: null,
          unitColumnId: null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        notify("error", result?.message ?? t("Modal/Unknown error"));
      } else {
        notify("info", t("TrendingPanel/Trending panel") + t("Modal/created"));
        setTrendingPanels((prev) => [result, ...prev]);
      }
    } catch (err) {
      notify("error", t("Modal/Unknown error"));
    }
  };

  // --- Fetch trending panels ---
  const fetchTrendingPanels = async () => {
    const response = await fetch(`${apiUrl}/trending-panel?latestFirst=true`, {
      headers: {
        "X-User-Language": localStorage.getItem("language") || "sv",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return;
    }

    const result = await response.json();

    setTrendingPanels(result);
  };

  // --- Reorder trending panels ---
  const reorderTrendingPanels = async (newPanels: any[]) => {
    setTrendingPanels(newPanels);

    await fetch(`${apiUrl}/trending-panel/reorder`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-User-Language": localStorage.getItem("language") || "sv",
      },
      body: JSON.stringify(
        newPanels.map((p, index) => ({
          id: p.id,
          order: index,
        })),
      ),
    });
  };

  // --- FETCH NEWS, UNITS & TRENDING PANELS ON INIT ---
  useEffect(() => {
    fetchNews();
    fetchUnits();
    fetchTrendingPanels();
  }, []);

  // --- TOGGLE MODAL(S) ---
  // --- News ---
  const openNewsModal = (itemId: number | null = null) => {
    setSelectedItemId(itemId);
    setIsNewsModalOpen(true);
  };

  const closeNewsModal = () => {
    setIsNewsModalOpen(false);
  };

  const toggleDeleteModal = (itemId: number | null = null) => {
    if (itemId !== null) {
      setSelectedItemId(itemId);
    }
    setIsDeleteModalOpen((prev) => !prev);
  };

  // --- HELPERS ---
  const getResponsiveSpan = (colSpan: number | null | undefined) => {
    const span = colSpan ?? 1;

    switch (span) {
      case 4:
        return "col-span-1 sm:col-span-2 md:col-span-6 lg:col-span-12";
      case 3:
        return "col-span-1 sm:col-span-2 md:col-span-6 lg:col-span-12 xl:col-span-8 2xl:col-span-9";
      case 2:
        return "col-span-1 sm:col-span-1 md:col-span-6 lg:col-span-6";
      case 1:
        return "col-span-1 sm:col-span-1 md:col-span-6 lg:col-span-6 xl:col-span-4 2xl:col-span-3";
      default:
        return "col-span-1";
    }
  };

  return (
    <>
      {/* --- MODALS --- */}
      <NewsModal
        isOpen={isNewsModalOpen}
        onClose={closeNewsModal}
        newsId={selectedItemId}
        onNewsUpdated={fetchNews}
      />
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={toggleDeleteModal}
        onConfirm={() => {
          if (selectedItemId !== null) {
            deleteNewsItem(selectedItemId);
          }

          setIsDeleteModalOpen(false);
        }}
      />
      <div className="flex flex-col gap-4">
        {props.isLoggedIn && (
          <div className="flex items-center justify-between gap-4">
            {/* --- Add new trending panel --- */}
            <button
              onClick={createTrendingPanel}
              className="duration-fast flex w-full cursor-pointer items-center justify-center gap-2 rounded border-1 border-dashed border-[var(--border-main)] bg-[var(--bg-grid-header)] p-4 transition-colors hover:bg-[var(--bg-navbar-link)]"
            >
              {/* <PlusIcon className="h-6 w-6" /> */}
              {t("TrendingPanel/Add trending panel")}
            </button>
            {/* <button className={`${iconButtonPrimaryClass}`}>
              <PencilIcon className="min-h-4 min-w-4" />
            </button> */}
          </div>
        )}

        {props.isLoggedIn && trendingPanels.length > 0 && (
          <DragDrop
            containerClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-6 lg:grid-cols-12"
            items={trendingPanels}
            getId={(p) => String(p.id)}
            onReorder={(newOrder) => reorderTrendingPanels(newOrder)}
            renderItem={(panel, isDragging) => ({
              className: getResponsiveSpan(panel.colSpan),
              element: (
                <TrendingPanel
                  id={panel.id}
                  title={panel.name}
                  type={panel.type}
                  period={panel.period}
                  viewMode={panel.viewMode}
                  unitIds={panel.unitIds}
                  unitColumnId={panel.unitColumnId}
                  unitOptions={units.map((u) => ({
                    value: String(u.id),
                    label: u.name ?? String(u.id),
                    creationDate: u.creationDate,
                  }))}
                  onUpdated={fetchTrendingPanels}
                  onDeleted={fetchTrendingPanels}
                  customStartDate={panel.customStartDate}
                  customEndDate={panel.customEndDate}
                  colSpan={panel.colSpan}
                  onColSpanChange={(newSpan) => {
                    setTrendingPanels((prev) =>
                      prev.map((p) =>
                        p.id === panel.id ? { ...p, colSpan: newSpan } : p,
                      ),
                    );
                  }}
                  showInfo={panel.showInfo}
                />
              ),
            })}
          />
        )}

        {/* --- MAIN --- */}
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* --- LOGIN --- */}
          {props.isLoggedIn === false && (
            <div className="flex w-full flex-col lg:w-1/3 lg:min-w-80">
              {/* --- Login header --- */}
              <div className="flex h-[40px] items-center rounded-t border-1 border-[var(--border-main)] bg-[var(--bg-grid-header)] px-3 py-2">
                <span className="font-semibold">{t("Common/Login")}</span>
              </div>
              {/* --- Login content --- */}
              <div className="flex max-h-144 min-h-144 items-center justify-center rounded-b border-1 border-t-0 border-[var(--border-main)] p-4">
                {/* --- Login form --- */}
                {props.isConnected ? (
                  <form
                    onSubmit={handleLogin}
                    className="flex w-64 flex-col gap-8"
                  >
                    <Input
                      id="username"
                      type="text"
                      label={t("Common/Username")}
                      onChange={(val) => setUsername(String(val))}
                      required
                    />
                    <Input
                      id="password"
                      type="password"
                      label={t("Common/Password")}
                      onChange={(val) => setPassword(String(val))}
                      required
                    />
                    <button
                      type="submit"
                      className={`${buttonPrimaryClass} w-full`}
                      disabled={isSubmitting}
                    >
                      {t("Common/Login")}
                    </button>
                    <span className="-mt-4 flex justify-center text-center">
                      <button
                        type="button"
                        onClick={() =>
                          notify("error", t("Common/Not implemented"))
                        }
                        className={`${hyperLinkButtonClass} `}
                      >
                        {t("Common/Forgot password")}
                      </button>
                      {/* <Link href="/" className={`${hyperLinkButtonClass} `}>
                      Glömt ditt lösenord?
                    </Link> */}
                    </span>
                    <div className="flex flex-col">
                      <span>Användarnamn: master</span>
                      <span>Lösenord: master</span>
                    </div>
                  </form>
                ) : (
                  <Message icon="server" content="server" />
                )}
              </div>
            </div>
          )}

          {/* --- NEWS --- */}
          <div
            className={`${props.isLoggedIn ? "w-full" : "lg:w-2/3"} flex w-full flex-col`}
          >
            {/* --- News header --- */}
            <div className="flex h-[40px] items-center justify-between rounded-t border-1 border-[var(--border-main)] bg-[var(--bg-grid-header)] px-3 py-2">
              <span className="truncate font-semibold">{t("Common/News")}</span>

              {props.isLoggedIn !== false && props.isAdmin && (
                // <CustomTooltip content={t("Home/Add news")} hideOnClick>
                <button
                  type="button"
                  className={`${iconButtonPrimaryClass} min-h-6 min-w-6`}
                  onClick={() => openNewsModal(null)}
                >
                  <PlusIcon />
                </button>
                // </CustomTooltip>
              )}
            </div>

            {/* --- News content --- */}
            <div className="flex max-h-144 min-h-144 flex-col overflow-y-auto rounded-b border-1 border-t-0 border-[var(--border-main)] p-2">
              {!props.isAuthReady ? (
                ""
              ) : isLoadingNews ? (
                <Message icon="loading" content="content" />
              ) : newsItems.length > 0 ? (
                <div>
                  {newsItems.map((item, index) => (
                    <div key={index}>
                      <article className="group/newsItem duration-fast flex flex-col p-2 transition-colors hover:bg-[var(--bg-navbar-link)]">
                        <time
                          className="text-xs uppercase"
                          dateTime={item.date}
                        >
                          {new Date(item.date).toLocaleDateString("sv-SE", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </time>

                        <div className="flex items-center justify-between">
                          <h3 className="text-xl text-[var(--accent-color)]">
                            {item.typeName}
                          </h3>
                          {props.isLoggedIn !== false && props.isAdmin && (
                            <div className="mr-2 hidden gap-2 group-hover/newsItem:flex">
                              {/* <CustomTooltip
                              content={t("Home/Edit news")}
                              hideOnClick
                            > */}
                              <button
                                type="button"
                                className={`${iconButtonPrimaryClass} group`}
                                onClick={() => openNewsModal(item.id)}
                              >
                                <HoverIcon
                                  outline={OutlinePencilSquareIcon}
                                  solid={SolidPencilSquareIcon}
                                  className="h-6 min-h-6 w-6 min-w-6"
                                />
                              </button>
                              {/* </CustomTooltip> */}

                              {/* <CustomTooltip
                              content={t("Home/Delete news")}
                              hideOnClick
                            > */}
                              <button
                                type="button"
                                className={`${iconButtonPrimaryClass} group`}
                                onClick={() => toggleDeleteModal(item.id)}
                              >
                                <HoverIcon
                                  outline={OutlineTrashIcon}
                                  solid={SolidTrashIcon}
                                  className="h-6 min-h-6 w-6 min-w-6"
                                />
                              </button>
                              {/* </CustomTooltip> */}
                            </div>
                          )}
                        </div>

                        <h4 className="text-lg font-semibold">
                          {item.headline}
                        </h4>

                        <div
                          dangerouslySetInnerHTML={{ __html: item.content }}
                        />
                        <small className="mt-4 text-[var(--text-secondary)] italic">
                          {t("Common/Updated")}{" "}
                          {utcIsoToLocalDateTime(item.updateDate)}{" "}
                          {t("Common/by")} {item.updatedBy}
                        </small>
                      </article>
                      {index !== newsItems.length - 1 && (
                        <hr className="text-[var(--border-main)]" />
                      )}
                    </div>
                  ))}
                </div>
              ) : props.isConnected ? (
                <Message content={t("Home/No news")} />
              ) : (
                <Message icon="server" content="server" />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomeClient;
