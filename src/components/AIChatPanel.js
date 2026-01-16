/**
 * AI Chat Panel Component
 * Interactive chat interface for asking AI questions about screen time
 */

import React, { useState, useRef, useEffect } from 'react';

const SendIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);

const SparkleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3v18M3 12h18M5.636 5.636l12.728 12.728M18.364 5.636L5.636 18.364" />
    </svg>
);

const suggestedQuestions = [
    "Why did my screen time spike last week?",
    "Which app do I use the most?",
    "How can I reduce my social media usage?",
    "What are my peak usage hours?",
];

function TypingIndicator() {
    return (
        <div className="message-ai" style={{ display: 'inline-block' }}>
            <div className="typing-indicator">
                <span />
                <span />
                <span />
            </div>
        </div>
    );
}

function Message({ message }) {
    const isUser = message.role === 'user';

    return (
        <div
            className="animate-fadeIn"
            style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                marginBottom: '1rem',
            }}
        >
            <div className={isUser ? 'message-user' : 'message-ai'}>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {message.content}
                </p>
            </div>
        </div>
    );
}

export default function AIChatPanel({ onSendMessage, loading = false }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input.trim() };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:8000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: userMessage.content }),
            });

            const data = await response.json();
            const aiMessage = { role: 'assistant', content: data.answer };
            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage = {
                role: 'assistant',
                content: 'Sorry, I couldn\'t connect to the AI service. Please make sure the backend is running.',
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSuggestedClick = (question) => {
        setInput(question);
    };

    return (
        <div
            style={{
                background: 'var(--bg-card)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                height: '500px',
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                }}
            >
                <div
                    style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--gradient-purple)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                    }}
                >
                    <SparkleIcon />
                </div>
                <div>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        Ask AI
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Get personalized insights about your screen time
                    </p>
                </div>
            </div>

            {/* Messages Area */}
            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1.5rem',
                }}
            >
                {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', paddingTop: '2rem' }}>
                        <div
                            style={{
                                width: '64px',
                                height: '64px',
                                margin: '0 auto 1rem',
                                borderRadius: '50%',
                                background: 'rgba(139, 92, 246, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--accent-primary)',
                            }}
                        >
                            <SparkleIcon />
                        </div>
                        <h4
                            style={{
                                fontSize: '1rem',
                                fontWeight: '600',
                                color: 'var(--text-primary)',
                                marginBottom: '0.5rem',
                            }}
                        >
                            How can I help you today?
                        </h4>
                        <p
                            style={{
                                fontSize: '0.875rem',
                                color: 'var(--text-muted)',
                                marginBottom: '1.5rem',
                            }}
                        >
                            Ask me anything about your screen time habits
                        </p>

                        {/* Suggested Questions */}
                        <div
                            style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '0.5rem',
                                justifyContent: 'center',
                            }}
                        >
                            {suggestedQuestions.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSuggestedClick(q)}
                                    style={{
                                        padding: '0.5rem 0.875rem',
                                        background: 'var(--bg-tertiary)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: 'var(--radius-2xl)',
                                        color: 'var(--text-secondary)',
                                        fontSize: '0.8125rem',
                                        cursor: 'pointer',
                                        transition: 'all 150ms ease',
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--accent-primary)';
                                        e.currentTarget.style.color = 'var(--text-primary)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                    }}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, i) => (
                            <Message key={i} message={msg} />
                        ))}
                        {isLoading && <TypingIndicator />}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input Area */}
            <div
                style={{
                    padding: '1rem 1.5rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'center',
                    }}
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about your screen time..."
                        className="input"
                        style={{ flex: 1 }}
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="btn-primary"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '44px',
                            height: '44px',
                            padding: 0,
                            borderRadius: 'var(--radius-md)',
                        }}
                    >
                        <SendIcon />
                    </button>
                </div>
            </div>
        </div>
    );
}
