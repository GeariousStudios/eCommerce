"use client";

import {
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { FormEvent, useEffect, useState } from "react";
import useAuthStatus from "./hooks/useAuthStatus";
import NewsModal from "./components/modals/NewsModal";
import ConfirmModal from "./components/modals/ConfirmModal";
import Input from "./components/input/Input";

type NewsItem = {
  id: number;
  date: string;
  type: string;
  headline: string;
  content: string;
  author: string;
  authorId: number;
};

export default function Home() {
  // States.
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  const { isLoggedIn, isAdmin } = useAuthStatus();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Other variables.
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  /* --- BACKEND COMMUNICATION --- */
  // News.
  const fetchNews = async () => {
    const response = await fetch(`${apiUrl}/news/fetch`, {
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error);
    } else {
      setNewsItems(result);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [isNewsModalOpen]);

  const deleteNewsItem = async (id: number) => {
    const response = await fetch(`${apiUrl}/news/delete/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error);
    } else {
      setNewsItems((prev) => prev.filter((item) => item.id !== id));
      selectedItemId == null;
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
          theme: localStorage.getItem("theme") ?? "light",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message);
      } else {
        localStorage.setItem("token", result.token);
        window.location.reload();
      }
    } catch (err) {
      console.log("Felmeddelande:", err);
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

  const toggleConfirmModal = (itemId: number | null = null) => {
    if (itemId !== null) {
      setSelectedItemId(itemId);
    }
    setIsConfirmModalOpen((prev) => !prev);
  };

  // Logout user if another one logs in.
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "token") {
        window.location.reload();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Wait for isLoggedIn to initialize.
  if (isLoggedIn === null) {
    return;
  }

  return (
    <>
      <NewsModal
        isOpen={isNewsModalOpen}
        onClose={closeNewsModal}
        newsId={selectedItemId}
      />
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={toggleConfirmModal}
        onConfirm={() => {
          if (selectedItemId !== null) {
            deleteNewsItem(selectedItemId);
          }

          setIsConfirmModalOpen(false);
        }}
      />

      <header className="width-full mb-3 flex h-32 items-center justify-center rounded border-2 border-[var(--border-main)] bg-[var(--grid-header)]">
        <h1 className="text-4xl transition-all duration-[var(--medium)] md:text-5xl">
          Dashboard
        </h1>
      </header>
      {/* --- Login & news section --- */}
      <div className="flex flex-col gap-3 lg:flex-row">
        {/* --- Login container --- */}
        {isLoggedIn === false && (
          <div className="flex w-full flex-col lg:w-1/3">
            {/* --- Login header --- */}
            <div className="flex rounded-t border-2 border-[var(--border-main)] bg-[var(--grid-header)] p-2">
              <span className="ml-1">Logga in</span>
            </div>
            {/* --- Login content --- */}
            <div className="bg-grid flex items-center justify-center rounded-b border-2 border-t-0 border-[var(--border-main)] p-6">
              {/* --- Login form --- */}
              <form onSubmit={handleLogin} className="flex flex-col">
                <Input
                  id="username"
                  type="text"
                  label={"Användarnamn"}
                  value={username}
                  onChange={(val) => setUsername(String(val))}
                  required
                />

                <Input
                  id="password"
                  type="password"
                  label={"Lösenord"}
                  value={password}
                  onChange={(val) => setPassword(String(val))}
                  required
                />

                <button
                  type="submit"
                  className="mt-6 cursor-pointer rounded bg-[var(--button-primary)] p-2 transition-colors duration-[var(--fast)] hover:bg-[var(--button-primary-hover)]"
                >
                  Logga in
                </button>
              </form>
            </div>
          </div>
        )}

        {/* --- News container --- */}
        <div
          className={`${isLoggedIn ? "lg-w-full" : "lg:w-2/3"} flex w-full flex-col`}
        >
          {/* --- News header --- */}
          <div className="flex justify-between rounded-t border-2 border-[var(--border-main)] bg-[var(--grid-header)] p-2">
            <span className="ml-1">Nyheter</span>

            {isLoggedIn !== false && isAdmin && (
              <button
                type="button"
                className="mr-1 h-6 w-6 cursor-pointer transition-colors duration-[var(--fast)] hover:text-[var(--accent-color)]"
                onClick={() => openNewsModal(null)}
              >
                <PlusIcon />
              </button>
            )}
          </div>

          {/* --- News content --- */}
          <div className="bg-grid flex items-center rounded-b border-2 border-t-0 border-[var(--border-main)] p-4">
            <div>
              {newsItems.map((item, index) => (
                <article key={index}>
                  <time className="text-xs uppercase" dateTime={item.date}>
                    {new Date(item.date).toLocaleDateString("sv-SE", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </time>

                  <div>
                    <h3 className="text-xl text-[var(--accent-color)]">
                      {item.type}
                    </h3>
                    {isLoggedIn !== false && isAdmin && (
                      <div>
                        <button
                          type="button"
                          className="mr-1 h-6 w-6 cursor-pointer transition-colors duration-[var(--fast)] hover:text-[var(--accent-color)]"
                          onClick={() => openNewsModal(item.id)}
                        >
                          <PencilSquareIcon />
                        </button>

                        <button
                          type="button"
                          className="mr-1 h-6 w-6 cursor-pointer transition-colors duration-[var(--fast)] hover:text-[var(--accent-color)]"
                          onClick={() => toggleConfirmModal(item.id)}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    )}
                  </div>
                  <h4 className="text-lg font-semibold">{item.headline}</h4>
                  <div dangerouslySetInnerHTML={{ __html: item.content }} />
                  <small>
                    Publicerad av:{" "}
                    {isAdmin
                      ? item.author + " (ID: " + item.authorId + ")"
                      : item.author}
                  </small>
                  <span />
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
