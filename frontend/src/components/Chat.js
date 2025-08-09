import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import ReactMarkdown from 'react-markdown';

const Chat = () => {
    const [file, setFile] = useState(null);
    const [pdfTextContent, setPdfTextContent] = useState('');
    const [question, setQuestion] = useState('');
    const [historyList, setHistoryList] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [chatHistory, setChatHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const chatHistoryRef = useRef(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get('/chat/history');
                setHistoryList(res.data);
            } catch (err) {
                console.error("Failed to fetch chat history", err);
                setError("Could not load chat history. Your session may have expired.");
            }
        };
        fetchHistory();
    }, []);

    useEffect(() => {
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const handleDeleteChat = async (e, chatIdToDelete) => {
        e.stopPropagation(); 
        if (!window.confirm("Are you sure you want to permanently delete this chat?")) return;

        try {
            await api.delete(`/chat/history/${chatIdToDelete}`);
            setHistoryList(prev => prev.filter(chat => chat._id !== chatIdToDelete));
            if (activeChat?._id === chatIdToDelete) {
                handleNewChat();
            }
        } catch (err) {
            setError("Failed to delete the chat.");
        }
    };

    const handleNewChat = () => {
        setActiveChat(null);
        setChatHistory([]);
        setPdfTextContent('');
        setFile(null);
        setError('');
        const fileInput = document.getElementById('file-upload');
        if (fileInput) fileInput.value = "";
    };

    const handleSelectChat = async (chatId) => {
        if (activeChat?._id === chatId) return; 
        try {
            setIsLoading(true);
            const res = await api.get(`/chat/history/${chatId}`);
            setActiveChat(res.data);
            setChatHistory(res.data.messages);
            setPdfTextContent('Conversation loaded from history.');
            setFile(null);
        } catch (err) {
            setError("Could not load the selected chat.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            handleNewChat(); 
            setFile(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setIsLoading(true);
        const formData = new FormData();
        formData.append('pdf', file);
        try {
            const res = await api.post('/chat/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
            setPdfTextContent(res.data.textContent);
            setChatHistory([{ role: 'assistant', content: `PDF "${file.name}" uploaded. Ask me anything about it.` }]);
        } catch (err) {
            setError('Failed to upload PDF.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleChatSubmit = async (e) => {
        e.preventDefault();
        if (!question.trim() || !pdfTextContent || pdfTextContent.startsWith('Conversation loaded')) return;

        const tempUserMessage = { role: 'user', content: question };
        setChatHistory(prev => [...prev, tempUserMessage]);
        setQuestion('');
        setIsLoading(true);

        try {
            const res = await api.post('/chat/chat', {
                question,
                context: pdfTextContent,
                chatId: activeChat ? activeChat._id : null
            });

            const updatedChat = res.data;
            setActiveChat(updatedChat);
            setChatHistory(updatedChat.messages);

            if (!activeChat) {
                setHistoryList(prev => [updatedChat, ...prev]);
            } else {
                setHistoryList(prev => prev.map(chat => chat._id === updatedChat._id ? { ...chat, title: updatedChat.title } : chat));
            }
        } catch (err) {
            setError('Failed to get a response from the AI.');
            setChatHistory(prev => prev.filter(msg => msg !== tempUserMessage));
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="chat-page-container">
            <button onClick={handleLogout} className="logout-btn">Logout</button>
            <aside className="sidebar">
                <button onClick={handleNewChat} className="new-chat-btn">+ New Chat</button>
                
                <div className="history-list">
                    {historyList.map(chat => (
                        <div key={chat._id} className={`history-item ${activeChat?._id === chat._id ? 'active' : ''}`} onClick={() => handleSelectChat(chat._id)}>
                            <span className="history-title">{chat.title}</span>
                            <button className="delete-chat-btn" onClick={(e) => handleDeleteChat(e, chat._id)}>
                                &#x1F5D1; 
                            </button>
                        </div>
                    ))}
                </div>

                <div className="sidebar-separator"></div>
                
                {!activeChat && (
                    <div className="pdf-controls-container">
                        <h2>PDF Controls</h2>
                        <div className="file-upload-area">
                            <input type="file" id="file-upload" onChange={handleFileChange} accept=".pdf" />
                            <label htmlFor="file-upload">Choose a PDF</label>
                            {file && <p className="file-name">{file.name}</p>}
                        </div>
                        <button onClick={handleUpload} className="upload-btn" disabled={!file || isLoading || !!pdfTextContent}>
                            Upload & Process
                        </button>
                    </div>
                )}
                {pdfTextContent && !pdfTextContent.startsWith('Conversation loaded') && (
                     <div className="pdf-preview-area">
                        <h3>PDF Content</h3>
                        <div className="pdf-preview-content">{pdfTextContent}</div>
                    </div>
                )}
            </aside>
            <main className="chat-container">
                <div className="chat-history" ref={chatHistoryRef}>
                    {chatHistory.length === 0 && !isLoading && <div className="chat-message assistant">Start a new chat by uploading a PDF, or select a previous conversation from the sidebar.</div>}
                    {chatHistory.map((msg, index) => <div key={index} className={`chat-message ${msg.role}`}><ReactMarkdown>{msg.content}</ReactMarkdown></div>)}
                    {isLoading && <div className="loading-indicator">AI is thinking...</div>}
                </div>
                {error && <div className="error-message full-width">{error}</div>}
                <form onSubmit={handleChatSubmit} className="chat-input-area">
                    <input
                        type="text" value={question} onChange={(e) => setQuestion(e.target.value)}
                        placeholder={pdfTextContent && !pdfTextContent.startsWith('Conversation loaded') ? "Ask a question about the PDF..." : "Please start a new chat."}
                        disabled={!pdfTextContent || isLoading || pdfTextContent.startsWith('Conversation loaded')}
                    />
                    <button type="submit" disabled={!question.trim() || isLoading || pdfTextContent.startsWith('Conversation loaded')}>Send</button>
                </form>
            </main>
        </div>
    );
};

export default Chat;