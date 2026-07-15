"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Reusable single-text-input dialog. Used for rename, new folder, chmod, etc.
 * `onSubmit` receives the entered value; the caller controls `open`/closing.
 */
export function TextInputDialog({
  open,
  title,
  label,
  initialValue = "",
  placeholder,
  submitLabel = "Save",
  mono = false,
  onSubmit,
  onClose,
}: {
  open: boolean;
  title: string;
  label: string;
  initialValue?: string;
  placeholder?: string;
  submitLabel?: string;
  mono?: boolean;
  onSubmit: (value: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm">{title}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(value);
          }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label htmlFor="text-input-dialog">{label}</Label>
            <Input
              id="text-input-dialog"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className={cn(mono && "font-mono")}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="submit">{submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
