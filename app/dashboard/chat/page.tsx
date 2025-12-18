"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Sparkles } from "lucide-react";

export default function ChatPage() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const exampleQuestions = [
    "How much did I make last month?",
    "What are my biggest expenses?",
    "Which customers haven't paid me?",
    "Am I profitable this quarter?",
    "Who needs a 1099 this year?",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: error instanceof Error ? error.message : "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI Financial Chat</h1>
        <p className="text-gray-600 mt-2">
          Ask questions about your finances in plain English
        </p>
      </div>

      {/* Usage Stats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-sm font-medium">Monthly Usage</CardTitle>
            <CardDescription>
              You have {20 - messages.filter((m) => m.role === "user").length} queries remaining this month
            </CardDescription>
          </div>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Chat with AI
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center">
                    <div>
                      <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">No messages yet</p>
                      <p className="text-sm text-gray-500">
                        Ask a question about your financial data to get started
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-2">
                      <p className="text-sm text-gray-600">Thinking...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your finances..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Example Questions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Example Questions</CardTitle>
              <CardDescription>Try asking these questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {exampleQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3 px-4"
                  onClick={() => setInput(question)}
                  disabled={isLoading}
                >
                  <span className="text-sm">{question}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h3 className="font-bold text-sm text-gray-900 mb-2">How it works</h3>
              <ul className="space-y-2 text-xs text-gray-600">
                <li>• Ask questions in plain English</li>
                <li>• AI analyzes your financial data</li>
                <li>• Get instant, accurate answers</li>
                <li>• 20 queries per month included</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
