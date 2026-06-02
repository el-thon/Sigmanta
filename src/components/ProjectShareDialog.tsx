"use client";

import { useState } from "react";
import { Check, Copy, Download, Facebook, Mail, MessageCircle, Send, Share2, X } from "lucide-react";

export function ProjectShareDialog({
  projectId,
  projectName,
  trigger = "share",
  buttonClassName = "brutal-button bg-earth-light p-3",
  label,
  iconSize = 17,
}: {
  projectId: number;
  projectName: string;
  trigger?: "share" | "export";
  buttonClassName?: string;
  label?: string;
  iconSize?: number;
}) {
  const [open, setOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const encodedText = encodeURIComponent(`Salin project SIGMITA: ${projectName}`);
  const encodedUrl = encodeURIComponent(shareUrl);

  async function openShare() {
    setOpen(true);
    if (shareUrl) return;

    setLoading(true);
    const response = await fetch(`/api/projects/${projectId}/share`, { method: "POST" });
    const data = await response.json().catch(() => null);
    setLoading(false);

    if (response.ok && data?.url) {
      const url = new URL(data.url);
      setShareUrl(`${window.location.origin}${url.pathname}`);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <>
      <button className={buttonClassName} aria-label="Bagikan" onClick={openShare} type="button">
        {trigger === "export" ? <Download size={iconSize} /> : <Share2 size={iconSize} />}
        {label}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-earth-dark/45 px-4">
          <div className="brutal-card w-full max-w-xl bg-earth-light">
            <div className="flex items-center justify-between border-b-2 border-earth-dark px-5 py-4">
              <div>
                <p className="label-mono text-moss">Share & Export</p>
                <h2 className="font-display mt-1 text-2xl font-black">Bagikan Project</h2>
              </div>
              <button aria-label="Tutup share" onClick={() => setOpen(false)} type="button">
                <X />
              </button>
            </div>

            <div className="p-5">
              <p className="text-sm leading-6 text-earth-dark/70">
                Link ini membuat penerima bisa menyalin project menjadi project miliknya sendiri. Tidak ada realtime collaboration.
              </p>

              <div className="mt-5 flex gap-2">
                <input
                  className="min-w-0 flex-1 border-2 border-earth-dark bg-earth-paper px-3 py-3 text-sm outline-none"
                  value={loading ? "Membuat link..." : shareUrl}
                  readOnly
                />
                <button className="brutal-button bg-earth-dark px-4 py-3 text-earth-light" disabled={!shareUrl} onClick={copyLink} type="button">
                  {copied ? <Check size={17} /> : <Copy size={17} />}
                </button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <a className="brutal-button bg-moss-light px-4 py-3 text-moss" href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`} target="_blank" rel="noreferrer">
                  <MessageCircle size={17} /> WhatsApp
                </a>
                <a className="brutal-button bg-water-light px-4 py-3 text-water" href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`} target="_blank" rel="noreferrer">
                  <Send size={17} /> Telegram
                </a>
                <a className="brutal-button bg-earth-light px-4 py-3" href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`} target="_blank" rel="noreferrer">
                  <X size={17} /> X
                </a>
                <a className="brutal-button bg-water px-4 py-3 text-earth-light" href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noreferrer">
                  <Facebook size={17} /> Facebook
                </a>
                <a className="brutal-button bg-earth-light px-4 py-3 sm:col-span-2" href={`mailto:?subject=${encodedText}&body=${encodedUrl}`}>
                  <Mail size={17} /> Email
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
