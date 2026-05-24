"use client";

import { Mic, Square } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { transcribeVoiceNote } from "@/app/(app)/today/_actions/transcribe-voice-note";

interface VoiceNoteButtonProps {
  taskId: string;
  onTranscript?: (text: string) => void;
}

export function VoiceNoteButton({
  taskId,
  onTranscript,
}: VoiceNoteButtonProps) {
  const [recording, setRecording] = useState(false);
  const [pending, startTransition] = useTransition();
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        for (const t of stream.getTracks()) t.stop();
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl =
            typeof reader.result === "string" ? reader.result : "";
          const b64 = dataUrl.split(",")[1] ?? "mock";
          startTransition(async () => {
            const result = await transcribeVoiceNote({
              taskId,
              audioBase64: b64,
            });
            if (result.ok && result.transcript) {
              onTranscript?.(result.transcript);
            }
          });
        };
        reader.readAsDataURL(blob);
      };
      mediaRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setRecording(false);
    }
  };

  const stop = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  return (
    <button
      type="button"
      disabled={pending}
      onClick={recording ? stop : start}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border cursor-pointer disabled:opacity-50 ${
        recording
          ? "border-[#F87171]/40 bg-[#F87171]/10 text-[#F87171]"
          : "border-[#1F232B] text-[#9AA0A6] hover:text-[#E8EAED]"
      }`}
    >
      {recording ? (
        <>
          <Square className="w-3 h-3" /> Stop
        </>
      ) : (
        <>
          <Mic className="w-3 h-3" /> Note vocale
        </>
      )}
    </button>
  );
}
