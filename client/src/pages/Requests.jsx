import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { requestsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Loader2, Plus, MessageSquare, CheckCircle, XCircle, Clock, Send, User as UserIcon } from 'lucide-react';
import { cn } from '../lib/utils';

const Requests = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Create Request State
    const [company, setCompany] = useState('');
    const [initialMessage, setInitialMessage] = useState('');
    const [error, setError] = useState('');

    // Chat / Message State
    const [messageInputs, setMessageInputs] = useState({}); // Map of requestId -> input value

    // Fetch Requests (Public)
    const { data: requestsData, isLoading } = useQuery({
        queryKey: ['requests'],
        queryFn: () => requestsAPI.getAll(),
        staleTime: 5 * 60 * 1000,
        enabled: !!user,
    });

    const requests = requestsData?.data?.data || [];

    // Create Request Mutation
    const createMutation = useMutation({
        mutationFn: (data) => requestsAPI.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['requests']);
            setIsDialogOpen(false);
            setCompany('');
            setInitialMessage('');
            setError('');
        },
        onError: (err) => {
            setError(err.response?.data?.message || 'Failed to create request');
        }
    });

    // Add Message Mutation
    const messageMutation = useMutation({
        mutationFn: ({ id, content }) => requestsAPI.addMessage(id, { content }),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries(['requests']);
            setMessageInputs(prev => ({ ...prev, [variables.id]: '' }));
        },
        onError: (err) => {
            alert(err.response?.data?.message || 'Failed to send message');
        }
    });

    // Update Status Mutation
    const statusMutation = useMutation({
        mutationFn: ({ id, status }) => requestsAPI.updateStatus(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries(['requests']);
        },
        onError: (err) => {
            alert(err.response?.data?.message || 'Failed to update status');
        }
    });

    const handleCreate = (e) => {
        e.preventDefault();
        if (!company.trim()) {
            setError('Company name is required');
            return;
        }
        createMutation.mutate({ company, message: initialMessage });
    };

    const handleSendMessage = (requestId) => {
        const content = messageInputs[requestId];
        if (!content?.trim()) return;
        messageMutation.mutate({ id: requestId, content });
    };

    const handleInputChange = (requestId, value) => {
        setMessageInputs(prev => ({ ...prev, [requestId]: value }));
    };

    const openCreateDialog = () => {
        if (!user) {
            navigate('/login');
        } else {
            setIsDialogOpen(true);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-50 border-green-200';
            case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle className="h-4 w-4 mr-1" />;
            case 'rejected': return <XCircle className="h-4 w-4 mr-1" />;
            default: return <Clock className="h-4 w-4 mr-1" />;
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="bg-white min-h-screen">
            <main className="container mx-auto px-4 py-12 max-w-4xl">

                {/* Unauthenticated View */}
                {!user && (
                    <div className="flex flex-col items-center justify-center text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                            <UserIcon className="h-8 w-8 text-black" />
                        </div>
                        <h2 className="text-2xl font-bold text-black mb-2">Login Required</h2>
                        <p className="text-gray-500 max-w-md mb-8">
                            Please login to view your requests or submit a new one. Tracking your company requests helps us prioritize updates.
                        </p>
                        <Button onClick={() => navigate('/login')} className="px-8">
                            Login to Continue
                        </Button>
                    </div>
                )}

                {/* Authenticated View */}
                {user && (
                    <>


                        {/* Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-black mb-2">Company Requests</h1>
                                <p className="text-neutral-500">
                                    Request companies and chat with admins about updates.
                                </p>
                            </div>
                            <Button onClick={openCreateDialog} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Request Company
                            </Button>
                        </div>

                        {/* Create Request Dialog */}
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Request a Company</DialogTitle>
                                    <DialogDescription>
                                        Start a request thread. You can discuss details with admins here.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleCreate} className="space-y-4 py-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Company Name</label>
                                        <Input
                                            value={company}
                                            onChange={(e) => setCompany(e.target.value)}
                                            placeholder="e.g. Netflix, Uber"
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Initial Message</label>
                                        <Textarea
                                            value={initialMessage}
                                            onChange={(e) => setInitialMessage(e.target.value)}
                                            placeholder="e.g. 'Please add the 2024 graph questions'"
                                            rows={3}
                                        />
                                    </div>
                                    {error && <p className="text-red-500 text-sm">{error}</p>}
                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={createMutation.isPending}>
                                            {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                            Submit
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {/* Requests List */}
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                            </div>
                        ) : requests.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                                <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                <h3 className="font-medium text-gray-900">No requests yet</h3>
                                <p className="text-gray-500 text-sm mb-4">Be the first to start a conversation!</p>
                                <Button variant="outline" onClick={openCreateDialog}>Request Now</Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {requests.map((req) => {
                                    // Check if closed
                                    const isClosed = req.status === 'completed' || req.status === 'rejected';
                                    // Admins can still reply roughly always, but let's say admins *can* reply to closed requests to explain? 
                                    // Or should we strict block? User requirement: "user can not send messgae".
                                    // I'll allow admins to bypass the UI lock, or maybe just lock for non-admins.
                                    const canReply = user && (user.role === 'admin' || !isClosed);

                                    return (
                                        <div key={req._id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                                            {/* Card Header */}
                                            <div className="bg-gray-50 p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="font-bold text-lg text-black">{req.company}</h3>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(req.status)} uppercase tracking-wide`}>
                                                            {getStatusIcon(req.status)}
                                                            {req.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                        <UserIcon className="h-3 w-3" />
                                                        <span className="font-medium">{req.user?.name || 'Unknown User'}</span>
                                                        {/* Show email to Admin AND to the user themselves (if logged in and matches) */}
                                                        {(user?.role === 'admin' || user?._id === req.user?._id) && req.user?.email && (
                                                            <span className="text-gray-400">({req.user.email})</span>
                                                        )}
                                                        <span>•</span>
                                                        <span>{formatDate(req.createdAt)}</span>
                                                    </div>
                                                </div>

                                                {/* Admin Status Controls */}
                                                {user?.role === 'admin' && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-gray-500">Status:</span>
                                                        <Select
                                                            value={req.status}
                                                            onValueChange={(val) => statusMutation.mutate({ id: req._id, status: val })}
                                                        >
                                                            <SelectTrigger className="w-[130px] h-8 text-xs bg-white">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="pending">Pending</SelectItem>
                                                                <SelectItem value="completed">Completed</SelectItem>
                                                                <SelectItem value="rejected">Rejected</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Chat / Messages Area */}
                                            <div className="p-4 bg-white space-y-4">
                                                {req.messages && req.messages.length > 0 ? (
                                                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                        {req.messages.map((msg, idx) => {
                                                            const isMe = user && msg.sender?._id === user._id;
                                                            const isAdmin = msg.sender?.role === 'admin';

                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    className={cn(
                                                                        "flex flex-col max-w-[85%]",
                                                                        isMe ? "ml-auto items-end" : "items-start"
                                                                    )}
                                                                >
                                                                    <div
                                                                        className={cn(
                                                                            "px-4 py-2 rounded-2xl text-sm shadow-sm",
                                                                            isMe
                                                                                ? "bg-black text-white rounded-tr-sm"
                                                                                : isAdmin
                                                                                    ? "bg-blue-50 border border-blue-100 text-blue-900 rounded-tl-sm"
                                                                                    : "bg-gray-100 text-gray-800 rounded-tl-sm"
                                                                        )}
                                                                    >
                                                                        {msg.content}
                                                                    </div>
                                                                    <div className="flex items-center gap-1 mt-1 px-1">
                                                                        <span className="text-[10px] text-gray-400 font-medium">
                                                                            {msg.sender?.name || 'User'} {isAdmin && '(Admin)'}
                                                                        </span>
                                                                        <span className="text-[10px] text-gray-300">•</span>
                                                                        <span className="text-[10px] text-gray-300">
                                                                            {formatDate(msg.createdAt)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-400 italic text-center py-2">No messages yet.</p>
                                                )}

                                                {/* Message Input */}
                                                {user && (
                                                    <div className="border-t border-gray-50 mt-2">
                                                        {canReply ? (
                                                            <div className="flex gap-2 items-end pt-2">
                                                                <div className="flex-1 relative">
                                                                    <Textarea
                                                                        value={messageInputs[req._id] || ''}
                                                                        onChange={(e) => handleInputChange(req._id, e.target.value)}
                                                                        placeholder="Type a message..."
                                                                        className="min-h-[40px] h-[40px] py-2 resize-none pr-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                                e.preventDefault();
                                                                                handleSendMessage(req._id);
                                                                            }
                                                                        }}
                                                                    />
                                                                </div>
                                                                <Button
                                                                    size="icon"
                                                                    className="h-[40px] w-[40px] shrink-0 rounded-lg"
                                                                    onClick={() => handleSendMessage(req._id)}
                                                                    disabled={!messageInputs[req._id]?.trim() || messageMutation.isPending}
                                                                >
                                                                    {messageMutation.isPending && messageInputs[req._id] ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <Send className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <div className="pt-2 text-center">
                                                                <p className="text-sm text-gray-400 bg-gray-50 py-2 rounded-lg">
                                                                    {req.status === 'completed' ? 'Request marked as completed' : 'Request rejected'} • Thread closed
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default Requests;
