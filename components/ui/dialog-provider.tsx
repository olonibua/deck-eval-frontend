'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Button } from './button';
import { Dialog, DialogContent } from './dialog';
import { Input, Label } from './form';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

export interface PromptOptions {
  title: string;
  description?: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  type?: 'text' | 'url' | 'email';
}

type Request =
  | { kind: 'confirm'; options: ConfirmOptions; resolve: (value: boolean) => void }
  | { kind: 'prompt'; options: PromptOptions; resolve: (value: string | null) => void };

interface DialogApi {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
}

const DialogContext = createContext<DialogApi | null>(null);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<Request | null>(null);
  const [value, setValue] = useState('');
  const settled = useRef(false);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        settled.current = false;
        setRequest({ kind: 'confirm', options, resolve });
      }),
    [],
  );

  const prompt = useCallback(
    (options: PromptOptions) =>
      new Promise<string | null>((resolve) => {
        settled.current = false;
        setValue(options.defaultValue ?? '');
        setRequest({ kind: 'prompt', options, resolve });
      }),
    [],
  );

  function settle(accepted: boolean) {
    if (!request || settled.current) return;
    settled.current = true;
    if (request.kind === 'confirm') request.resolve(accepted);
    else request.resolve(accepted ? value.trim() : null);
    setRequest(null);
  }

  const options = request?.options;
  const destructive = request?.kind === 'confirm' && request.options.destructive;

  return (
    <DialogContext.Provider value={{ confirm, prompt }}>
      {children}
      <Dialog open={request !== null} onOpenChange={(open) => !open && settle(false)}>
        {options && (
          <DialogContent title={options.title} description={options.description}>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                settle(true);
              }}
            >
              {request?.kind === 'prompt' && (
                <div className="mb-5">
                  <Label htmlFor="dialog-prompt-input">{request.options.label}</Label>
                  <Input
                    id="dialog-prompt-input"
                    type={request.options.type ?? 'text'}
                    autoFocus
                    value={value}
                    placeholder={request.options.placeholder}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => settle(false)}>
                  {(request?.kind === 'confirm' && request.options.cancelLabel) || 'Cancel'}
                </Button>
                <Button type="submit" variant={destructive ? 'danger' : 'primary'} autoFocus={request?.kind === 'confirm'}>
                  {options.confirmLabel ?? 'Confirm'}
                </Button>
              </div>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </DialogContext.Provider>
  );
}

function useDialogApi() {
  const api = useContext(DialogContext);
  if (!api) throw new Error('Dialog hooks must be used inside DialogProvider');
  return api;
}

export const useConfirm = () => useDialogApi().confirm;
export const usePrompt = () => useDialogApi().prompt;
