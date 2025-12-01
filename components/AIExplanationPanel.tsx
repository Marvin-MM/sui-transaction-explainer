import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Volume2, Mic, StopCircle, Sparkles, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import OrbVisualizer from './OrbVisualizer';
import { useLiveSession } from '@/hooks/useLiveSession';
import { cn } from "@/lib/utils";

interface AIExplanationPanelProps {
    isOpen: boolean;
    onClose: () => void;
    explanation: string;
    isLoading: boolean;
    transactionData: any;
}

export const AIExplanationPanel: React.FC<AIExplanationPanelProps> = ({
    isOpen,
    onClose,
    explanation,
    isLoading,
    transactionData
}) => {
    const { isConnected, isError, volume, connect, disconnect, sendText } = useLiveSession();
    const hasConnectedRef = useRef(false);

    const handleToggleVoice = () => {
        if (isConnected) {
            disconnect();
        } else {
            connect();
        }
    };

    // When connected, send the context if not sent yet
    useEffect(() => {
        if (isConnected && !hasConnectedRef.current && transactionData) {
            const contextMessage = `
        I am looking at a transaction with the following details:
        ${JSON.stringify(transactionData)}
        
        The explanation provided was:
        ${explanation}
        
        Please be ready to answer questions about this.
      `;
            // sendText(contextMessage); 
            hasConnectedRef.current = true;
        }

        if (!isConnected) {
            hasConnectedRef.current = false;
        }
    }, [isConnected, transactionData, explanation, sendText]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop for mobile/tablet focus */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:bg-transparent md:backdrop-blur-none md:pointer-events-none"
                    />

                    {/* Main Panel */}
                    <motion.div
                        initial={{ x: "100%", opacity: 0, boxShadow: "0 0 0 rgba(0,0,0,0)" }}
                        animate={{
                            x: 0,
                            opacity: 1,
                            boxShadow: "-10px 0 30px -10px rgba(0,0,0,0.1)"
                        }}
                        exit={{ x: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className={cn(
                            "fixed inset-y-0 right-0 z-50 flex flex-col",
                            "w-full sm:w-[480px] lg:w-[540px]",
                            "bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80",
                            "border-l border-border/50 shadow-2xl"
                        )}
                    >
                        {/* Header */}
                        <div className="flex-none p-6 border-b border-border/40 flex items-center justify-between bg-muted/5">
                            <div className="flex items-center gap-3">
                                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                                    <Bot className="h-6 w-6 text-primary" />
                                    {isLoading && (
                                        <span className="absolute -right-1 -top-1 flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg tracking-tight">AI Insight</h2>
                                    <p className="text-xs text-muted-foreground font-medium">
                                        Powered by Gemini 2.0
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="rounded-full hover:bg-muted/50 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <ScrollArea className="flex-1 px-6 py-6 font-size-xs text-xs">
                                {isLoading ? (
                                    <div className="space-y-6 animate-pulse">
                                        <div className="flex items-center gap-2 mb-6">
                                            <Sparkles className="h-4 w-4 text-muted-foreground" />
                                            <div className="h-4 bg-muted rounded w-32" />
                                        </div>
                                        <div className="space-y-3">
                                            <div className="h-4 bg-muted/50 rounded w-full" />
                                            <div className="h-4 bg-muted/50 rounded w-[90%]" />
                                            <div className="h-4 bg-muted/50 rounded w-[95%]" />
                                        </div>
                                        <div className="h-32 bg-muted/30 rounded-xl border border-muted/50 w-full mt-6" />
                                    </div>
                                ) : (
                                    <div className="prose prose-sm dark:prose-invert max-w-none 
                                        prose-headings:font-semibold prose-headings:tracking-tight
                                        prose-p:text-muted-foreground prose-p:leading-relaxed
                                        prose-strong:text-foreground prose-strong:font-medium
                                        prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
                                        prose-ul:my-4 prose-li:my-1
                                    ">
                                        <ReactMarkdown>{explanation}</ReactMarkdown>
                                    </div>
                                )}
                            </ScrollArea>
                            {/* Interactive Footer moved inside and made flex-none to fit layout */}
                            <div className="flex-none p-6 space-y-4 bg-gradient-to-t from-background via-background to-transparent">
                                {/* Read Aloud Button - Prominent and Separate */}
                                <Button
                                    variant="outline"
                                    className="w-full h-12 rounded-xl bg-background/50 hover:bg-background/80 border-border/50 backdrop-blur-sm font-medium"
                                    onClick={() => {
                                        const utterance = new SpeechSynthesisUtterance(explanation);
                                        window.speechSynthesis.speak(utterance);
                                    }}
                                >
                                    <Volume2 className="mr-2 h-5 w-5" />
                                    Read Explanation Aloud
                                </Button>

                                {/* Voice Interaction Section */}
                                <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-muted/30 shadow-inner">
                                    {/* Visualizer Layer */}
                                    <div className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none">
                                        <OrbVisualizer isActive={isConnected} volume={volume} />
                                    </div>

                                    <div className="relative z-10 p-5 flex flex-col gap-4">
                                        {/* ... (rest of the footer content) */}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Footer */}
                        <div className="flex-none fixed bottom-0 left-0 right-0 p-6 space-y-4 bg-gradient-to-t from-background via-background to-transparent">
                            {/* Read Aloud Button - Prominent and Separate */}
                            <Button
                                variant="outline"
                                className="w-full h-12 rounded-xl bg-background/50 hover:bg-background/80 border-border/50 backdrop-blur-sm font-medium"
                                onClick={() => {
                                    const utterance = new SpeechSynthesisUtterance(explanation);
                                    window.speechSynthesis.speak(utterance);
                                }}
                            >
                                <Volume2 className="mr-2 h-5 w-5" />
                                Read Explanation Aloud
                            </Button>

                            {/* Voice Interaction Section */}
                            <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-muted/30 shadow-inner">
                                {/* Visualizer Layer */}
                                <div className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none">
                                    <OrbVisualizer isActive={isConnected} volume={volume} />
                                </div>

                                <div className="relative z-10 p-5 flex flex-col gap-4">
                                    {/* Status Info */}
                                    <div className="flex items-center gap-3">
                                        <span className={cn(
                                            "h-3 w-3 rounded-full transition-colors duration-300 flex-shrink-0",
                                            isConnected ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" : "bg-muted-foreground/30"
                                        )} />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                                                {isConnected ? "Live Session" : "Voice Mode"}
                                            </div>
                                            <p className="text-sm font-medium text-foreground/90">
                                                {isConnected ? "Listening for questions..." : "Ask questions about this transaction"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Voice Control Button */}
                                    <Button
                                        size="lg"
                                        variant={isConnected ? "destructive" : "default"}
                                        className={cn(
                                            "w-full h-14 rounded-xl shadow-lg transition-all duration-300 font-semibold",
                                            isConnected ? "hover:scale-[1.02] hover:shadow-red-500/20" : "hover:scale-[1.02] hover:shadow-primary/25"
                                        )}
                                        onClick={handleToggleVoice}
                                    >
                                        {isConnected ? (
                                            <>
                                                <StopCircle className="mr-2 h-5 w-5 fill-current" />
                                                Stop Voice Session
                                            </>
                                        ) : (
                                            <>
                                                <Mic className="mr-2 h-5 w-5" />
                                                Start Voice Session
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
