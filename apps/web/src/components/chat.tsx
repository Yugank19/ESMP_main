"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send } from 'lucide-react';

export default function ChatComponent() {
    const [messages, setMessages] = useState<{ id: number, text: string, sender: string }[]>([
        { id: 1, text: "Hello team!", sender: "Alice" },
        { id: 2, text: "Hi Alice, how is the project going?", sender: "Bob" }
    ]);
    const [inputText, setInputText] = useState("");

    const sendMessage = () => {
        if (!inputText.trim()) return;
        setMessages([...messages, { id: Date.now(), text: inputText, sender: "Me" }]);
        setInputText("");
        // Emit socket event here
    };

    return (
        <Card className="h-[500px] flex flex-col">
            <CardHeader>
                <CardTitle>Project Chat</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4 p-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'Me' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`rounded-lg px-4 py-2 max-w-[80%] ${msg.sender === 'Me' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
                            <div className="text-xs opacity-70 mb-1">{msg.sender}</div>
                            {msg.text}
                        </div>
                    </div>
                ))}
            </CardContent>
            <div className="p-4 border-t flex gap-2">
                <Input
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage}>
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </Card>
    );
}
