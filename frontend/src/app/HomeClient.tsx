"use client";

import {
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { FormEvent, useEffect, useState } from "react";
import NewsModal from "./components/modals/NewsModal";
import DeleteModal from "./components/modals/DeleteModal";
import Input from "./components/input/Input";
import CustomTooltip from "./components/customTooltip/CustomTooltip";
import { useNotification } from "./components/notification/NotificationProvider";
import Message from "./components/message/Message";
import {
  buttonPrimaryClass,
  hyperLinkButtonClass,
  iconbuttonDeletePrimaryClass,
  iconButtonPrimaryClass,
} from "./styles/buttonClasses";
import Link from "next/link";

type Props = {
  isAuthReady: boolean | null;
  isLoggedIn: boolean | null;
  isAdmin: boolean | null;
  isConnected: boolean | null;
};

type NewsItem = {
  id: number;
  date: string;
  type: string;
  headline: string;
  content: string;
  author: string;
  authorId: number;
};

const HomeClient = (props: Props) => {
  // States.
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoadingNews, setIsLoadingNews] = useState(false);

  // Other variables.
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");
  const { notify } = useNotification();

  // Display welcome message.
  useEffect(() => {
    const message = localStorage.getItem("postLoginNotification");
    if (message) {
      notify("info", "Välkommen, " + message + "!", 6000);
      localStorage.removeItem("postLoginNotification");
    }
  }, []);

  /* --- BACKEND COMMUNICATION --- */
  // News.
  const fetchNews = async () => {
    try {
      setIsLoadingNews(true);

      const response = await fetch(`${apiUrl}/news/fetch`, {
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (!response.ok) {
        notify("error", result.message);
      } else {
        setNewsItems(result);
      }
    } catch (err) {
    } finally {
      setIsLoadingNews(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const deleteNewsItem = async (id: number) => {
    try {
      const response = await fetch(`${apiUrl}/news/delete/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        notify("error", result.message);
      } else {
        setNewsItems((prev) => prev.filter((item) => item.id !== id));
        selectedItemId == null;
        notify("success", "Nyhet borttagen!", 4000);
      }
    } catch (err) {
      notify("error", String(err));
    }
  };

  // Login.
  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    localStorage.removeItem("token");

    try {
      const response = await fetch(`${apiUrl}/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        notify("error", result.message);
      } else {
        localStorage.setItem("token", result.token);
        localStorage.setItem("postLoginNotification", result.message);
        window.location.reload();
      }
    } catch (err) {
      notify("error", String(err));
    }
  };

  /* --- BACKEND COMMUNICATION --- */

  // News editing handler.
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

  return (
    <>
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
      {/* --- Login & news section --- */}
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* --- Login container --- */}
        {props.isLoggedIn === false && (
          <div className="flex w-full flex-col lg:w-1/3 lg:min-w-80">
            {/* --- Login header --- */}
            <div className="flex rounded-t border-2 border-[var(--border-main)] bg-[var(--bg-grid-header)] py-2 px-3">
              <span className="font-semibold">Logga in</span>
            </div>
            {/* --- Login content --- */}
            <div className="flex max-h-96 min-h-96 items-center justify-center rounded-b border-2 border-t-0 border-[var(--border-main)] p-4">
              {/* --- Login form --- */}
              {props.isConnected ? (
                <form
                  onSubmit={handleLogin}
                  className="flex w-64 flex-col gap-8"
                >
                  <Input
                    id="username"
                    type="text"
                    label={"Användarnamn"}
                    onChange={(val) => setUsername(String(val))}
                    required
                  />

                  <Input
                    id="password"
                    type="password"
                    label={"Lösenord"}
                    onChange={(val) => setPassword(String(val))}
                    required
                  />
                  <button
                    type="submit"
                    className={`${buttonPrimaryClass} w-full`}
                  >
                    Logga in
                  </button>
                  <span className="-mt-4 flex justify-center text-center">
                    <Link href="/" className={`${hyperLinkButtonClass} `}>
                      Glömt ditt lösenord?
                    </Link>
                  </span>
                </form>
              ) : (
                <Message icon="server" content="server" />
              )}
            </div>
          </div>
        )}

        {/* --- News container --- */}
        <div
          className={`${props.isLoggedIn ? "w-full" : "lg:w-2/3"} flex w-full flex-col`}
        >
          {/* --- News header --- */}
          <div className="flex justify-between rounded-t border-2 border-[var(--border-main)] bg-[var(--bg-grid-header)] p-2">
            <span className="ml-1 font-semibold">Nyheter</span>

            {props.isLoggedIn !== false && props.isAdmin && (
              <CustomTooltip content="Lägg till nyhet" hideOnClick={true}>
                <button
                  type="button"
                  className={`${iconButtonPrimaryClass} h-6 w-6`}
                  onClick={() => openNewsModal(null)}
                >
                  <PlusIcon />
                </button>
              </CustomTooltip>
            )}
          </div>

          {/* --- News content --- */}
          <div className="flex max-h-96 min-h-96 flex-col overflow-y-auto rounded-b border-2 border-t-0 border-[var(--border-main)] p-2">
            {!props.isAuthReady ? (
              ""
            ) : isLoadingNews ? (
              <Message icon="loading" content="Hämtar nyheter..." />
            ) : newsItems.length > 0 ? (
              <div>
                {newsItems.map((item, index) => (
                  <div key={index}>
                    <article className="group duration-fast flex flex-col p-2 transition-colors hover:bg-[var(--bg-navbar-link)]">
                      <time className="text-xs uppercase" dateTime={item.date}>
                        {new Date(item.date).toLocaleDateString("sv-SE", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </time>

                      <div className="flex items-center justify-between">
                        <h3 className="text-xl text-[var(--accent-color)]">
                          {item.type}
                        </h3>
                        {props.isLoggedIn !== false && props.isAdmin && (
                          <div className="mr-2 hidden gap-2 group-hover:flex">
                            <CustomTooltip
                              content="Redigera nyhet"
                              hideOnClick={true}
                            >
                              <button
                                type="button"
                                className={`${iconButtonPrimaryClass}`}
                                onClick={() => openNewsModal(item.id)}
                              >
                                <PencilSquareIcon />
                              </button>
                            </CustomTooltip>

                            <CustomTooltip
                              content="Ta bort nyhet"
                              hideOnClick={true}
                            >
                              <button
                                type="button"
                                className={`${iconbuttonDeletePrimaryClass}`}
                                onClick={() => toggleDeleteModal(item.id)}
                              >
                                <TrashIcon />
                              </button>
                            </CustomTooltip>
                          </div>
                        )}
                      </div>

                      <h4 className="text-lg font-semibold">{item.headline}</h4>

                      <div dangerouslySetInnerHTML={{ __html: item.content }} />
                      <small className="text italic opacity-25">
                        Publicerad av:{" "}
                        {props.isAdmin
                          ? item.author + " (ID: " + item.authorId + ")"
                          : item.author}
                      </small>
                    </article>
                    {index !== newsItems.length - 1 && (
                      <span className="my-2 flex h-[2px] w-full self-stretch rounded bg-[var(--border-main-transparent)]"></span>
                    )}
                  </div>
                ))}
              </div>
            ) : props.isConnected ? (
              <Message content="Det finns tyvärr inga nyheter för tillfället!" />
            ) : (
              <Message icon="server" content="server" />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default HomeClient;
