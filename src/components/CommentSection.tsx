import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { toast } from "sonner";
import { MoreHorizontal, Edit2, Trash2, Check, X, Shield, Crown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    name: string;
    email: string;
    profile_picture: string | null;
  };
  user_role?: string; // Add this for role info
}

interface CommentSectionProps {
  announcementId: string;
  orgId: string;
  onCommentAdded?: () => void;
  userAvatar?: string | null;
  userInitials?: string;
}

export function CommentSection({ 
  announcementId, 
  orgId,
  onCommentAdded,
  userAvatar,
  userInitials 
}: CommentSectionProps) {
  const { user } = useAuth();
  const { isLeader, isAdmin, isSAO } = useUserRole(orgId);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [userRoles, setUserRoles] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchComments();
  }, [announcementId]);

  // Fetch user roles for each comment
  useEffect(() => {
    const fetchUserRoles = async () => {
      const userIds = [...new Set(comments.map(c => c.user_id))];
      const roles: Record<string, string> = {};
      
      for (const userId of userIds) {
        const { data } = await supabase
          .from("memberships")
          .select("role")
          .eq("org_id", orgId)
          .eq("user_id", userId)
          .eq("status", "accepted")
          .maybeSingle();
        
        if (data) {
          roles[userId] = data.role;
        }
      }
      
      setUserRoles(roles);
    };
    
    if (comments.length > 0) {
      fetchUserRoles();
    }
  }, [comments, orgId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          profiles:user_id (
            name,
            email,
            profile_picture
          )
        `)
        .eq("announcement_id", announcementId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      toast.error("Please sign in to comment");
      return;
    }

    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("comments").insert({
        announcement_id: announcementId,
        user_id: user.id,
        content: newComment.trim(),
      });

      if (error) throw error;

      setNewComment("");
      await fetchComments();
      onCommentAdded?.();
      toast.success("Comment posted");
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      const { error } = await supabase
        .from("comments")
        .update({ 
          content: editContent.trim(),
          updated_at: new Date().toISOString()
        })
        .eq("id", commentId);

      if (error) throw error;

      setEditingCommentId(null);
      setEditContent("");
      await fetchComments();
      toast.success("Comment updated");
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Failed to update comment");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      await fetchComments();
      onCommentAdded?.();
      toast.success("Comment deleted");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  // Check if user can delete a comment (only leaders, admins, SAO, or comment owner)
  const canDeleteComment = (comment: Comment) => {
    // Comment owner can delete their own
    if (comment.user_id === user?.id) return true;
    // Leader can delete any comment in their org
    if (isLeader) return true;
    // Admin or SAO can delete any comment
    if (isAdmin || isSAO) return true;
    return false;
  };

  // Check if user can edit a comment (only the owner)
  const canEditComment = (comment: Comment) => {
    return comment.user_id === user?.id;
  };

  const getRoleBadge = (userId: string) => {
    const role = userRoles[userId];
    if (role === 'leader') {
      return (
        <Badge variant="default" className="bg-yellow-500 text-white text-[10px] px-1.5 py-0 gap-0.5">
          <Crown className="h-2.5 w-2.5" />
          Leader
        </Badge>
      );
    }
    if (role === 'officer') {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0 gap-0.5">
          <Shield className="h-2.5 w-2.5" />
          Officer
        </Badge>
      );
    }
    return null;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Comment List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={comment.profiles?.profile_picture || undefined} />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                {comment.profiles?.name ? getInitials(comment.profiles.name) : 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">
                    {comment.profiles?.name}
                  </span>
                  {getRoleBadge(comment.user_id)}
                  <span className="text-xs text-gray-500">
                    {format(new Date(comment.created_at), "MMM d, h:mm a")}
                  </span>
                </div>

                {(canEditComment(comment) || canDeleteComment(comment)) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canEditComment(comment) && (
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditContent(comment.content);
                          }}
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {canDeleteComment(comment) && (
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {editingCommentId === comment.id ? (
                <div className="mt-2 space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[60px] text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleEditComment(comment.id)}
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingCommentId(null);
                        setEditContent("");
                      }}
                    >
                      <X className="mr-1 h-3 w-3" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              )}
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <p className="text-center text-gray-500 py-4">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>

      {/* Comment Input */}
      {user && (
        <div className="flex gap-3 pt-4 border-t">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={userAvatar || undefined} />
            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
              {userInitials || user?.email?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 flex gap-2">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[60px] text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
            />
            <Button 
              onClick={handleSubmitComment} 
              disabled={submitting || !newComment.trim()}
              size="sm"
              className="self-start"
            >
              {submitting ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}