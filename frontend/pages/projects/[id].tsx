"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Editor from "@monaco-editor/react";
import api from "@/lib/api";
import { socket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ProjectEditor() {
  const router = useRouter();
  const { id } = router.query;
  const [code, setCode] = useState("// Loading project code...");
  const [review, setReview] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const editorRef = useRef<any>(null);

  // Connect to backend via WebSocket
  useEffect(() => {
    if (!id) return;

    socket.emit("joinProject", { projectId: id });
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    // Load initial code
    api.get(`/projects/${id}`).then((res) => {
      const file = res.data.codeFiles?.[0];
      setCode(file?.content || "// Empty project");
    });

    // Listen for real-time updates
    socket.on("codeUpdate", (data) => {
      if (data.projectId === Number(id) && data.content !== code) {
        setCode(data.content);
      }
    });

    return () => {
      socket.off("codeUpdate");
      socket.emit("leaveProject", { projectId: id });
    };
  }, [id]);

  // Handle local edits
  function handleEditorChange(value: string | undefined) {
    setCode(value || "");
    socket.emit("editCode", { projectId: id, content: value });
  }

  async function handleAIReview() {
    setReview("Running AI review...");
    try {
      const res = await api.post(`/projects/${id}/review`);
      setReview(res.data.summary || JSON.stringify(res.data, null, 2));
    } catch (err: any) {
      setReview("Error fetching review.");
    }
  }

  return (
    <div className="flex h-screen">
      <div className="flex-1">
        <div className="flex justify-between items-center p-2 bg-gray-800 text-white">
          <span>Project #{id}</span>
          <span className={connected ? "text-green-400" : "text-red-400"}>
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>

        <Editor
          height="100%"
          language="typescript"
          theme="vs-dark"
          value={code}
          onMount={(editor) => (editorRef.current = editor)}
          onChange={handleEditorChange}
        />
      </div>

      <div className="w-1/3 p-4 border-l bg-gray-50 overflow-y-auto">
        <Card>
          <CardContent className="space-y-4 p-4">
            <Button onClick={handleAIReview}>Request AI Review</Button>
            {review ? (
              <pre className="text-sm whitespace-pre-wrap">{review}</pre>
            ) : (
              <p className="text-gray-500 text-sm">No review yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
