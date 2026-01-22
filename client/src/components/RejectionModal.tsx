import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (comment: string) => void;
  itemType: "invoice request" | "expense sheet";
  loading?: boolean;
}

export default function RejectionModal({
  isOpen,
  onClose,
  onConfirm,
  itemType,
  loading = false,
}: RejectionModalProps) {
  const [comment, setComment] = useState("");

  const handleConfirm = () => {
    if (comment.trim()) {
      onConfirm(comment.trim());
      setComment(""); // Reset for next use
    }
  };

  const handleClose = () => {
    setComment("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <i className="fas fa-exclamation-triangle text-red-600"></i>
            <span>Reject {itemType}</span>
          </DialogTitle>
          <DialogDescription>
            Please provide a reason for rejecting this {itemType}. This comment will be visible to everyone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="rejection-comment">Rejection Reason *</Label>
            <Textarea
              id="rejection-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`Explain why you are rejecting this ${itemType}...`}
              className="min-h-[100px]"
              data-testid="textarea-rejection-comment"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              data-testid="button-cancel-rejection"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={!comment.trim() || loading}
              data-testid="button-confirm-rejection"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Rejecting...
                </>
              ) : (
                <>
                  <i className="fas fa-times mr-2"></i>
                  Reject {itemType}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}